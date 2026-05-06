import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTO cho Admin cập nhật lịch hẹn.
 * Dùng schema độc lập (không extends CreateAppointmentSchema có refine) để tránh conflict.
 */
export const UpdateAppointmentSchema = z
  .object({
    appointmentTime: z.coerce.date().optional(),
    symptoms: z.string().max(1000).optional(),
    notes: z.string().max(500).optional(),
    vehicleId: z.number().int().positive().optional().nullable(),
    technicianId: z.number().int().positive().optional().nullable(),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
      .optional()
      .describe('Trạng thái lịch hẹn'),
  })
  .partial();

export class UpdateAppointmentDto extends createZodDto(UpdateAppointmentSchema) {}
