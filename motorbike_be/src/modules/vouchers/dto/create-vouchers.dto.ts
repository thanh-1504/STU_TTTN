import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateVoucherSchema = z.object({
  voucherCode: z.string().max(50).describe('Mã voucher'),
  description: z.string().optional().describe('Mô tả voucher'),
  discountAmount: z.number().positive().optional().describe('Giảm cố định (VND)'),
  discountPercent: z.number().int().min(1).max(100).optional().describe('Giảm theo % (1-100)'),
  maxDiscount: z.number().positive().optional().describe('Giảm tối đa khi dùng %'),
  minOrderValue: z.number().min(0).optional().default(0).describe('Giá trị đơn tối thiểu'),
  startDate: z.coerce.date().describe('Ngày bắt đầu'),
  endDate: z.coerce.date().describe('Ngày kết thúc'),
}).refine(
  (data) => data.discountAmount || data.discountPercent,
  { message: 'Phải có discountAmount hoặc discountPercent' },
);

export class CreateVoucherDto extends createZodDto(CreateVoucherSchema) {}
