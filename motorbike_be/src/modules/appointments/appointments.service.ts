import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { AppointmentsRepository } from './appointments.repository';
import { AdminCreateAppointmentDto } from './dto/admin-create-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import {
  Appointment,
  AppointmentStatus,
  NotificationType,
  VehicleType,
} from 'generated/prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

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
      throw new BadRequestException(
        'Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD.',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new BadRequestException('Không thể tra cứu slot cho ngày đã qua.');
    }

    const availableSlots =
      await this.appointmentsRepository.getAvailableSlots(date);
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      availableSlots,
      totalAvailable: availableSlots.length,
    };
  }

  async createByCustomer(
    dto: CreateAppointmentDto,
    customerId: number,
  ): Promise<Appointment> {
    const appointmentDate = new Date(dto.appointmentTime);
    await this.ensureSlotAvailable(appointmentDate);

    // Kiểm tra khách hàng đã đặt trong cùng ngày + khung giờ này chưa
    const isDuplicate =
      await this.appointmentsRepository.hasCustomerBookingInSlot(
        customerId,
        appointmentDate,
      );
    if (isDuplicate) {
      const hour = String(appointmentDate.getHours()).padStart(2, '0');
      throw new BadRequestException(
        `Bạn đã có lịch hẹn trong khung giờ này. Vui lòng chọn ngày hoặc khung giờ khác.`,
      );
    }

    const serviceIds = Array.isArray(dto.serviceIds)
      ? Array.from(new Set(dto.serviceIds))
      : [];

    if (serviceIds.length > 0) {
      const existing = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));
      const missing = serviceIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Dịch vụ không tồn tại: ID ${missing.join(', ')}`,
        );
      }
    }

    return this.appointmentsRepository.createAppointment({
      appointmentTime: appointmentDate,
      customerId,
      vehicleId: dto.vehicleId,
      symptoms: dto.symptoms,
      notes: dto.notes,
      serviceIds,
    });
  }

  async createByAdmin(dto: AdminCreateAppointmentDto): Promise<Appointment> {
    const appointmentDate = new Date(dto.appointmentTime);
    await this.ensureSlotAvailable(appointmentDate);

    const customer = await this.prisma.customer.upsert({
      where: { phone: dto.phone },
      create: {
        phone: dto.phone,
        customerName: dto.customerName,
      },
      update: {
        customerName: dto.customerName,
      },
    });

    const normalizedPlate = dto.licensePlate
      ? dto.licensePlate.toUpperCase().replace(/\s/g, '')
      : undefined;

    let vehicleId: number | undefined;
    if (normalizedPlate) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { licensePlate: normalizedPlate },
      });

      if (existingVehicle && existingVehicle.customerId !== customer.id) {
        throw new BadRequestException(
          `Biển số ${normalizedPlate} đã thuộc về một khách hàng khác.`,
        );
      }

      if (existingVehicle) {
        const updatedVehicle = await this.prisma.vehicle.update({
          where: { id: existingVehicle.id },
          data: {
            brand: dto.brand || existingVehicle.brand,
            model: dto.model || existingVehicle.model,
            vehicleType: dto.vehicleType || existingVehicle.vehicleType,
            customerId: customer.id,
          },
        });
        vehicleId = updatedVehicle.id;
      } else {
        const createdVehicle = await this.prisma.vehicle.create({
          data: {
            licensePlate: normalizedPlate,
            brand: dto.brand || 'Chưa xác định',
            model: dto.model || undefined,
            vehicleType: dto.vehicleType || VehicleType.SCOOTER,
            customerId: customer.id,
          },
        });
        vehicleId = createdVehicle.id;
      }
    }

    return this.appointmentsRepository.createAppointment({
      appointmentTime: appointmentDate,
      customerId: customer.id,
      vehicleId,
      symptoms: dto.symptoms || undefined,
      notes: dto.notes || undefined,
    });
  }

  async findAll(status?: string, dateStr?: string) {
    let date: Date | undefined;
    if (dateStr) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
      if (!m) {
        throw new BadRequestException(
          'Định dạng date không hợp lệ. Dùng YYYY-MM-DD.',
        );
      }
      date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }

    return this.appointmentsRepository.findAllAdmin({
      status: status as AppointmentStatus | undefined,
      date,
    });
  }

  async findOne(id: number) {
    const appt = await this.appointmentsRepository.findById(id);
    if (!appt) {
      throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    }
    return appt;
  }

  async findByCustomer(customerId: number) {
    return this.appointmentsRepository.findByCustomerId(customerId);
  }

  async findByStatus(status: AppointmentStatus) {
    return this.appointmentsRepository.findAllAdmin({ status });
  }

  async adminConfirm(id: number) {
    const appt = await this.findOne(id);

    if (appt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể xác nhận lịch đang PENDING. Trạng thái hiện tại: ${appt.status}`,
      );
    }

    const confirmed = await this.appointmentsRepository.confirm(id);

    this.createNotification({
      type: NotificationType.APPOINTMENT_CONFIRM,
      customerId: appt.customerId,
      title: 'Lịch hẹn đã được xác nhận',
      message: `Lịch hẹn của bạn vào lúc ${new Date(appt.appointmentTime).toLocaleString('vi-VN')} đã được xác nhận.`,
    }).catch((err) =>
      this.logger.warn(`Tạo notification thất bại: ${err.message}`),
    );

    return confirmed;
  }

  async adminCancel(id: number, reason?: string) {
    const appt = await this.findOne(id);

    if (appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Không thể hủy lịch hẹn đã hoàn thành.');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn này đã bị hủy trước đó.');
    }

    const cancelled = await this.appointmentsRepository.cancel(id, reason);

    this.createNotification({
      type: NotificationType.APPOINTMENT_REMINDER,
      customerId: appt.customerId,
      title: 'Lịch hẹn đã bị hủy',
      message:
        `Lịch hẹn vào lúc ${new Date(appt.appointmentTime).toLocaleString('vi-VN')} đã bị hủy` +
        (reason ? `. Lý do: ${reason}` : '.'),
    }).catch((err) =>
      this.logger.warn(`Tạo notification thất bại: ${err.message}`),
    );

    return cancelled;
  }

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

  async rescheduleByCustomer(
    id: number,
    customerId: number,
    dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.appointmentsRepository.findById(id);
    if (!appt || appt.customerId !== customerId) {
      throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    }

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

      // Kiểm tra khách hàng đã đặt trong khung giờ mới chưa (loại trừ lịch hiện tại)
      const isDuplicate =
        await this.appointmentsRepository.hasCustomerBookingInSlot(
          customerId,
          newTime,
          id,
        );
      if (isDuplicate) {
        const hour = String(newTime.getHours()).padStart(2, '0');
        throw new BadRequestException(
          `Bạn đã có lịch hẹn trong khung giờ ${hour}:00 ngày này. Vui lòng chọn ngày hoặc khung giờ khác.`,
        );
      }
    }

    let technicianId = dto.technicianId ?? null;
    if (technicianId) {
      const tech = await this.prisma.user.findUnique({
        where: { id: technicianId },
        include: { role: true },
      });
      if (!tech || tech.role?.roleName !== 'TECHNICIAN') {
        throw new BadRequestException('Kỹ thuật viên không hợp lệ');
      }
    }

    return this.appointmentsRepository.update(id, {
      appointmentTime: newTime,
      technicianId,
    } as any);
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    await this.findOne(id);
    return this.appointmentsRepository.update(id, dto as any);
  }

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

  private async ensureSlotAvailable(appointmentDate: Date) {
    // Dùng giờ VN (UTC+7) để tính slot đúng, tránh lệch UTC
    const vnHour = new Date(appointmentDate.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
    const booked = await this.appointmentsRepository.countByTimeSlot(
      appointmentDate,
      vnHour,
    );
    const available =
      await this.appointmentsRepository.getAvailableSlots(appointmentDate);
    const slotLabel = `${String(vnHour).padStart(2, '0')}:00`;

    if (!available.includes(slotLabel)) {
      throw new BadRequestException(
        `Khung giờ ${slotLabel} đã đầy hoặc nằm ngoài giờ làm việc. ` +
          `Hiện tại đã có ${booked} lịch đặt trong giờ này.`,
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
}
