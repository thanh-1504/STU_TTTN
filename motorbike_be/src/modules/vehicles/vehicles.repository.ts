import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Vehicle } from 'generated/prisma/client';

@Injectable()
export class VehiclesRepository extends BaseRepository<Vehicle> {
  constructor(prisma: PrismaService) {
    super(prisma, 'vehicle');
  }

  // ─── READ ────────────────────────────────────────────────────────────────────

  /** Lấy danh sách xe của một khách hàng */
  async findByCustomerId(customerId: number): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Tìm xe theo biển số */
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({ where: { licensePlate } });
  }

  // ─── WRITE ───────────────────────────────────────────────────────────────────

  /** Tạo xe mới */
  async createVehicle(data: {
    licensePlate: string;
    brand: string;
    vehicleType: 'MANUAL' | 'SCOOTER' | 'BIG';
    model?: string;
    currentKm?: number;
    notes?: string;
    customerId: number;
  }): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data });
  }

  /** Cập nhật số km */
  async updateKm(id: number, currentKm: number): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data: { currentKm },
    });
  }

  /** Xóa xe */
  async deleteVehicle(id: number): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } });
  }

  // ─── HELPER ──────────────────────────────────────────────────────────────────

  /**
   * Đếm số phiếu sửa chữa đang active (RECEIVED / IN_PROGRESS / PENDING)
   * của xe — dùng để kiểm tra trước khi xóa xe.
   */
  async countActiveRepairOrders(vehicleId: number): Promise<number> {
    return this.prisma.repairOrder.count({
      where: {
        vehicleId,
        status: { in: ['RECEIVED', 'IN_PROGRESS', 'PENDING'] },
      },
    });
  }
}
