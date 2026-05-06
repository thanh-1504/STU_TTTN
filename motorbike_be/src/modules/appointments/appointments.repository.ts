import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Appointment, AppointmentStatus } from 'generated/prisma/client';

/** Giờ làm việc cố định: 7h–17h (10 slots mỗi giờ) */
const WORK_HOURS_START = 7;
const WORK_HOURS_END = 17;

/** Số xe tối đa mặc định mỗi slot (nếu không có WorkSchedule) */
const DEFAULT_MAX_PER_SLOT = 10;

@Injectable()
export class AppointmentsRepository extends BaseRepository<Appointment> {
  constructor(prisma: PrismaService) {
    super(prisma, 'appointment');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SLOT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Đếm số lịch hẹn đã đặt trong một slot (date + hour).
   * Slot = [hour:00, hour:59] trong ngày date.
   * Chỉ tính các lịch PENDING / CONFIRMED (không tính CANCELLED / COMPLETED).
   */
  async countByTimeSlot(date: Date, hour: number): Promise<number> {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(hour, 59, 59, 999);

    return this.prisma.appointment.count({
      where: {
        appointmentTime: { gte: slotStart, lte: slotEnd },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    });
  }

  /**
   * Trả danh sách giờ còn chỗ trong ngày date.
   *
   * Logic:
   * 1. Tìm WorkSchedule của ngày đó (nếu có) để lấy maxVehicles.
   *    Nếu không có → dùng DEFAULT_MAX_PER_SLOT.
   * 2. Duyệt từng giờ trong khung làm việc của WorkSchedule
   *    (hoặc WORK_HOURS_START→WORK_HOURS_END nếu không có).
   * 3. Slot nào count < max → còn chỗ.
   *
   * @returns Mảng chuỗi giờ còn trống, dạng "HH:00"
   */
  async getAvailableSlots(date: Date): Promise<string[]> {
    // Chuẩn hóa ngày: bắt đầu 00:00:00 – kết thúc 23:59:59
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Tìm WorkSchedule cho ngày này (lấy ca đầu tiên nếu có nhiều ca)
    const schedule = await this.prisma.workSchedule.findFirst({
      where: {
        workDate: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { shiftStart: 'asc' },
    });

    // Xác định khung giờ làm việc
    const maxPerSlot = schedule?.maxVehicles ?? DEFAULT_MAX_PER_SLOT;
    const startHour = schedule
      ? new Date(schedule.shiftStart).getHours()
      : WORK_HOURS_START;
    const endHour = schedule
      ? new Date(schedule.shiftEnd).getHours()
      : WORK_HOURS_END;

    // Đếm tất cả lịch hẹn trong ngày một lần (tránh N+1 queries)
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        appointmentTime: { gte: dayStart, lte: dayEnd },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      select: { appointmentTime: true },
    });

    // Group theo giờ: { hour → count }
    const countPerHour = new Map<number, number>();
    for (const appt of existingAppointments) {
      const h = new Date(appt.appointmentTime).getHours();
      countPerHour.set(h, (countPerHour.get(h) ?? 0) + 1);
    }

    // Thu thập các slot còn chỗ
    const available: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      const booked = countPerHour.get(h) ?? 0;
      if (booked < maxPerSlot) {
        available.push(`${String(h).padStart(2, '0')}:00`);
      }
    }

    return available;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tạo lịch hẹn mới.
   * @param data Object chứa đầy đủ thông tin (bao gồm customerId đã lấy từ JWT)
   */
  async createAppointment(data: {
    appointmentTime: Date;
    customerId: number;
    vehicleId?: number;
    symptoms?: string;
    notes?: string;
  }): Promise<Appointment> {
    return this.prisma.appointment.create({
      data: {
        appointmentTime: data.appointmentTime,
        customerId: data.customerId,
        vehicleId: data.vehicleId ?? null,
        symptoms: data.symptoms ?? null,
        notes: data.notes ?? null,
        status: AppointmentStatus.PENDING,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  /** Lấy lịch hẹn theo trạng thái (Admin) */
  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { status },
      include: { customer: true, vehicle: true, technician: true },
      orderBy: { appointmentTime: 'asc' },
    });
  }

  /** Lấy tất cả lịch hẹn của một khách hàng, mới nhất trước */
  async findByCustomerId(customerId: number): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { customerId },
      include: { vehicle: true },
      orderBy: { appointmentTime: 'desc' },
    });
  }

  /** Lấy lịch hẹn theo khoảng thời gian (Admin) */
  async findByDateRange(from: Date, to: Date): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { appointmentTime: { gte: from, lte: to } },
      include: { customer: true, vehicle: true },
      orderBy: { appointmentTime: 'asc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy tất cả lịch hẹn kèm filter.
   * - status: lọc theo AppointmentStatus
   * - date: lọc theo ngày (YYYY-MM-DD) → [00:00, 23:59]
   * - customerId: lọc theo khách hàng
   */
  async findAllAdmin(filter?: {
    status?: AppointmentStatus;
    date?: Date;
    customerId?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filter?.status) where.status = filter.status;
    if (filter?.customerId) where.customerId = filter.customerId;
    if (filter?.date) {
      const dayStart = new Date(filter.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filter.date);
      dayEnd.setHours(23, 59, 59, 999);
      where.appointmentTime = { gte: dayStart, lte: dayEnd };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, customerName: true, phone: true } },
        vehicle: { select: { id: true, licensePlate: true, brand: true, vehicleType: true } },
        technician: { select: { id: true, fullname: true } },
      },
      orderBy: { appointmentTime: 'asc' },
    });
  }

  /** Lấy chi tiết một lịch hẹn kèm relations */
  async findById(id: number): Promise<any | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        technician: { select: { id: true, fullname: true, phone: true } },
      },
    });
  }

  /** Xác nhận lịch hẹn: PENDING → CONFIRMED */
  async confirm(id: number): Promise<any> {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
      include: { customer: { select: { id: true, customerName: true } } },
    });
  }

  /** Hủy lịch hẹn: → CANCELLED, lưu lý do */
  async cancel(id: number, reason?: string): Promise<any> {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        ...(reason && { notes: reason }),
      },
      include: { customer: { select: { id: true, customerName: true } } },
    });
  }

  /** Đếm lịch hẹn PENDING/CONFIRMED theo ngày và giờ (alias rõ ràng hơn countByTimeSlot) */
  async countByDateAndHour(date: Date, hour: number): Promise<number> {
    return this.countByTimeSlot(date, hour);
  }
}
