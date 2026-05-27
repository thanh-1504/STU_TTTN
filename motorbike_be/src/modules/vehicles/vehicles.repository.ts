import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Vehicle } from 'generated/prisma/client';

@Injectable()
export class VehiclesRepository extends BaseRepository<Vehicle> {
  constructor(prisma: PrismaService) {
    super(prisma, 'vehicle');
  }

  /** Láº¥y danh sÃ¡ch xe cá»§a má»™t khÃ¡ch hÃ ng */
  async findByCustomerId(customerId: number): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** TÃ¬m xe theo biá»ƒn sá»‘ */
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({ where: { licensePlate } });
  }

  /** Táº¡o xe má»›i */
  async createVehicle(data: {
    licensePlate: string;
    brand: string;
    vehicleType: 'MANUAL' | 'SCOOTER' | 'BIG';
    model?: string;
    currentKm?: number;
    imageUrl?: string;
    notes?: string;
    customerId: number;
  }): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data: data as any });
  }

  /** Cáº­p nháº­t sá»‘ km vÃ  áº£nh xe náº¿u cÃ³ */
  async updateKm(
    id: number,
    data: { currentKm: number; imageUrl?: string | null },
  ): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        currentKm: data.currentKm,
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      } as any,
    });
  }

  /** XÃ³a xe */
  async deleteVehicle(id: number): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } });
  }

  /**
   * Äáº¿m sá»‘ phiáº¿u sá»­a chá»¯a Ä‘ang active (RECEIVED / IN_PROGRESS / PENDING)
   * cá»§a xe â€” dÃ¹ng Ä‘á»ƒ kiá»ƒm tra trÆ°á»›c khi xÃ³a xe.
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
