import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateComboSchema = z.object({
  comboName: z
    .string()
    .min(1, 'Tên gói combo không được để trống')
    .max(255, 'Tên combo tối đa 255 ký tự'),
  description: z.string().optional(),
  imageUrl: z.string().url('URL hình ảnh không hợp lệ').max(500).optional(),
  discountPct: z
    .number()
    .min(0, 'Phần trăm giảm giá không được âm')
    .max(100, 'Phần trăm giảm giá tối đa 100%')
    .optional(),
  isActive: z.boolean().optional().default(true),
  serviceIds: z
    .array(z.number().int().positive('ID dịch vụ phải là số nguyên dương'))
    .min(1, 'Combo phải có ít nhất 1 dịch vụ'),
});

export class CreateComboDto extends createZodDto(CreateComboSchema) {}
