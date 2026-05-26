import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class RepairOrderRepository {
  constructor(private prisma: PrismaService) {}

async findOrderWithDetails(orderId: number) {
  return this.prisma.repairOrder.findUnique({
    where: { id: orderId },
    include: {
      services: {
        include: {        // 🔥 PHẢI LÀ INCLUDE (không phải select)
          service: true,  // thông tin service
        },
      },
      items: {
        include: {
          sparePart: true,
        },
      },
      voucher: true,
    },
  });
}

  findVoucherByCode(code: string) {
    return this.prisma.voucher.findUnique({
      where: { voucherCode: code },
    });
  }

  updateVoucher(orderId: number, voucherId: number) {
    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data: { voucherId },
    });
  }

  updatePayment(orderId: number, data: any) {
    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data,
    });
  }
}