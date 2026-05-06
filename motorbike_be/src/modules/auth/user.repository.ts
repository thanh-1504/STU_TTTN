import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../shared/services/prisma.service';

/**
 * UserRepository — chỉ wrap Prisma calls, không có business logic.
 * AuthService dùng repository này, KHÔNG gọi PrismaService trực tiếp.
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  /** Tìm nhân viên theo username (dùng để đăng nhập) */
  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  /** Tìm nhân viên theo username HOẶC email (hỗ trợ đăng nhập linh hoạt) */
  findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: { role: true },
    });
  }

  /** Tìm nhân viên theo ID (dùng trong JWT strategy validate) */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }
}
