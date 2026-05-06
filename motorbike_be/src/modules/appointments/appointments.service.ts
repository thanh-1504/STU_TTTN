import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointments.dto';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  Appointment,
  AppointmentStatus,
  NotificationType,
} from 'generated/prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────────────────────────────────────────

  async getAvailableSlots(dateStr: string) {
    let date: Date;
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new BadRequestException('Không thể tra cứu slot cho ngày đã qua.');
    }

    const availableSlots = await this.appointmentsRepository.getAvailableSlots(date);
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      availableSlots,
      totalAvailable: availableSlots.length,
    };
  }

  async createByCustomer(dto: CreateAppointmentDto, customerId: number): Promise<Appointment> {
    const appointmentDate = new Date(dto.appointmentTime);
    const hour = appointmentDate.getHours();

    const booked = await this.appointmentsRepository.countByTimeSlot(appointmentDate, hour);
    const available = await this.appointmentsRepository.getAvailableSlots(appointmentDate);
    const slotLabel = `${String(hour).padStart(2, '0')}:00`;

    if (!available.includes(slotLabel)) {
      throw new BadRequestException(
        `Khung giờ ${slotLabel} đã đầy hoặc nằm ngoài giờ làm việc. ` +
          `Hiện tại đã có ${booked} xe đặt trong giờ này.`,
      );
    }

    return this.appointmentsRepository.createAppointment({
      appointmentTime: appointmentDate,
      customerId,
      vehicleId: dto.vehicleId,
      symptoms: dto.symptoms,
      notes: dto.notes,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN — READ
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/appointments?status=&date=YYYY-MM-DD
   * Filter kết hợp status + date (parse an toàn giống getAvailableSlots).
   */
  async findAll(status?: string, dateStr?: string) {
    let date: Date | undefined;
    if (dateStr) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
      if (!m) throw new BadRequestException('Định dạng date không hợp lệ. Dùng YYYY-MM-DD.');
      date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }

    return this.appointmentsRepository.findAllAdmin({
      status: status as AppointmentStatus | undefined,
      date,
    });
  }

  async findOne(id: number) {
    const appt = await this.appointmentsRepository.findById(id);
    if (!appt) throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    return appt;
  }

  async findByCustomer(customerId: number) {
    return this.appointmentsRepository.findByCustomerId(customerId);
  }

  async findByStatus(status: AppointmentStatus) {
    return this.appointmentsRepository.findAllAdmin({ status });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN — CONFIRM / CANCEL
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /admin/appointments/:id/confirm
   * PENDING → CONFIRMED + tạo Notification APPOINTMENT_CONFIRM cho customer.
   */
  async adminConfirm(id: number) {
    const appt = await this.findOne(id);

    if (appt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể xác nhận lịch đang PENDING. Trạng thái hiện tại: ${appt.status}`,
      );
    }

    const confirmed = await this.appointmentsRepository.confirm(id);

    // Tạo Notification cho customer (async, không block response)
    this.createNotification({
      type: NotificationType.APPOINTMENT_CONFIRM,
      customerId: appt.customerId,
      title: 'Lịch hẹn đã được xác nhận',
      message: `Lịch hẹn của bạn vào lúc ${new Date(appt.appointmentTime).toLocaleString('vi-VN')} đã được xác nhận.`,
    }).catch((err) => this.logger.warn(`Tạo notification thất bại: ${err.message}`));

    return confirmed;
  }

  /**
   * PATCH /admin/appointments/:id/cancel
   * → CANCELLED + tạo Notification APPOINTMENT_CANCEL cho customer.
   * Body: { reason? }
   */
  async adminCancel(id: number, reason?: string) {
    const appt = await this.findOne(id);

    if (appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Không thể hủy lịch hẹn đã hoàn thành.');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn này đã bị hủy trước đó.');
    }

    const cancelled = await this.appointmentsRepository.cancel(id, reason);

    // Tạo Notification cho customer
    this.createNotification({
      type: NotificationType.APPOINTMENT_REMINDER,
      customerId: appt.customerId,
      title: 'Lịch hẹn đã bị hủy',
      message:
        `Lịch hẹn vào lúc ${new Date(appt.appointmentTime).toLocaleString('vi-VN')} đã bị hủy` +
        (reason ? `. Lý do: ${reason}` : '.'),
    }).catch((err) => this.logger.warn(`Tạo notification thất bại: ${err.message}`));

    return cancelled;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMER — CANCEL
  // ─────────────────────────────────────────────────────────────────────────────

  async cancel(id: number): Promise<Appointment> {
    const appt = await this.findOne(id);
    if (appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Không thể hủy lịch hẹn đã hoàn thành.');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn này đã bị hủy trước đó.');
    }
    return this.appointmentsRepository.cancel(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE (generic, dùng bởi Admin patch thông thường)
  // ─────────────────────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    await this.findOne(id);
    return this.appointmentsRepository.update(id, dto as any);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────────────────────────

  private async createNotification(data: {
    type: NotificationType;
    customerId: number;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        customerId: data.customerId,
        title: data.title,
        message: data.message,
      },
    });
  }
}
