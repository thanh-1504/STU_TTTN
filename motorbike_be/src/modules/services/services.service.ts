import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Service } from 'generated/prisma/client';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /services — Danh sách dịch vụ đang hoạt động (public) */
  async findAllPublic(): Promise<Service[]> {
    return this.servicesRepository.findAllServices(true);
  }

  /** GET /services/:id — Chi tiết dịch vụ (public, chỉ active) */
  async findOnePublic(id: number): Promise<Service> {
    const service = await this.servicesRepository.findByIdService(id);
    if (!service || !service.isActive) {
      throw new NotFoundException(`Không tìm thấy dịch vụ #${id}`);
    }
    return service;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /admin/services — Tất cả dịch vụ kể cả inactive */
  async findAll(): Promise<Service[]> {
    return this.servicesRepository.findAllServices();
  }

  /** POST /admin/services — Tạo dịch vụ mới */
  async create(dto: CreateServiceDto): Promise<Service> {
    return this.servicesRepository.createService(dto);
  }

  /** PATCH /admin/services/:id — Cập nhật thông tin dịch vụ */
  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    await this.ensureExists(id);
    return this.servicesRepository.updateService(id, dto);
  }

  /**
   * DELETE /admin/services/:id
   *
   * Quy tắc:
   * 1. Nếu đang dùng trong combo active → 400 (phải xóa khỏi combo trước)
   * 2. Nếu có trong lịch sử phiếu sửa chữa → chỉ deactivate, trả về
   *    { wasDeactivated: true, service, reason } để FE hiện cảnh báo
   * 3. Không có usage → soft-delete bình thường (isActive = false)
   */
  async softDelete(
    id: number,
  ): Promise<{ wasDeactivated: boolean; service: Service; reason?: string }> {
    await this.ensureExists(id);

    // Rule 1: combo đang active
    const comboCount =
      await this.servicesRepository.countActiveCombosByServiceId(id);
    if (comboCount > 0) {
      throw new BadRequestException(
        `Không thể xóa: Dịch vụ đang được sử dụng trong ${comboCount} gói combo đang hoạt động. ` +
          `Vui lòng xóa dịch vụ khỏi các combo trước.`,
      );
    }

    // Rule 2: đã tồn tại trong lịch sử phiếu sửa chữa
    const usageCount =
      await this.servicesRepository.countUsageByServiceId(id);
    if (usageCount > 0) {
      const service = await this.servicesRepository.updateService(id, {
        isActive: false,
      } as any);
      return {
        wasDeactivated: true,
        service,
        reason: `Dịch vụ này đã xuất hiện trong ${usageCount} phiếu sửa chữa. Hệ thống đã tự động chuyển sang "Ngừng kinh doanh" thay vì xóa vĩnh viễn để bảo toàn dữ liệu lịch sử.`,
      };
    }

    // Rule 3: xóa bình thường
    const service = await this.servicesRepository.softDelete(id);
    return { wasDeactivated: false, service };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async ensureExists(id: number): Promise<Service> {
    const service = await this.servicesRepository.findByIdService(id);
    if (!service) {
      throw new NotFoundException(`Không tìm thấy dịch vụ #${id}`);
    }
    return service;
  }
}
