import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../shared/services/redis.service';
import { CustomerRepository } from './customer.repository';
import { LoginDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
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
    // Gọi UserRepository — không gọi Prisma trực tiếp
    const user = await this.userRepository.findByUsernameOrEmail(dto.username);
    console.log('Login identifier:', dto.username);
    console.log('Found user:', user);
    if (!user) {
      console.log('Working');
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hoá');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      console.log('Working');
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
  // 2. CUSTOMER OTP — SEND
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Gửi OTP cho khách hàng.
   * Tạo mã 6 số, lưu Redis TTL 5 phút, log ra console (mock SMS).
   */
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const redisKey = `${OTP_KEY_PREFIX}${dto.phone}`;
    console.log(otp)
    await this.redisService.set(redisKey, otp, OTP_TTL_SECONDS);

    // Mock SMS — log ra console thay vì gọi SMS API thật
    this.logger.log(
      `[MOCK SMS] Gửi OTP đến ${dto.phone}: ${otp} (TTL: ${OTP_TTL_SECONDS}s)`,
    );

    return {
      message: `Mã OTP đã được gửi đến ${dto.phone}. Hết hạn sau ${OTP_TTL_SECONDS / 60} phút.`,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. CUSTOMER OTP — VERIFY
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Xác thực OTP, upsert Customer theo phone, trả JWT.
   */
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

    // OTP đúng → xoá khỏi Redis để tránh dùng lại
    await this.redisService.del(redisKey);

    // Kiểm tra khách hàng đã tồn tại chưa
    const existingCustomer = await this.customerRepository.findByPhone(
      dto.phone,
    );
    const isNewCustomer = !existingCustomer;

    // Upsert: tạo mới nếu chưa có, cập nhật tên nếu có truyền
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

  /** Tạo mã OTP 6 chữ số ngẫu nhiên */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
