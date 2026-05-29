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

  /** Tìm khách hàng theo email */
  async findByEmail(email: string): Promise<Customer | null> {
    const normalized = email.trim().toLowerCase();
    return this.prisma.customer.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' } },
    });
  }

  /** Tìm khách hàng theo ID */
  async findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  /**
   * Upsert khách hàng theo phone (OTP flow cũ):
   * - Nếu chưa tồn tại → tạo mới
   * - Nếu đã tồn tại → giữ nguyên (hoặc cập nhật tên nếu truyền vào)
   */
  async upsertByPhone(phone: string, customerName?: string): Promise<Customer> {
    const name = customerName || phone;
    return this.prisma.customer.upsert({
      where: { phone },
      create: { phone, customerName: name },
      update: customerName ? { customerName } : {},
    });
  }

  /** Tạo khách hàng mới với email + password (đã hash) */
  async createWithEmailPassword(data: {
    email: string;
    password: string;
    customerName: string;
    phone: string;
  }): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        email: data.email,
        password: data.password,
        customerName: data.customerName,
        phone: data.phone,
      },
    });
  }
}

