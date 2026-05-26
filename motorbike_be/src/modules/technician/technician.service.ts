import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  NotificationType,
  Prisma,
  RepairOrderStatus,
} from 'generated/prisma/client';
import {
  AddItemDto,
  AddServiceDto,
  CompleteRepairDto,
  ExtraQuoteDto,
  UpdateKmTechDto,
  UpdateRepairStatusDto,
} from './dto/technician.dto';

@Injectable()
export class TechnicianService {
  private readonly logger = new Logger(TechnicianService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── DASHBOARD ──────────────────────────────────────────────
  async getDashboard(technicianId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      todayAppointments,
      inProgressOrders,
      completedToday,
      upcomingAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          technicianId,
          appointmentTime: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.repairOrder.count({
        where: {
          technicianId,
          status: {
            in: [
              RepairOrderStatus.RECEIVED,
              RepairOrderStatus.IN_PROGRESS,
              RepairOrderStatus.PENDING,
            ],
          },
        },
      }),
      this.prisma.repairOrder.count({
        where: {
          technicianId,
          status: RepairOrderStatus.COMPLETED,
          updatedAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          technicianId,
          appointmentTime: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { appointmentTime: 'asc' },
        take: 8,
        include: {
          customer: { select: { customerName: true, phone: true } },
          vehicle: { select: { licensePlate: true, brand: true } },
        },
      }),
    ]);

    return {
      todayAppointments,
      inProgressOrders,
      completedToday,
      upcomingAppointments,
    };
  }

