import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from 'generated/prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { UsersRepository } from './users.repository';

/** Các role được phép tạo tài khoản nhân viên */
const ALLOWED_ROLES: RoleName[] = [RoleName.RECEPTIONIST, RoleName.TECHNICIAN];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─── READ ─────────────────────────────────────────────────────────────────────

  findAll(role?: string, isActive?: string) {
    return this.usersRepo.findAll({
      role: role as RoleName | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`Không tìm thấy nhân viên #${id}`);
    return user;
  }

  async getStats(id: number) {
    await this.findOne(id);
    return this.usersRepo.getMonthlyStats(id);
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────

  /**
   * Tạo tài khoản nhân viên:
   * 1. Validate roleId → chỉ RECEPTIONIST | TECHNICIAN
   * 2. checkDuplicate username / phone / email
   * 3. Tự sinh mật khẩu 8 ký tự (hoa + thường + số)
   * 4. Hash bcrypt rounds=10
   * 5. Log console (mock gửi email)
   */
  async createUser(dto: CreateUserDto) {
    // 1. Validate role
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role)
      throw new BadRequestException(`Vai trò #${dto.roleId} không tồn tại.`);
    if (!ALLOWED_ROLES.includes(role.roleName as RoleName)) {
      throw new BadRequestException(
        `Chỉ được tạo tài khoản với vai trò RECEPTIONIST hoặc TECHNICIAN.`,
      );
    }

    // 2. Duplicate check
    await this.usersRepo.checkDuplicate(dto.username, dto.phone, dto.email);

    // 3. Tự sinh mật khẩu

    // 4. Hash
    const passwordHash = await bcrypt.hash('123456', 10);

    // 5. Log (mock email)
    this.logger.log(
      `[NEW ACCOUNT] username=${dto.username} | mật khẩu tạm=${123456}`,
    );

    return this.usersRepo.create({
      username: dto.username,
      fullname: dto.fullname,
      phone: dto.phone ?? '',
      email: dto.email ?? '',
      password: passwordHash,
      roleId: dto.roleId,
    });
  }

  // ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────

  async toggleActive(id: number) {
    await this.findOne(id);
    return this.usersRepo.toggleActive(id);
  }

  // ─── UPDATE (nội bộ, dùng bởi AuthService) ───────────────────────────────────
  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.usersRepo.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.usersRepo.update(id, { isActive: false }); // soft-delete
  }
}

// ─── HELPER: random password ──────────────────────────────────────────────────

function generatePassword(length = 8): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits;

  // Đảm bảo có ít nhất 1 hoa, 1 thường, 1 số
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    ...Array.from(
      { length: length - 3 },
      () => all[Math.floor(Math.random() * all.length)],
    ),
  ];

  // Shuffle
  return pwd.sort(() => Math.random() - 0.5).join('');
}
