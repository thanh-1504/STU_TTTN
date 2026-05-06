import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** Update DTO: chỉ cho phép cập nhật giá, ngưỡng cảnh báo, tên, đơn vị */
export const UpdateSparePartSchema = z.object({
  partName: z.string().min(1).max(200).optional(),
  unit: z.string().max(20).optional(),
  minStockLevel: z
    .number()
    .int()
    .min(0, 'Ngưỡng cảnh báo không được âm')
    .optional(),
  sellingPrice: z
    .number()
    .positive('Giá bán phải lớn hơn 0')
    .optional(),
});

export class UpdateSparePartDto extends createZodDto(UpdateSparePartSchema) {}
