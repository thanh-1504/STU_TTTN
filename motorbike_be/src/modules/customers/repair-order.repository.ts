import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { RepairOrder } from 'generated/prisma/client';

/**
 * RepairOrderRepository — không kế thừa BaseRepository vì cần type rõ ràng
 * cho các relation phức tạp (services, items, vehicle, customer).
 */
@Injectable()
export class RepairOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách phiếu sửa chữa của một khách hàng
   * kèm thông tin xe, dịch vụ, phụ tùng (summary).
   */
  async findByCustomerId(customerId: number): Promise<
    (RepairOrder & {
      vehicle: any;
      services: any[];
      items: any[];
    })[]
  > {
    return this.prisma.repairOrder.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        services: {
          include: { service: { select: { serviceName: true, imageUrl: true } } },
        },
        items: {
          include: { sparePart: { select: { partName: true, unit: true } } },
        },
      },
    }) as any;
  }

  /**
   * Lấy chi tiết đầy đủ một phiếu sửa chữa:
   * - services kèm service (tên, giá)
   * - items kèm sparePart (tên, đơn vị)
   * - vehicle
   * - technician (tên)
   * - voucher (nếu có)
   */
  async findDetailById(id: number): Promise<
    | (RepairOrder & {
        vehicle: any;
        technician: any;
        receptionist: any;
        voucher: any;
        services: any[];
        items: any[];
      })
    | null
  > {
    return this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        technician: { select: { fullname: true, phone: true } },
        receptionist: { select: { fullname: true } },
        voucher: { select: { voucherCode: true, discountAmount: true, discountPercent: true } },
        services: {
          include: {
            service: {
              select: {
                serviceName: true,
                durationMinutes: true,
                imageUrl: true,
              },
            },
          },
        },
        items: {
          include: {
            sparePart: {
              select: { partName: true, partNumber: true, unit: true },
            },
          },
        },
      },
    }) as any;
  }

  /**
   * Kiểm tra phiếu có thuộc về customerId không (để guard route).
   */
  async findByIdAndCustomerId(
    id: number,
    customerId: number,
  ): Promise<RepairOrder | null> {
    return this.prisma.repairOrder.findFirst({
      where: { id, customerId },
    });
  }
}
