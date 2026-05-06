import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Customer } from 'generated/prisma/client';

@Injectable()
export class CustomersRepository extends BaseRepository<Customer> {
  constructor(prisma: PrismaService) {
    super(prisma, 'customer');
  }

  /** Tìm khách hàng theo số điện thoại */
  async findByPhone(phone: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { phone } });
  }

  /** Lấy khách hàng kèm danh sách xe */
  async findByIdWithVehicles(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { vehicles: true },
    });
  }
}
