import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Banner } from 'generated/prisma/client';

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chỉ trả banner đang active + trong thời hạn.
   * Logic: isActive=true VÀ (không có ngày | ngày hợp lệ)
   */
  async findAllActive(): Promise<Banner[]> {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll(): Promise<Banner[]> {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findById(id: number): Promise<Banner | null> {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  async create(data: any): Promise<Banner> {
    return this.prisma.banner.create({ data });
  }

  async update(id: number, data: any): Promise<Banner> {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.banner.delete({ where: { id } });
  }

  async updateSortOrder(id: number, sortOrder: number): Promise<Banner> {
    return this.prisma.banner.update({
      where: { id },
      data: { sortOrder },
    });
  }
}
