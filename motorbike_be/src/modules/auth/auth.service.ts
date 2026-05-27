import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../shared/services/redis.service';
import { CustomerRepository } from './customer.repository';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { UserRepository } from './user.repository';

/** OTP TTL: 5 phút (giây) */
const OTP_TTL_SECONDS = 5 * 60;

/** Prefix key Redis cho OTP */
const OTP_KEY_PREFIX = 'otp:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN / STAFF LOGIN
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Đăng nhập nhân viên nội bộ.
   * Verify bcrypt password → sign JWT với payload {sub, role, type:'staff'}
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; user: object }> {
    const user = await this.userRepository.findByUsernameOrEmail(dto.username);
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hoá');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload = {
      sub: user.id,
      role: (user as any).role?.roleName,
      type: 'staff',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: (user as any).role?.roleName,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. CUSTOMER — REGISTER (email + password)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Đăng ký tài khoản khách hàng bằng email + password.
   * Tự động đăng nhập sau khi đăng ký thành công (trả JWT luôn).
   */
  async customerRegister(dto: CustomerRegisterDto): Promise<{
    accessToken: string;
    customer: object;
  }> {
    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await this.customerRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Kiểm tra phone đã tồn tại chưa
    const existingPhone = await this.customerRepository.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('Số điện thoại này đã được đăng ký');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const customer = await this.customerRepository.createWithEmailPassword({
      email: dto.email,
      password: hashedPassword,
      customerName: dto.customerName,
      phone: dto.phone,
    });

    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        customerName: customer.customerName,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. CUSTOMER — LOGIN (email + password)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Đăng nhập khách hàng bằng email + password.
   * Chỉ cho phép tài khoản Customer (không phải staff).
   * Tài khoản tạo qua OTP cũ (không có password) sẽ bị từ chối.
   */
  async customerLogin(dto: CustomerLoginDto): Promise<{
    accessToken: string;
    customer: object;
  }> {
    const customer = await this.customerRepository.findByEmail(dto.email);

    if (!customer) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tài khoản OTP cũ (không có password) → từ chối
    if (!customer.password) {
      throw new UnauthorizedException(
        'Tài khoản này chưa đặt mật khẩu. Vui lòng đăng ký tài khoản mới.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        customerName: customer.customerName,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. CUSTOMER OTP — SEND (giữ lại backward-compat)
  // ────────────────────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const redisKey = `${OTP_KEY_PREFIX}${dto.phone}`;
    await this.redisService.set(redisKey, otp, OTP_TTL_SECONDS);

    this.logger.log(
      `[MOCK SMS] Gửi OTP đến ${dto.phone}: ${otp} (TTL: ${OTP_TTL_SECONDS}s)`,
    );

    return {
      message: `Mã OTP đã được gửi đến ${dto.phone}. Hết hạn sau ${OTP_TTL_SECONDS / 60} phút.`,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5. CUSTOMER OTP — VERIFY (giữ lại backward-compat)
  // ────────────────────────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    customer: object;
    isNewCustomer: boolean;
  }> {
    const redisKey = `${OTP_KEY_PREFIX}${dto.phone}`;
    const storedOtp = await this.redisService.get(redisKey);

    if (!storedOtp) {
      throw new BadRequestException('Mã OTP đã hết hạn hoặc chưa được gửi');
    }

    if (storedOtp !== dto.otp) {
      throw new BadRequestException('Mã OTP không đúng');
    }

    await this.redisService.del(redisKey);

    const existingCustomer = await this.customerRepository.findByPhone(dto.phone);
    const isNewCustomer = !existingCustomer;

    const customer = await this.customerRepository.upsertByPhone(dto.phone);

    const payload = {
      sub: customer.id,
      phone: customer.phone,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      customer: {
        id: customer.id,
        phone: customer.phone,
        customerName: customer.customerName,
      },
      isNewCustomer,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
