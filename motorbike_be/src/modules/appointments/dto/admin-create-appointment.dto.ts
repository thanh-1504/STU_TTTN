import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AdminCreateAppointmentSchema = z.object({
  appointmentTime: z.coerce
    .date()
    .refine((d) => d > new Date(), {
      message: 'Thời gian hẹn phải là thời điểm trong tương lai',
    })
    .describe('Thời gian hẹn (ISO 8601)'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại khách hàng')
    .max(15, 'Số điện thoại tối đa 15 ký tự'),
  customerName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên khách hàng')
    .max(100, 'Tên khách hàng tối đa 100 ký tự'),
  brand: z.string().trim().max(50).optional(),
  model: z.string().trim().max(100).optional(),
  licensePlate: z.string().trim().max(20).optional(),
  vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG']).optional(),
  symptoms: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(500).optional(),
});

export class AdminCreateAppointmentDto extends createZodDto(
  AdminCreateAppointmentSchema,
) {}
