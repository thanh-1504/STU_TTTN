import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateSparePartSchema = z.object({
  partNumber: z
    .string()
    .min(1, 'Mã phụ tùng không được để trống')
    .max(50, 'Mã phụ tùng tối đa 50 ký tự')
    .describe('Mã phụ tùng (unique)'),
  partName: z
    .string()
    .min(1, 'Tên phụ tùng không được để trống')
    .max(200, 'Tên phụ tùng tối đa 200 ký tự'),
  unit: z.string().max(20).optional().default('cái').describe('Đơn vị tính'),
  stockQuantity: z
    .number()
    .int()
    .min(0, 'Tồn kho không được âm')
    .optional()
    .default(0),
  minStockLevel: z
    .number()
    .int()
    .min(0, 'Ngưỡng cảnh báo không được âm')
    .optional()
    .default(5)
    .describe('Ngưỡng cảnh báo hết hàng'),
  sellingPrice: z
    .number()
    .positive('Giá bán phải lớn hơn 0')
    .describe('Giá bán (VND)'),
});

export class CreateSparePartDto extends createZodDto(CreateSparePartSchema) {}
