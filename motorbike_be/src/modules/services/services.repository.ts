import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Service } from 'generated/prisma/client';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-services.dto';

@Injectable()
export class ServicesRepository extends BaseRepository<Service> {
  constructor(prisma: PrismaService) {
    super(prisma, 'service');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách dịch vụ.
   * @param onlyActive true → chỉ lấy dịch vụ đang hoạt động
   */
  async findAllServices(onlyActive?: boolean): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { serviceName: 'asc' },
    });
  }

  /** Tìm dịch vụ theo ID */
  async findByIdService(id: number): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WRITE
  // ─────────────────────────────────────────────────────────────────────────────

  /** Tạo mới dịch vụ */
  async createService(dto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({ data: dto as any });
  }

  /** Cập nhật thông tin dịch vụ */
  async updateService(id: number, dto: UpdateServiceDto): Promise<Service> {
    return this.prisma.service.update({
      where: { id },
      data: dto as any,
    });
  }

  /**
   * Soft delete: chỉ set isActive=false, không xóa bản ghi.
   * Business rule kiểm tra combo được xử lý trong Service layer.
   */
  async softDelete(id: number): Promise<Service> {
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER QUERIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Đếm số combo đang ACTIVE chứa dịch vụ này.
   * Dùng để kiểm tra trước khi soft-delete dịch vụ.
   */
  async countActiveCombosByServiceId(serviceId: number): Promise<number> {
    return this.prisma.comboService.count({
      where: {
        serviceId,
        combo: { isActive: true },
      },
    });
  }

  /**
   * Kiểm tra dịch vụ đã được sử dụng trong lịch hẹn (Appointment)
   * hoặc phiếu sửa chữa (RepairOrder) chưa.
   * Nếu có thì không nên xóa vĩnh viễn để tránh mất dữ liệu lịch sử.
   */
  async countUsageByServiceId(serviceId: number): Promise<number> {
    // Sử dụng trong phiếu sửa chữa
    const repairCount = await this.prisma.repairOrderService.count({
      where: { serviceId },
    });
    return repairCount;
  }
}
