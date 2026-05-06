import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Customer } from 'generated/prisma/client';

/**
 * CustomerRepository — chỉ wrap Prisma calls, không có business logic.
 */
@Injectable()
export class CustomerRepository extends BaseRepository<Customer> {
  constructor(prisma: PrismaService) {
    super(prisma, 'customer');
  }

  /** Tìm khách hàng theo số điện thoại */
  async findByPhone(phone: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { phone } });
  }

  /**
   * Upsert khách hàng theo phone:
   * - Nếu chưa tồn tại → tạo mới với customerName (hoặc phone làm tên tạm)
   * - Nếu đã tồn tại → giữ nguyên (hoặc cập nhật tên nếu truyền vào)
   */
  async upsertByPhone(phone: string, customerName?: string): Promise<Customer> {
    const name = customerName || phone; // fallback tên = số điện thoại
    return this.prisma.customer.upsert({
      where: { phone },
      create: { phone, customerName: name },
      update: customerName ? { customerName } : {},
    });
  }
}
