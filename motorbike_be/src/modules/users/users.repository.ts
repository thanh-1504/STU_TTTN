import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { RoleName, User } from 'generated/prisma/client';

export interface UserFilter {
  role?: RoleName;
  isActive?: boolean;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── READ ────────────────────────────────────────────────────────────────────

  async findAll(filter?: UserFilter): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        ...(filter?.role && { role: { roleName: filter.role } }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
      },
      include: { role: true },
      orderBy: { fullname: 'asc' },
    });
  }

  async findById(id: number): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email } });
  }

  // ─── DUPLICATE CHECK ─────────────────────────────────────────────────────────

  /**
   * Kiểm tra trùng username / phone / email.
   * Throw ConflictException ngay nếu phát hiện trùng.
   * @param excludeId Bỏ qua user này (dùng khi update)
   */
  async checkDuplicate(
    username: string | undefined,
    phone: string | null | undefined,
    email: string | null | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (username) {
      const existing = await this.prisma.user.findFirst({
        where: { username, ...(excludeId && { id: { not: excludeId } }) },
      });
      if (existing) {
        throw new ConflictException(`Username "${username}" đã tồn tại.`);
      }
    }

    if (phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone, ...(excludeId && { id: { not: excludeId } }) },
      });
      if (existing) {
        throw new ConflictException(
          `Số điện thoại "${phone}" đã được dùng bởi tài khoản khác.`,
        );
      }
    }

    if (email) {
      const existing = await this.prisma.user.findFirst({
        where: { email, ...(excludeId && { id: { not: excludeId } }) },
      });
      if (existing) {
        throw new ConflictException(
          `Email "${email}" đã được dùng bởi tài khoản khác.`,
        );
      }
    }
  }

  // ─── WRITE ───────────────────────────────────────────────────────────────────

  async create(data: {
    username: string;
    fullname: string;
    phone: string;
    email: string;
    password: string;
    roleId: number;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: any): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  // ─── STATS ───────────────────────────────────────────────────────────────────

  /**
   * Thống kê hiệu suất kỹ thuật viên trong tháng hiện tại.
   * totalOrders: số phiếu sửa đã PAID được assign cho user này
   * totalRevenue: tổng doanh thu từ các phiếu đó
   */
  async getMonthlyStats(
    userId: number,
  ): Promise<{ totalOrders: number; totalRevenue: number }> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await this.prisma.repairOrder.aggregate({
      _count: { id: true },
      _sum: { paidAmount: true },
      where: {
        technicianId: userId,
        status: 'PAID',
        paidAt: { gte: from, lte: to },
      },
    });

    return {
      totalOrders: result._count.id,
      totalRevenue: Number(result._sum.paidAmount ?? 0),
    };
  }

  // Giữ tương thích backward
  async findAllWithRole(): Promise<User[]> {
    return this.findAll();
  }
}
