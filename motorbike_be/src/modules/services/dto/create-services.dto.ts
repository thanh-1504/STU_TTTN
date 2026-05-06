import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateServiceSchema = z.object({
  serviceName: z
    .string()
    .min(1, 'Tên dịch vụ không được để trống')
    .max(255, 'Tên dịch vụ tối đa 255 ký tự'),
  description: z.string().optional(),
  imageUrl: z.string().url('URL hình ảnh không hợp lệ').max(500).optional(),
  durationMinutes: z
    .number()
    .int('Thời gian phải là số nguyên')
    .min(1, 'Thời gian thực hiện phải lớn hơn 0'),
  priceManual: z
    .number()
    .positive('Giá xe số phải lớn hơn 0'),
  priceScooter: z
    .number()
    .positive('Giá xe tay ga phải lớn hơn 0'),
  priceMoto: z
    .number()
    .positive('Giá xe PKL phải lớn hơn 0'),
  isActive: z.boolean().optional().default(true),
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}
