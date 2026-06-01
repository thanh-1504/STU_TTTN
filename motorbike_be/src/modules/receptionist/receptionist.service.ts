import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  NotificationType,
  Prisma,
  RepairOrderStatus,
} from 'generated/prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CreateAppointmentByStaffDto } from './dto/create-appointment-staff.dto';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { PayRepairOrderDto } from './dto/pay-repair-order.dto';

@Injectable()
export class ReceptionistService {
  private readonly logger = new Logger(ReceptionistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      todayAppointments,
      inProgressOrders,
      pendingPayment,
      todayRevenueAgg,
      latestAppointments,
      latestOrders,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { appointmentTime: { gte: today, lt: tomorrow } },
      }),
      this.prisma.repairOrder.count({
        where: {
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
        where: { status: RepairOrderStatus.COMPLETED },
      }),
      this.prisma.repairOrder.aggregate({
        _sum: { paidAmount: true },
        where: {
          status: RepairOrderStatus.PAID,
          paidAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.appointment.findMany({
        take: 5,
        orderBy: { appointmentTime: 'desc' },
        include: {
          customer: { select: { customerName: true, phone: true } },
          vehicle: { select: { licensePlate: true, brand: true } },
        },
      }),
      this.prisma.repairOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { customerName: true, phone: true } },
          vehicle: { select: { licensePlate: true } },
          technician: { select: { fullname: true } },
        },
      }),
    ]);

    return {
      todayAppointments,
      inProgressOrders,
      pendingPayment,
      todayRevenue: Number(todayRevenueAgg._sum.paidAmount ?? 0),
      latestAppointments,
      latestOrders,
    };
  }

  // ─── APPOINTMENTS ────────────────────────────────────────────────────────────
  async listAppointments(params: {
    status?: string;
    date?: string;
    technicianId?: number;
    search?: string;
  }) {
    const where: Prisma.AppointmentWhereInput = {};
    if (params.status) where.status = params.status as AppointmentStatus;
    if (params.technicianId) where.technicianId = params.technicianId;
    const search = params.search?.trim();
    if (search) {
      where.customer = {
        OR: [
          { phone: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    if (params.date) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params.date);
      if (!m)
        throw new BadRequestException(
          'Định dạng date không hợp lệ. Dùng YYYY-MM-DD.',
        );
      const start = new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0);
      const end = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999);
      where.appointmentTime = { gte: start, lte: end };
    }
    return this.prisma.appointment.findMany({
      where,
      orderBy: { appointmentTime: 'asc' },
      include: {
        customer: { select: { id: true, customerName: true, phone: true } },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            brand: true,
            model: true,
            vehicleType: true,
          },
        },
        technician: { select: { id: true, fullname: true } },
      },
    });
  }

  async getAppointmentDetail(id: number) {
    const appt = await this.appointmentsRepository.findById(id);
    if (!appt) {
      throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    }
    return appt;
  }

  async createAppointment(dto: CreateAppointmentByStaffDto) {
    const time = new Date(dto.appointmentTime);
    const dayStart = new Date(time);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(time);
    dayEnd.setHours(23, 59, 59, 999);

    const hourStart = new Date(time);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);

    const schedule = await this.prisma.workSchedule.findFirst({
      where: { workDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { shiftStart: 'asc' },
    });
    const max = schedule?.maxVehicles ?? 10;

    const booked = await this.prisma.appointment.count({
      where: {
        appointmentTime: { gte: hourStart, lt: hourEnd },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });
    if (booked >= max) {
      throw new BadRequestException(
        'Khung giờ đã đầy. Vui lòng chọn giờ khác.',
      );
    }

    return this.prisma.appointment.create({
      data: {
        appointmentTime: time,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId ?? null,
        technicianId: dto.technicianId ?? null,
        symptoms: dto.symptoms ?? null,
        notes: dto.notes ?? null,
        status: AppointmentStatus.CONFIRMED,
      },
      include: { customer: true, vehicle: true, technician: true },
    });
  }

  async assignTechnician(id: number, technicianId: number) {
    await this.ensureAppointmentExists(id);
    const tech = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });
    if (!tech || tech.role.roleName !== 'TECHNICIAN') {
      throw new BadRequestException('Người được gán phải là kỹ thuật viên');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { technicianId },
      include: { technician: true },
    });
  }

  async rescheduleAppointment(
    id: number,
    dto: { appointmentTime: Date; technicianId?: number | null },
  ) {
    const appt = await this.ensureAppointmentExists(id);

    if (
      appt.status === AppointmentStatus.CANCELLED ||
      appt.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Không thể đổi lịch ở trạng thái ${appt.status}`,
      );
    }

    const newTime = new Date(dto.appointmentTime);
    const sameSlot = this.isSameSlot(appt.appointmentTime, newTime);
    if (!sameSlot) {
      await this.ensureSlotAvailable(newTime);
    }

    const updateData: Prisma.AppointmentUpdateInput = {
      appointmentTime: newTime,
    };

    if (dto.technicianId !== undefined) {
      if (dto.technicianId !== null) {
        const tech = await this.prisma.user.findUnique({
          where: { id: dto.technicianId },
          include: { role: true },
        });
        if (!tech || tech.role.roleName !== 'TECHNICIAN') {
          throw new BadRequestException('Kỹ thuật viên không hợp lệ');
        }
      }
      // @ts-ignore
      updateData.technician = dto.technicianId;
    }

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });
  }

  private async ensureAppointmentExists(id: number) {
    const a = await this.prisma.appointment.findUnique({ where: { id } });
    if (!a) throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    return a;
  }

  private async ensureSlotAvailable(appointmentDate: Date) {
    const hour = appointmentDate.getHours();
    const booked = await this.appointmentsRepository.countByTimeSlot(
      appointmentDate,
      hour,
    );
    const available =
      await this.appointmentsRepository.getAvailableSlots(appointmentDate);
    const slotLabel = `${String(hour).padStart(2, '0')}:00`;

    if (!available.includes(slotLabel)) {
      throw new BadRequestException(
        `Khung giờ ${slotLabel} đã đầy hoặc nằm ngoài giờ làm việc. ` +
          `Hiện tại đã có ${booked} xe đặt trong giờ này.`,
      );
    }
  }

  private isSameSlot(current: Date, next: Date) {
    return (
      current.getFullYear() === next.getFullYear() &&
      current.getMonth() === next.getMonth() &&
      current.getDate() === next.getDate() &&
      current.getHours() === next.getHours()
    );
  }

  // ─── REPAIR ORDERS — RECEPTION ──────────────────────────────────────────────
  async listRepairOrders(status?: string) {
    const where: Prisma.RepairOrderWhereInput = {};
    if (status) where.status = status as RepairOrderStatus;
    return this.prisma.repairOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, phone: true } },
        vehicle: { select: { id: true, licensePlate: true, brand: true } },
        technician: { select: { id: true, fullname: true } },
      },
    });
  }

  async getRepairOrderDetail(id: number) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        technician: { select: { id: true, fullname: true, phone: true } },
        receptionist: { select: { id: true, fullname: true } },
        voucher: true,
        services: { include: { service: true } },
        items: { include: { sparePart: true } },
      },
    });
    if (!order)
      throw new NotFoundException(`Không tìm thấy phiếu sửa chữa #${id}`);
    return order;
  }

  /**
   * Tạo phiếu sửa chữa.
   * - Cho phép tạo nhanh customer / vehicle nếu chưa tồn tại
   * - Validate dịch vụ, phụ tùng, tồn kho
   * - Tính totalAmount từ services + items
   */
  async createRepairOrder(dto: CreateRepairOrderDto, receptionistId: number) {
    return this.prisma.$transaction(
      async (tx) => {
        // 1. Resolve customer
        let customerId = dto.customerId;
        if (!customerId && dto.customer) {
          const phone = dto.customer.phone.trim();
          const existed = await tx.customer.findUnique({ where: { phone } });
          if (existed) {
            customerId = existed.id;
          } else {
            const created = await tx.customer.create({
              data: {
                phone,
                customerName: dto.customer.customerName,
                address: dto.customer.address,
              },
            });
            customerId = created.id;
          }
        }
        if (!customerId)
          throw new BadRequestException('Thiếu thông tin khách hàng');

        // 2. Resolve vehicle
        let vehicleId = dto.vehicleId;
        if (!vehicleId && dto.vehicle) {
          const plate = dto.vehicle.licensePlate
            .toUpperCase()
            .replace(/\s/g, '');
          const existed = await tx.vehicle.findUnique({
            where: { licensePlate: plate },
          });
          if (existed) {
            vehicleId = existed.id;
          } else {
            const created = await tx.vehicle.create({
              data: {
                licensePlate: plate,
                brand: dto.vehicle.brand,
                vehicleType: dto.vehicle.vehicleType,
                model: dto.vehicle.model,
                currentKm: dto.vehicle.currentKm,
                notes: dto.vehicle.notes,
                customerId,
              },
            });
            vehicleId = created.id;
          }
        }
        if (!vehicleId) throw new BadRequestException('Thiếu thông tin xe');

        // 3. Validate technician + tồn kho song song
        const partIds = dto.items.map((i) => i.sparePartId);
        const [tech, parts] = await Promise.all([
          tx.user.findUnique({
            where: { id: dto.technicianId },
            include: { role: true },
          }),
          partIds.length
            ? tx.sparePart.findMany({ where: { id: { in: partIds } } })
            : Promise.resolve([] as any[]),
        ]);
        if (!tech || tech.role.roleName !== 'TECHNICIAN') {
          throw new BadRequestException('Kỹ thuật viên không hợp lệ');
        }
        const partMap = new Map(parts.map((p: any) => [p.id, p]));
        for (const it of dto.items) {
          const part = partMap.get(it.sparePartId);
          if (!part)
            throw new BadRequestException(
              `Phụ tùng #${it.sparePartId} không tồn tại`,
            );
          if (part.stockQuantity < it.quantity) {
            throw new BadRequestException(
              `Phụ tùng "${part.partName}" chỉ còn ${part.stockQuantity} ${part.unit}`,
            );
          }
        }

        // 4. Tính tổng
        const serviceTotal = dto.services.reduce(
          (s, it) => s + Number(it.appliedPrice),
          0,
        );
        const itemTotal = dto.items.reduce(
          (s, it) => s + Number(it.unitPrice) * it.quantity,
          0,
        );
        const totalAmount = serviceTotal + itemTotal;

        // 5. Tạo RepairOrder + relations
        const order = await tx.repairOrder.create({
          data: {
            appointmentId: dto.appointmentId ?? null,
            customerId,
            vehicleId,
            receptionistId,
            technicianId: dto.technicianId,
            symptoms: dto.symptoms,
            vehicleConditionNote: dto.vehicleConditionNote,
            technicianNote: dto.technicianNote,
            warrantyNote: dto.warrantyNote,
            totalAmount,
            status: RepairOrderStatus.RECEIVED,
            services: {
              create: dto.services.map((s) => ({
                serviceId: s.serviceId,
                appliedPrice: s.appliedPrice,
              })),
            },
            items: {
              create: dto.items.map((i) => ({
                sparePartId: i.sparePartId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                warrantyNote: i.warrantyNote,
              })),
            },
          },
          include: {
            services: { include: { service: true } },
            items: { include: { sparePart: true } },
            customer: true,
            vehicle: true,
          },
        });

        // 6. Trừ tồn kho + đóng appointment song song
        await Promise.all([
          ...dto.items.map((it) =>
            tx.sparePart.update({
              where: { id: it.sparePartId },
              data: { stockQuantity: { decrement: it.quantity } },
            }),
          ),
          dto.appointmentId
            ? tx.appointment.update({
                where: { id: dto.appointmentId },
                data: { status: AppointmentStatus.COMPLETED },
              })
            : Promise.resolve(),
        ]);

        return order;
      },
      { timeout: 15_000, maxWait: 10_000 },
    );
  }

  // ─── PAYMENT ────────────────────────────────────────────────────────────────

  /**
   * Tính giảm giá voucher theo tổng đơn (không lưu DB).
   * Dùng cho cả preview và lúc thanh toán.
   */
  private computeVoucherDiscount(
    voucher: {
      status: string;
      startDate: Date;
      endDate: Date;
      minOrderValue: any;
      discountPercent: number | null;
      maxDiscount: any;
      discountAmount: any;
    },
    totalAmount: number,
  ) {
    if (voucher.status !== 'ACTIVE')
      throw new BadRequestException('Voucher không hoạt động');
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate)
      throw new BadRequestException('Voucher hết hạn');
    if (totalAmount < Number(voucher.minOrderValue)) {
      throw new BadRequestException(
        `Đơn tối thiểu ${Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ để dùng voucher này`,
      );
    }
    let discount = 0;
    if (voucher.discountPercent) {
      discount = (totalAmount * voucher.discountPercent) / 100;
      if (voucher.maxDiscount)
        discount = Math.min(discount, Number(voucher.maxDiscount));
    } else if (voucher.discountAmount) {
      discount = Number(voucher.discountAmount);
    }
    discount = Math.min(discount, totalAmount);
    return Math.round(discount);
  }

  /** Preview giảm giá khi áp voucher — không lưu */
  async previewVoucher(orderId: number, voucherCode?: string) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
      select: { totalAmount: true, status: true },
    });
    if (!order) throw new NotFoundException(`Không tìm thấy phiếu #${orderId}`);
    const total = Number(order.totalAmount);
    if (!voucherCode) {
      return {
        totalAmount: total,
        discount: 0,
        finalTotal: total,
        voucher: null,
      };
    }
    const voucher = await this.prisma.voucher.findUnique({
      where: { voucherCode },
    });
    if (!voucher) throw new BadRequestException('Voucher không tồn tại');
    const discount = this.computeVoucherDiscount(voucher, total);
    return {
      totalAmount: total,
      discount,
      finalTotal: Math.max(0, total - discount),
      voucher: {
        id: voucher.id,
        voucherCode: voucher.voucherCode,
        description: voucher.description,
      },
    };
  }

  /** Lấy thông tin chuyển khoản / QR (system-config) cho FE hiển thị */
  async getPaymentInfo() {
    const keys = [
      'BANK_NAME',
      'BANK_ACCOUNT_NUMBER',
      'BANK_ACCOUNT_HOLDER',
      'BANK_BRANCH',
      'PAYMENT_QR_URL',
    ];
    const configs = await this.prisma.systemConfig.findMany({
      where: { configKey: { in: keys } },
    });
    const map: Record<string, string> = {};
    configs.forEach((c) => (map[c.configKey] = c.configValue));
    return {
      bankName: map.BANK_NAME ?? '',
      accountNumber: map.BANK_ACCOUNT_NUMBER ?? '',
      accountHolder: map.BANK_ACCOUNT_HOLDER ?? '',
      branch: map.BANK_BRANCH ?? '',
      qrUrl: map.PAYMENT_QR_URL ?? '',
    };
  }

  async payRepairOrder(id: number, dto: PayRepairOrderDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.repairOrder.findUnique({
          where: { id },
          include: {
            services: { include: { service: true } },
            items: { include: { sparePart: true } },
            voucher: true,
            customer: true,
            vehicle: true,
            technician: { select: { fullname: true } },
            receptionist: { select: { fullname: true } },
          },
        });
        if (!order) throw new NotFoundException(`Không tìm thấy phiếu #${id}`);
        if (order.status === RepairOrderStatus.PAID)
          throw new BadRequestException('Phiếu đã thanh toán');
        if (order.status !== RepairOrderStatus.COMPLETED)
          throw new BadRequestException(
            'Chỉ có thể thanh toán phiếu đã hoàn thành',
          );

        // Apply voucher nếu có
        let voucherId: number | null = order.voucherId ?? null;
        let discount = 0;
        const total = Number(order.totalAmount);
        let finalTotal = total;
        if (dto.voucherCode) {
          const voucher = await tx.voucher.findUnique({
            where: { voucherCode: dto.voucherCode },
          });
          if (!voucher) throw new BadRequestException('Voucher không tồn tại');
          discount = this.computeVoucherDiscount(voucher, total);
          finalTotal = Math.max(0, total - discount);
          voucherId = voucher.id;
        }

        if (dto.paidAmount < finalTotal) {
          throw new BadRequestException(
            `Số tiền thanh toán (${dto.paidAmount.toLocaleString('vi-VN')}đ) nhỏ hơn cần thanh toán (${finalTotal.toLocaleString('vi-VN')}đ)`,
          );
        }

        const updated = await tx.repairOrder.update({
          where: { id },
          data: {
            paidAmount: dto.paidAmount,
            paymentMethod: dto.paymentMethod,
            paidAt: new Date(),
            status: RepairOrderStatus.PAID,
            voucherId,
          },
        });

        // Cập nhật totalSpent của customer
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { increment: finalTotal } },
        });

        // Notification cảm ơn (extend Use Case "Gửi tin nhắn Zalo cảm ơn")
        await tx.notification.create({
          data: {
            type: NotificationType.REPAIR_COMPLETED,
            title: 'Cảm ơn quý khách đã sử dụng dịch vụ',
            message:
              `Cảm ơn ${order.customer.customerName} đã thanh toán phiếu #${id}. ` +
              `Phụ tùng có bảo hành theo phiếu kèm theo. ` +
              `Hẹn gặp lại quý khách!`,
            customerId: order.customerId,
            repairOrderId: id,
          },
        });

        // Trả về payload đầy đủ phục vụ in hóa đơn + phiếu bảo hành
        const invoice = {
          orderId: id,
          paidAt: updated.paidAt,
          paymentMethod: dto.paymentMethod,
          customer: order.customer,
          vehicle: order.vehicle,
          technician: order.technician,
          receptionist: order.receptionist,
          services: order.services,
          items: order.items,
          totalAmount: total,
          discount,
          finalTotal,
          paidAmount: dto.paidAmount,
          change: dto.paidAmount - finalTotal,
        };

        const warrantyItems = order.items
          .filter((it) => it.warrantyNote)
          .map((it) => ({
            partName: it.sparePart?.partName,
            quantity: it.quantity,
            warrantyNote: it.warrantyNote,
          }));

        return { ...updated, discount, finalTotal, invoice, warrantyItems };
      },
      { timeout: 15_000, maxWait: 10_000 },
    );
  }

  // ─── CUSTOMERS ──────────────────────────────────────────────────────────────
  async listCustomers(search?: string) {
    const where: Prisma.CustomerWhereInput = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { repairOrders: true, vehicles: true } } },
    });
  }

  async getCustomerDetail(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        appointments: {
          orderBy: { appointmentTime: 'desc' },
          take: 20,
        },
        repairOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            vehicle: { select: { licensePlate: true, brand: true } },
          },
        },
      },
    });
    if (!customer)
      throw new NotFoundException(`Không tìm thấy khách hàng #${id}`);
    return customer;
  }

  // ─── VEHICLES ───────────────────────────────────────────────────────────────
  async listVehicles(search?: string) {
    const where: Prisma.VehicleWhereInput = {};
    if (search) {
      where.OR = [
        { licensePlate: { contains: search.toUpperCase() } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, phone: true } },
        _count: { select: { repairOrders: true } },
      },
    });
  }

  async getVehicleDetail(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        repairOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            services: {
              include: { service: { select: { serviceName: true } } },
            },
            items: {
              include: { sparePart: { select: { partName: true } } },
            },
          },
        },
      },
    });
    if (!vehicle) throw new NotFoundException(`Không tìm thấy xe #${id}`);
    return vehicle;
  }

  // ─── TECHNICIAN LIST (cho dropdown phân công) ───────────────────────────────
  async listTechnicians() {
    return this.prisma.user.findMany({
      where: { role: { roleName: 'TECHNICIAN' }, isActive: true },
      select: { id: true, fullname: true, phone: true },
      orderBy: { fullname: 'asc' },
    });
  }
}
