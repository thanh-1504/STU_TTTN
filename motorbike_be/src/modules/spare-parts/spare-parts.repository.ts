import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { SparePart } from 'generated/prisma/client';
import { CreateSparePartDto } from './dto/create-spare-parts.dto';
import { UpdateSparePartDto } from './dto/update-spare-parts.dto';

/** Kiểu filter cho findAll */
export interface SparePartFilter {
  belowMinStock?: boolean;
  search?: string; // tìm theo partNumber hoặc partName
}

@Injectable()
export class SparePartsRepository extends BaseRepository<SparePart> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sparePart');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách phụ tùng, hỗ trợ filter:
   * - search: tìm theo partNumber hoặc partName (case-insensitive)
   * - belowMinStock: chỉ lấy những phụ tùng có tồn kho <= ngưỡng cảnh báo
   */
  async findAllParts(filter?: SparePartFilter): Promise<SparePart[]> {
    const where: any = {};

    if (filter?.search) {
      where.OR = [
        { partNumber: { contains: filter.search, mode: 'insensitive' } },
        { partName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // belowMinStock: dùng raw condition vì Prisma không support field-to-field compare
    // Lấy tất cả rồi filter ở JS nếu bật flag này
    const parts = await this.prisma.sparePart.findMany({
      where,
      orderBy: { partName: 'asc' },
    });

    if (filter?.belowMinStock) {
      return parts.filter((p) => p.stockQuantity <= p.minStockLevel);
    }

    return parts;
  }

  /** Tìm phụ tùng theo ID */
  async findPartById(id: number): Promise<SparePart | null> {
    return this.prisma.sparePart.findUnique({ where: { id } });
  }

  /** Tìm phụ tùng theo mã part number (unique) */
  async findByPartNumber(partNumber: string): Promise<SparePart | null> {
    return this.prisma.sparePart.findUnique({ where: { partNumber } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WRITE
  // ─────────────────────────────────────────────────────────────────────────────

  /** Tạo mới phụ tùng */
  async createPart(dto: CreateSparePartDto): Promise<SparePart> {
    return this.prisma.sparePart.create({ data: dto as any });
  }

  /** Cập nhật thông tin phụ tùng (giá, ngưỡng, tên, đơn vị) */
  async updatePart(id: number, dto: UpdateSparePartDto): Promise<SparePart> {
    return this.prisma.sparePart.update({
      where: { id },
      data: dto as any,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STOCK MANAGEMENT (transaction-aware)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tăng số lượng tồn kho.
   * @param tx Prisma transaction client (tùy chọn — dùng khi gọi trong $transaction)
   */
  async incrementStock(
    id: number,
    qty: number,
    tx?: any,
  ): Promise<SparePart> {
    const client = tx ?? this.prisma;
    return client.sparePart.update({
      where: { id },
      data: { stockQuantity: { increment: qty } },
    });
  }

  /**
   * Giảm số lượng tồn kho.
   * Throw BadRequestException nếu tồn kho hiện tại < qty yêu cầu.
   * @param tx Prisma transaction client (tùy chọn)
   */
  async decrementStock(
    id: number,
    qty: number,
    tx?: any,
  ): Promise<SparePart> {
    const client = tx ?? this.prisma;

    // Đọc current stock trước (trong cùng transaction để tránh race condition)
    const part = await client.sparePart.findUnique({ where: { id } });
    if (!part) {
      throw new BadRequestException(`Phụ tùng #${id} không tồn tại.`);
    }

    if (part.stockQuantity < qty) {
      throw new BadRequestException(
        `Phụ tùng "${part.partName}" (${part.partNumber}) chỉ còn ${part.stockQuantity} ${part.unit}, ` +
          `không đủ để xuất ${qty} ${part.unit}.`,
      );
    }

    return client.sparePart.update({
      where: { id },
      data: { stockQuantity: { decrement: qty } },
    });
  }
}
