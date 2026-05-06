import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Voucher, VoucherStatus } from 'generated/prisma/client';

@Injectable()
export class VouchersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(voucherCode: string): Promise<Voucher | null> {
    return this.prisma.voucher.findUnique({ where: { voucherCode } });
  }

  async findAll(status?: VoucherStatus): Promise<Voucher[]> {
    return this.prisma.voucher.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Voucher | null> {
    return this.prisma.voucher.findUnique({ where: { id } });
  }

  async create(data: any): Promise<Voucher> {
    return this.prisma.voucher.create({ data });
  }

  async update(id: number, data: any): Promise<Voucher> {
    return this.prisma.voucher.update({ where: { id }, data });
  }

  /** Hủy thủ công một voucher */
  async revoke(id: number): Promise<Voucher> {
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.REVOKED },
    });
  }

  /**
   * Cron job: set EXPIRED cho voucher quá hạn.
   * Điều kiện: status=ACTIVE + endDate < now.
   * Trả về số lượng voucher đã cập nhật.
   */
  async revokeExpired(): Promise<number> {
    const result = await this.prisma.voucher.updateMany({
      where: {
        status: VoucherStatus.ACTIVE,
        endDate: { lt: new Date() },
      },
      data: { status: VoucherStatus.EXPIRED },
    });
    return result.count;
  }
}
