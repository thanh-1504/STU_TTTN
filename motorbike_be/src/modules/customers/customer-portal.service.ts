import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { RepairOrderRepository } from './repair-order.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CustomersRepository } from './customers.repository';
import {
  PortalCreateVehicleDto,
  UpdateKmDto,
  CreatePortalReviewDto,
  UpdateProfileDto,
} from './dto/portal.dto';
import { AppointmentStatus, RepairOrderStatus } from 'generated/prisma/client';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly repairOrderRepo: RepairOrderRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly appointmentsRepo: AppointmentsRepository,
    private readonly customersRepo: CustomersRepository,
  ) {}

  /** GET /portal/profile — Thông tin cá nhân */
  async getProfile(customerId: number) {
    const customer = await this.customersRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Khong tim thay thong tin khach hang');
    }

    return {
      id: customer.id,
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email,
      avatarUrl: (customer as any).avatarUrl ?? null,
      address: customer.address,
    };
  }

  /** PATCH /portal/profile — Cập nhật tên hiển thị / avatar */
  async updateProfile(dto: UpdateProfileDto, customerId: number) {
    const hasName = dto.customerName !== undefined;
    const hasAvatar = dto.avatarUrl !== undefined;

    if (!hasName && !hasAvatar) {
      throw new BadRequestException('Khong co du lieu de cap nhat');
    }

    const updatePayload: Record<string, unknown> = {};

    if (hasName) {
      const trimmedName = dto.customerName?.trim();
      if (!trimmedName) {
        throw new BadRequestException('Ho ten khong duoc de trong');
      }
      updatePayload.customerName = trimmedName;
    }

    if (hasAvatar) {
      updatePayload.avatarUrl = dto.avatarUrl === null ? null : dto.avatarUrl;
    }

    const updated = await this.customersRepo.update(
      customerId,
      updatePayload as any,
    );

    return {
      id: updated.id,
      customerName: updated.customerName,
      phone: updated.phone,
      email: updated.email,
      avatarUrl: (updated as any).avatarUrl ?? null,
      address: updated.address,
    };
  }

  /** GET /portal/vehicles â€” Danh sÃ¡ch xe cá»§a customer */
  async getMyVehicles(customerId: number) {
    return this.vehiclesRepo.findByCustomerId(customerId);
  }

  /**
   * POST /portal/vehicles â€” ThÃªm xe má»›i.
   * Validate biá»ƒn sá»‘ chÆ°a tá»“n táº¡i trong há»‡ thá»‘ng.
   */
  async addVehicle(dto: PortalCreateVehicleDto, customerId: number) {
    const normalized = dto.licensePlate.toUpperCase().replace(/\s/g, '');

    const existing = await this.vehiclesRepo.findByLicensePlate(normalized);
    if (existing) {
      throw new BadRequestException(
        `Biá»ƒn sá»‘ ${normalized} Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½ trong há»‡ thá»‘ng.`,
      );
    }

    return this.vehiclesRepo.createVehicle({
      licensePlate: normalized,
      brand: dto.brand,
      vehicleType: dto.vehicleType as any,
      model: dto.model,
      currentKm: dto.currentKm,
      imageUrl: dto.imageUrl,
      notes: dto.notes,
      customerId,
    });
  }

  /**
   * PATCH /portal/vehicles/:id/km â€” Cáº­p nháº­t sá»‘ KM.
   * Kiá»ƒm tra xe thuá»™c vá» customer.
   */
  async updateKm(id: number, dto: UpdateKmDto, customerId: number) {
    await this.ensureVehicleOwner(id, customerId);
    return this.vehiclesRepo.updateKm(id, {
      currentKm: dto.currentKm,
      imageUrl: dto.imageUrl,
    });
  }

  /**
   * DELETE /portal/vehicles/:id â€” XÃ³a xe.
   * Kiá»ƒm tra: xe pháº£i thuá»™c customer + khÃ´ng cÃ³ phiáº¿u sá»­a active.
   */
  async deleteVehicle(id: number, customerId: number) {
    await this.ensureVehicleOwner(id, customerId);

    const activeCount = await this.vehiclesRepo.countActiveRepairOrders(id);
    if (activeCount > 0) {
      throw new BadRequestException(
        `Xe nÃ y Ä‘ang cÃ³ ${activeCount} phiáº¿u sá»­a chá»¯a chÆ°a hoÃ n táº¥t. KhÃ´ng thá»ƒ xÃ³a.`,
      );
    }

    await this.vehiclesRepo.deleteVehicle(id);
    return { message: 'XÃ³a xe thÃ nh cÃ´ng.' };
  }

  /** GET /portal/appointments â€” Lá»‹ch háº¹n cá»§a customer */
  async getMyAppointments(customerId: number) {
    return this.appointmentsRepo.findByCustomerId(customerId);
  }

  /**
   * PATCH /portal/appointments/:id/cancel â€” Há»§y lá»‹ch háº¹n.
   * Chá»‰ há»§y khi status = PENDING.
   */
  async cancelAppointment(id: number, customerId: number) {
    const appt = await this.appointmentsRepo.findByCustomerId(customerId);
    const target = appt.find((a) => a.id === id);

    if (!target) {
      throw new NotFoundException(`KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n #${id}`);
    }

    if (target.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Chá»‰ cÃ³ thá»ƒ há»§y lá»‹ch Ä‘ang á»Ÿ tráº¡ng thÃ¡i PENDING. ` +
          `Tráº¡ng thÃ¡i hiá»‡n táº¡i: ${target.status}`,
      );
    }

    return this.appointmentsRepo.update(id, {
      status: AppointmentStatus.CANCELLED,
    } as any);
  }

  /** GET /portal/repair-orders â€” Lá»‹ch sá»­ phiáº¿u sá»­a chá»¯a */
  async getMyRepairOrders(customerId: number) {
    return this.repairOrderRepo.findByCustomerId(customerId);
  }

  /**
   * GET /portal/repair-orders/:id â€” Chi tiáº¿t phiáº¿u.
   * Kiá»ƒm tra phiáº¿u thuá»™c vá» customer.
   */
  async getRepairOrderDetail(id: number, customerId: number) {
    const owned = await this.repairOrderRepo.findByIdAndCustomerId(
      id,
      customerId,
    );
    if (!owned) {
      throw new NotFoundException(`KhÃ´ng tÃ¬m tháº¥y phiáº¿u sá»­a chá»¯a #${id}`);
    }

    return this.repairOrderRepo.findDetailById(id);
  }

  /**
   * POST /portal/reviews â€” Gá»­i Ä‘Ã¡nh giÃ¡.
   * Äiá»u kiá»‡n:
   *  1. Phiáº¿u sá»­a chá»¯a pháº£i tá»“n táº¡i vÃ  thuá»™c customer nÃ y
   *  2. Phiáº¿u pháº£i á»Ÿ tráº¡ng thÃ¡i PAID
   *  3. Customer chÆ°a Ä‘Ã¡nh giÃ¡ trÆ°á»›c Ä‘Ã³
   */
  async createReview(dto: CreatePortalReviewDto, customerId: number) {
    const order = await this.repairOrderRepo.findByIdAndCustomerId(
      dto.repairOrderId,
      customerId,
    );
    if (!order) {
      throw new NotFoundException(
        `KhÃ´ng tÃ¬m tháº¥y phiáº¿u sá»­a chá»¯a #${dto.repairOrderId}`,
      );
    }

    if (order.status !== RepairOrderStatus.PAID) {
      throw new BadRequestException(
        `Chá»‰ cÃ³ thá»ƒ Ä‘Ã¡nh giÃ¡ sau khi phiáº¿u Ä‘Ã£ thanh toÃ¡n. ` +
          `Tráº¡ng thÃ¡i hiá»‡n táº¡i: ${order.status}`,
      );
    }

    const alreadyReviewed =
      await this.reviewsRepo.existsByCustomerId(customerId);
    if (alreadyReviewed) {
      throw new BadRequestException(
        'Báº¡n Ä‘Ã£ gá»­i Ä‘Ã¡nh giÃ¡ trÆ°á»›c Ä‘Ã³. Má»—i khÃ¡ch hÃ ng chá»‰ Ä‘Ã¡nh giÃ¡ 1 láº§n.',
      );
    }

    return this.reviewsRepo.createReview({
      customerId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  private async ensureVehicleOwner(vehicleId: number, customerId: number) {
    const vehicles = await this.vehiclesRepo.findByCustomerId(customerId);
    const owned = vehicles.find((v) => v.id === vehicleId);
    if (!owned) {
      throw new NotFoundException(
        `KhÃ´ng tÃ¬m tháº¥y xe #${vehicleId} trong danh sÃ¡ch xe cá»§a báº¡n.`,
      );
    }

    return owned;
  }
}