  // ─── ASSIGNED ORDERS ────────────────────────────────────────
  async listAssignedOrders(
    technicianId: number,
    filter: { status?: string; today?: boolean; overdue?: boolean },
  ) {
    const where: Prisma.RepairOrderWhereInput = { technicianId };
    if (filter.status) where.status = filter.status as RepairOrderStatus;
    if (filter.today) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      where.createdAt = { gte: today, lt: tomorrow };
    }
    if (filter.overdue) {
      // "Quá hạn": nhận trước 1 ngày mà chưa COMPLETED/PAID
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as object), lte: cutoff };
      where.status = {
        in: [
          RepairOrderStatus.RECEIVED,
          RepairOrderStatus.IN_PROGRESS,
          RepairOrderStatus.PENDING,
        ],
      };
    }

    return this.prisma.repairOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { customerName: true, phone: true } },
        vehicle: { select: { licensePlate: true, brand: true, model: true } },
        services: { include: { service: { select: { serviceName: true } } } },
        items: { select: { id: true } },
      },
    });
  }

  // ─── ORDER DETAIL ───────────────────────────────────────────
  async getOrderDetail(id: number, technicianId: number) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        services: { include: { service: true } },
        items: { include: { sparePart: true } },
        receptionist: { select: { fullname: true } },
      },
    });
    if (!order) throw new NotFoundException(`Không tìm thấy phiếu #${id}`);
    if (order.technicianId !== technicianId) {
      throw new ForbiddenException('Bạn không phụ trách phiếu này');
    }
    return order;
  }

  // ─── UPDATE STATUS / NOTE ───────────────────────────────────
  async updateStatus(
    id: number,
    technicianId: number,
    dto: UpdateRepairStatusDto,
  ) {
    const order = await this.getOrderDetail(id, technicianId);
    if (order.status === RepairOrderStatus.PAID)
      throw new BadRequestException('Phiếu đã thanh toán, không thể sửa');
    return this.prisma.repairOrder.update({
      where: { id },
      data: {
        status: dto.status as RepairOrderStatus,
        ...(dto.technicianNote !== undefined && {
          technicianNote: dto.technicianNote,
        }),
      },
    });
  }

  // ─── ADD ITEM (phụ tùng phát sinh) ──────────────────────────
  async addItem(id: number, technicianId: number, dto: AddItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.repairOrder.findUnique({ where: { id } });
      if (!order) throw new NotFoundException();
      if (order.technicianId !== technicianId)
        throw new ForbiddenException('Không phải phiếu của bạn');
      if (
        order.status === RepairOrderStatus.PAID ||
        order.status === RepairOrderStatus.CANCELLED
      )
        throw new BadRequestException('Không thể thêm phụ tùng vào phiếu này');

      const part = await tx.sparePart.findUnique({
        where: { id: dto.sparePartId },
      });
      if (!part) throw new BadRequestException('Phụ tùng không tồn tại');
      if (part.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Phụ tùng "${part.partName}" chỉ còn ${part.stockQuantity} ${part.unit}`,
        );
      }

      const created = await tx.repairOrderItem.create({
        data: {
          repairOrderId: id,
          sparePartId: dto.sparePartId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          warrantyNote: dto.warrantyNote,
        },
        include: { sparePart: true },
      });

      await tx.sparePart.update({
        where: { id: dto.sparePartId },
        data: { stockQuantity: { decrement: dto.quantity } },
      });

      const inc = Number(dto.unitPrice) * dto.quantity;
      await tx.repairOrder.update({
        where: { id },
        data: { totalAmount: { increment: inc } },
      });

      return created;
    });
  }

  // ─── ADD SERVICE (dịch vụ phát sinh) ───────────────────────
  async addService(id: number, technicianId: number, dto: AddServiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.repairOrder.findUnique({ where: { id } });
      if (!order) throw new NotFoundException();
      if (order.technicianId !== technicianId)
        throw new ForbiddenException();
      if (
        order.status === RepairOrderStatus.PAID ||
        order.status === RepairOrderStatus.CANCELLED
      )
        throw new BadRequestException('Không thể thêm dịch vụ vào phiếu này');

      const created = await tx.repairOrderService.create({
        data: {
          repairOrderId: id,
          serviceId: dto.serviceId,
          appliedPrice: dto.appliedPrice,
        },
        include: { service: true },
      });

      await tx.repairOrder.update({
        where: { id },
        data: { totalAmount: { increment: Number(dto.appliedPrice) } },
      });

      return created;
    });
  }

  // ─── UPDATE KM XE ───────────────────────────────────────────
  async updateVehicleKm(
    orderId: number,
    technicianId: number,
    dto: UpdateKmTechDto,
  ) {
    const order = await this.getOrderDetail(orderId, technicianId);
    return this.prisma.vehicle.update({
      where: { id: order.vehicleId },
      data: { currentKm: dto.currentKm },
    });
  }

  // ─── EXTRA QUOTE — gửi lễ tân duyệt ────────────────────────
  async createExtraQuote(
    orderId: number,
    technicianId: number,
    dto: ExtraQuoteDto,
  ) {
    const order = await this.getOrderDetail(orderId, technicianId);

    // Chuyển trạng thái → PENDING (chờ duyệt)
    await this.prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairOrderStatus.PENDING },
    });

    // Tạo notification cho lễ tân + admin
    const message =
      `Yêu cầu duyệt báo giá phát sinh cho phiếu #${orderId}.\n` +
      `Lý do: ${dto.reason}\n` +
      `Dịch vụ thêm: ${dto.services.length} | Phụ tùng thêm: ${dto.items.length}`;
    const notification = await this.prisma.notification.create({
      data: {
        type: NotificationType.PRICE_APPROVAL,
        title: `Báo giá phát sinh — phiếu #${orderId}`,
        message,
        repairOrderId: orderId,
        customerId: order.customerId,
      },
    });

    return { notification, message };
  }

  // ─── COMPLETE REPAIR ────────────────────────────────────────
  async completeRepair(
    id: number,
    technicianId: number,
    dto: CompleteRepairDto,
  ) {
    const order = await this.getOrderDetail(id, technicianId);
    if (
      order.status !== RepairOrderStatus.IN_PROGRESS &&
      order.status !== RepairOrderStatus.PENDING &&
      order.status !== RepairOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        `Không thể hoàn thành phiếu ở trạng thái ${order.status}`,
      );
    }

    const note = [
      dto.technicianNote,
      dto.recommendation && `Khuyến nghị: ${dto.recommendation}`,
    ]
      .filter(Boolean)
      .join('\n');

    const updated = await this.prisma.repairOrder.update({
      where: { id },
      data: {
        status: RepairOrderStatus.COMPLETED,
        technicianNote: note || order.technicianNote,
        warrantyNote: dto.warrantyNote ?? order.warrantyNote,
      },
    });

    // Notify khách hàng
    await this.prisma.notification.create({
      data: {
        type: NotificationType.REPAIR_COMPLETED,
        title: 'Xe của bạn đã sửa xong',
        message: `Xe ${order.vehicle.licensePlate} đã được sửa xong. Vui lòng đến nhận và thanh toán.`,
        customerId: order.customerId,
        repairOrderId: id,
      },
    });

    return updated;
  }
}
