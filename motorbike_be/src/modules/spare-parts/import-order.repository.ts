import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ImportOrder } from 'generated/prisma/client';
import { ImportItemData } from './dto/create-import-order.dto';

/**
 * ImportOrderRepository — không kế thừa BaseRepository
 * vì luôn cần include relations phức tạp.
 */
@Injectable()
export class ImportOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy tất cả phiếu nhập kho kèm admin + items + sparePart
   */
  async findAll(): Promise<any[]> {
    return this.prisma.importOrder.findMany({
      orderBy: { importDate: 'desc' },
      include: {
        admin: { select: { id: true, fullname: true, username: true } },
        items: {
          include: {
            sparePart: {
              select: { partNumber: true, partName: true, unit: true },
            },
          },
        },
      },
    });
  }

  /**
   * Lấy chi tiết một phiếu nhập kho
   */
  async findById(id: number): Promise<any | null> {
    return this.prisma.importOrder.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, fullname: true, username: true } },
        items: {
          include: {
            sparePart: {
              select: {
                id: true,
                partNumber: true,
                partName: true,
                unit: true,
                stockQuantity: true,
              },
            },
          },
        },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WRITE (transaction-aware)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tạo ImportOrder + các ImportItem trong cùng transaction.
   * totalAmount được tính sẵn từ Service.
   *
   * @param notes      Ghi chú phiếu nhập
   * @param items      Danh sách mặt hàng nhập
   * @param adminId    ID admin lập phiếu
   * @param totalAmount Tổng tiền (tính bên Service)
   * @param tx         Prisma transaction client
   */
  async createWithItems(
    notes: string | undefined,
    items: ImportItemData[],
    adminId: number,
    totalAmount: number,
    tx: any,
  ): Promise<ImportOrder & { items: any[] }> {
    // 1. Tạo ImportOrder
    const order = await tx.importOrder.create({
      data: {
        notes: notes ?? null,
        adminId,
        totalAmount,
      },
    });

    // 2. Tạo các ImportItem
    await tx.importItem.createMany({
      data: items.map((item) => ({
        importOrderId: order.id,
        sparePartId: item.sparePartId,
        quantity: item.quantity,
        importPrice: item.importPrice,
      })),
    });

    // 3. Trả về phiếu đầy đủ (cần findUnique trong tx)
    return tx.importOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        items: {
          include: {
            sparePart: {
              select: { partNumber: true, partName: true, unit: true },
            },
          },
        },
      },
    });
  }
}
