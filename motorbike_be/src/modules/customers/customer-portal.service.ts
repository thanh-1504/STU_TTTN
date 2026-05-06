import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { RepairOrderRepository } from './repair-order.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import {
  PortalCreateVehicleDto,
  UpdateKmDto,
  CreatePortalReviewDto,
} from './dto/portal.dto';
import { AppointmentStatus, RepairOrderStatus } from 'generated/prisma/client';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly repairOrderRepo: RepairOrderRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly appointmentsRepo: AppointmentsRepository,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // VEHICLE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /portal/vehicles — Danh sách xe của customer */
  async getMyVehicles(customerId: number) {
    return this.vehiclesRepo.findByCustomerId(customerId);
  }

  /**
   * POST /portal/vehicles — Thêm xe mới.
   * Validate biển số chưa tồn tại trong hệ thống.
   */
  async addVehicle(dto: PortalCreateVehicleDto, customerId: number) {
    const normalized = dto.licensePlate.toUpperCase().replace(/\s/g, '');

    const existing = await this.vehiclesRepo.findByLicensePlate(normalized);
    if (existing) {
      throw new BadRequestException(
        `Biển số ${normalized} đã được đăng ký trong hệ thống.`,
      );
    }

    return this.vehiclesRepo.createVehicle({
      licensePlate: normalized,
      brand: dto.brand,
      vehicleType: dto.vehicleType as any,
      model: dto.model,
      currentKm: dto.currentKm,
      notes: dto.notes,
      customerId,
    });
  }

  /**
   * PATCH /portal/vehicles/:id/km — Cập nhật số KM.
   * Kiểm tra xe thuộc về customer.
   */
  async updateKm(id: number, dto: UpdateKmDto, customerId: number) {
    await this.ensureVehicleOwner(id, customerId);
    return this.vehiclesRepo.updateKm(id, dto.currentKm);
  }

  /**
   * DELETE /portal/vehicles/:id — Xóa xe.
   * Kiểm tra: xe phải thuộc customer + không có phiếu sửa active.
   */
  async deleteVehicle(id: number, customerId: number) {
    await this.ensureVehicleOwner(id, customerId);

    const activeCount = await this.vehiclesRepo.countActiveRepairOrders(id);
    if (activeCount > 0) {
      throw new BadRequestException(
        `Xe này đang có ${activeCount} phiếu sửa chữa chưa hoàn tất. Không thể xóa.`,
      );
    }

    await this.vehiclesRepo.deleteVehicle(id);
    return { message: 'Xóa xe thành công.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /portal/appointments — Lịch hẹn của customer */
  async getMyAppointments(customerId: number) {
    return this.appointmentsRepo.findByCustomerId(customerId);
  }

  /**
   * PATCH /portal/appointments/:id/cancel — Hủy lịch hẹn.
   * Chỉ hủy khi status = PENDING.
   */
  async cancelAppointment(id: number, customerId: number) {
    const appt = await this.appointmentsRepo.findByCustomerId(customerId);
    const target = appt.find((a) => a.id === id);

    if (!target) {
      throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    }

    if (target.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể hủy lịch đang ở trạng thái PENDING. ` +
          `Trạng thái hiện tại: ${target.status}`,
      );
    }

    return this.appointmentsRepo.update(id, {
      status: AppointmentStatus.CANCELLED,
    } as any);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPAIR ORDERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /portal/repair-orders — Lịch sử phiếu sửa chữa */
  async getMyRepairOrders(customerId: number) {
    return this.repairOrderRepo.findByCustomerId(customerId);
  }

  /**
   * GET /portal/repair-orders/:id — Chi tiết phiếu.
   * Kiểm tra phiếu thuộc về customer.
   */
  async getRepairOrderDetail(id: number, customerId: number) {
    // Guard ownership
    const owned = await this.repairOrderRepo.findByIdAndCustomerId(id, customerId);
    if (!owned) {
      throw new NotFoundException(`Không tìm thấy phiếu sửa chữa #${id}`);
    }

    const detail = await this.repairOrderRepo.findDetailById(id);
    return detail;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REVIEWS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /portal/reviews — Gửi đánh giá.
   * Điều kiện:
   *  1. Phiếu sửa chữa phải tồn tại và thuộc customer này
   *  2. Phiếu phải ở trạng thái PAID
   *  3. Customer chưa đánh giá trước đó
   */
  async createReview(dto: CreatePortalReviewDto, customerId: number) {
    // 1. Kiểm tra phiếu thuộc customer
    const order = await this.repairOrderRepo.findByIdAndCustomerId(
      dto.repairOrderId,
      customerId,
    );
    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy phiếu sửa chữa #${dto.repairOrderId}`,
      );
    }

    // 2. Phiếu phải ở trạng thái PAID
    if (order.status !== RepairOrderStatus.PAID) {
      throw new BadRequestException(
        `Chỉ có thể đánh giá sau khi phiếu đã thanh toán. ` +
          `Trạng thái hiện tại: ${order.status}`,
      );
    }

    // 3. Chặn đánh giá trùng (mỗi customer chỉ đánh giá 1 lần)
    const alreadyReviewed = await this.reviewsRepo.existsByCustomerId(customerId);
    if (alreadyReviewed) {
      throw new BadRequestException(
        'Bạn đã gửi đánh giá trước đó. Mỗi khách hàng chỉ đánh giá 1 lần.',
      );
    }

    return this.reviewsRepo.createReview({
      customerId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async ensureVehicleOwner(vehicleId: number, customerId: number) {
    const vehicles = await this.vehiclesRepo.findByCustomerId(customerId);
    const owned = vehicles.find((v) => v.id === vehicleId);
    if (!owned) {
      throw new NotFoundException(
        `Không tìm thấy xe #${vehicleId} trong danh sách xe của bạn.`,
      );
    }
    return owned;
  }
}
