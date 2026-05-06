import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** Một dòng trong phiếu nhập kho */
export const ImportItemSchema = z.object({
  sparePartId: z.number().int().positive('ID phụ tùng phải là số nguyên dương'),
  quantity: z
    .number()
    .int()
    .positive('Số lượng phải lớn hơn 0')
    .describe('Số lượng nhập'),
  importPrice: z
    .number()
    .positive('Giá nhập phải lớn hơn 0')
    .describe('Giá nhập (giá vốn, VND)'),
});

export type ImportItemData = z.infer<typeof ImportItemSchema>;

/** DTO tạo phiếu nhập kho */
export const CreateImportOrderSchema = z.object({
  notes: z.string().max(1000).optional().describe('Ghi chú phiếu nhập'),
  items: z
    .array(ImportItemSchema)
    .min(1, 'Phiếu nhập phải có ít nhất 1 mặt hàng'),
});

export class CreateImportOrderDto extends createZodDto(CreateImportOrderSchema) {}
