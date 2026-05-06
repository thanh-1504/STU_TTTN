import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Combo, Service } from 'generated/prisma/client';
import { CreateComboDto } from './dto/create-combos.dto';
import { UpdateComboDto } from './dto/update-combos.dto';

/** Kiểu trả về của Combo kèm mảng Service phẳng */
export type ComboWithServices = Omit<Combo, 'services'> & {
  services: Service[];
};

/**
 * Helper: map Combo (có include services.service) → ComboWithServices phẳng.
 * Prisma schema: Combo.services → ComboService[],  ComboService.service → Service
 */
function flattenServices(raw: any): ComboWithServices {
  return {
    ...raw,
    // Flatten bảng trung gian: ComboService[] → Service[]
    services: (raw.services ?? []).map((cs: any) => cs.service),
  };
}

/** Include object dùng chung cho các query cần kèm services */
const INCLUDE_SERVICES = {
  services: {
    include: { service: true },
    orderBy: { serviceId: 'asc' as const },
  },
} as const;

@Injectable()
export class CombosRepository extends BaseRepository<Combo> {
  constructor(prisma: PrismaService) {
    super(prisma, 'combo');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  async findAllWithServices(onlyActive?: boolean): Promise<ComboWithServices[]> {
    const rows = await this.prisma.combo.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { comboName: 'asc' },
      include: INCLUDE_SERVICES,
    });
    return rows.map(flattenServices);
  }

  /**
   * Lấy danh sách combo kèm services có phân trang (public)
   */
  async findPublicPaginated(
    take?: number,
    skip?: number,
    sortBy?: string,
  ): Promise<{ data: ComboWithServices[]; total: number }> {
    const where = { isActive: true };
    const total = await this.prisma.combo.count({ where });

    let orderBy: any = { comboName: 'asc' };
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const rows = await this.prisma.combo.findMany({
      where,
      orderBy,
      include: INCLUDE_SERVICES,
      take,
      skip,
    });

    return {
      data: rows.map(flattenServices),
      total,
    };
  }

  /**
   * Tìm combo theo ID, kèm services.
   * Override findById của BaseRepository để trả về ComboWithServices.
   */
  async findById(id: number): Promise<ComboWithServices | null> {
    const row = await this.prisma.combo.findUnique({
      where: { id },
      include: INCLUDE_SERVICES,
    });
    if (!row) return null;
    return flattenServices(row);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WRITE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tạo Combo + gắn ComboService trong một transaction.
   * @param comboData Dữ liệu combo (KHÔNG bao gồm serviceIds)
   * @param serviceIds Mảng ID dịch vụ cần gắn vào combo
   */
  async createCombo(
    comboData: Omit<CreateComboDto, 'serviceIds'>,
    serviceIds: number[],
  ): Promise<ComboWithServices> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Tạo Combo
      const newCombo = await tx.combo.create({ data: comboData as any });

      // 2. Tạo các bản ghi ComboService (bảng trung gian N-N)
      await tx.comboService.createMany({
        data: serviceIds.map((serviceId) => ({
          comboId: newCombo.id,
          serviceId,
        })),
        skipDuplicates: true,
      });

      // 3. Trả về combo đầy đủ (với services)
      return tx.combo.findUniqueOrThrow({
        where: { id: newCombo.id },
        include: INCLUDE_SERVICES,
      });
    });

    return flattenServices(result);
  }

  /**
   * Cập nhật Combo + đồng bộ lại danh sách services trong một transaction.
   * Strategy: DELETE toàn bộ ComboService cũ → createMany mới.
   *
   * @param id         ID combo cần cập nhật
   * @param comboData  Dữ liệu combo (KHÔNG bao gồm serviceIds)
   * @param serviceIds Nếu truyền → thay thế toàn bộ. Nếu undefined → giữ nguyên.
   */
  async updateCombo(
    id: number,
    comboData: Omit<UpdateComboDto, 'serviceIds'>,
    serviceIds?: number[],
  ): Promise<ComboWithServices> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật metadata combo
      await tx.combo.update({ where: { id }, data: comboData as any });

      // 2. Đồng bộ services nếu có truyền serviceIds
      if (serviceIds !== undefined) {
        // Xóa toàn bộ liên kết cũ
        await tx.comboService.deleteMany({ where: { comboId: id } });

        // Tạo lại nếu serviceIds không rỗng
        if (serviceIds.length > 0) {
          await tx.comboService.createMany({
            data: serviceIds.map((serviceId) => ({ comboId: id, serviceId })),
            skipDuplicates: true,
          });
        }
      }

      // 3. Trả về combo đầy đủ
      return tx.combo.findUniqueOrThrow({
        where: { id },
        include: INCLUDE_SERVICES,
      });
    });

    return flattenServices(result);
  }

  /**
   * Soft delete: set isActive=false, không xóa bản ghi.
   */
  async softDelete(id: number): Promise<Combo> {
    return this.prisma.combo.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
