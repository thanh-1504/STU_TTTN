import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTO tạo lịch hẹn từ phía lễ tân (nội bộ).
 * Khác CustomerCreateAppointment: cho phép gán customerId + technicianId.
 */
export const CreateAppointmentByStaffSchema = z.object({
  appointmentTime: z.coerce.date(),
  customerId: z.number().int().positive(),
  vehicleId: z.number().int().positive().optional().nullable(),
  technicianId: z.number().int().positive().optional().nullable(),
  symptoms: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});

export class CreateAppointmentByStaffDto extends createZodDto(
  CreateAppointmentByStaffSchema,
) {}
