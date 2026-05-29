import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RescheduleAppointmentSchema = z.object({
  appointmentTime: z.coerce
    .date()
    .refine((d) => d > new Date(), {
      message: 'Thoi gian hen phai la thoi diem trong tuong lai',
    })
    .describe('Thoi gian hen (ISO 8601)'),
  technicianId: z.number().int().positive().optional().nullable(),
});

export class RescheduleAppointmentDto extends createZodDto(
  RescheduleAppointmentSchema,
) {}
