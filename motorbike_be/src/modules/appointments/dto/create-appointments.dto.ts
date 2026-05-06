import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTO dùng cho Customer đặt lịch qua portal (POST /appointments).
 * customerId được lấy từ JWT token — không cần truyền trong body.
 */
export const CreateAppointmentSchema = z.object({
  appointmentTime: z.coerce
    .date()
    .refine((d) => d > new Date(), {
      message: 'Thời gian hẹn phải là thời điểm trong tương lai',
    })
    .describe('Thời gian hẹn (ISO 8601)'),
  symptoms: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .optional()
    .describe('Mô tả triệu chứng / yêu cầu'),
  notes: z
    .string()
    .max(500, 'Ghi chú tối đa 500 ký tự')
    .optional()
    .describe('Ghi chú thêm'),
  vehicleId: z
    .number()
    .int()
    .positive('ID xe phải là số nguyên dương')
    .optional()
    .describe('ID xe (nếu đã đăng ký)'),
});

export class CreateAppointmentDto extends createZodDto(CreateAppointmentSchema) {}
