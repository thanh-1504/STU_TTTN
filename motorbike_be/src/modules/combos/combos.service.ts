import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CombosRepository, ComboWithServices } from './combos.repository';
import { ServicesRepository } from '../services/services.repository';
import { CreateComboDto } from './dto/create-combos.dto';
import { UpdateComboDto } from './dto/update-combos.dto';

@Injectable()
export class CombosService {
  constructor(
    private readonly combosRepository: CombosRepository,
    private readonly servicesRepository: ServicesRepository,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /combos — Lấy tất cả combo đang hoạt động kèm services (public) */
  async findAllPublic(take?: number, skip?: number, sortBy?: string): Promise<{ data: ComboWithServices[]; total: number }> {
    return this.combosRepository.findPublicPaginated(take, skip, sortBy);
  }

  /** GET /combos/:id — Lấy combo public chi tiết */
  async findOnePublic(id: number): Promise<ComboWithServices> {
    const combo = await this.combosRepository.findById(id);
    if (!combo) throw new NotFoundException(`Không tìm thấy gói combo #${id}`);
    return combo;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /admin/combos — Lấy tất cả combo (kể cả inactive) kèm services */
  async findAll(): Promise<ComboWithServices[]> {
    return this.combosRepository.findAllWithServices();
  }

  /** GET /admin/combos/:id */
  async findOne(id: number): Promise<ComboWithServices> {
    const combo = await this.combosRepository.findById(id);
    if (!combo) throw new NotFoundException(`Không tìm thấy gói combo #${id}`);
    return combo;
  }

  /**
   * POST /admin/combos — Tạo combo mới kèm danh sách services.
   * Validate tất cả serviceIds phải tồn tại trước khi tạo.
   */
  async create(dto: CreateComboDto): Promise<ComboWithServices> {
    const { serviceIds, ...comboData } = dto;
    await this.validateServiceIds(serviceIds);
    return this.combosRepository.createCombo(comboData as any, serviceIds);
  }

  /**
   * PATCH /admin/combos/:id — Cập nhật combo.
   * Nếu truyền serviceIds → validate rồi đồng bộ lại.
   */
  async update(id: number, dto: UpdateComboDto): Promise<ComboWithServices> {
    await this.ensureExists(id);
    const { serviceIds, ...comboData } = dto;

    if (serviceIds !== undefined && serviceIds.length > 0) {
      await this.validateServiceIds(serviceIds);
    } else if (serviceIds !== undefined && serviceIds.length === 0) {
      throw new BadRequestException('Combo phải có ít nhất 1 dịch vụ');
    }

    return this.combosRepository.updateCombo(id, comboData as any, serviceIds);
  }

  /**
   * DELETE /admin/combos/:id — Soft delete combo (set isActive=false).
   */
  async softDelete(id: number) {
    await this.ensureExists(id);
    return this.combosRepository.softDelete(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async ensureExists(id: number): Promise<ComboWithServices> {
    const combo = await this.combosRepository.findById(id);
    if (!combo) throw new NotFoundException(`Không tìm thấy gói combo #${id}`);
    return combo;
  }

  /**
   * Kiểm tra tất cả serviceIds đều tồn tại trong DB.
   * Nếu có ID nào không tồn tại → BadRequestException.
   */
  private async validateServiceIds(serviceIds: number[]): Promise<void> {
    const results = await Promise.all(
      serviceIds.map((id) => this.servicesRepository.findByIdService(id)),
    );
    const invalidIds = serviceIds.filter((_, i) => results[i] === null);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Dịch vụ không tồn tại: ID ${invalidIds.join(', ')}`,
      );
    }
  }
}
