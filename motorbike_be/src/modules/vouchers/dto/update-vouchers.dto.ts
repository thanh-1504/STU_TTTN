import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Định nghĩa lại object base (không có refine) để .partial() hoạt động
export const UpdateVoucherSchema = z.object({
  voucherCode: z.string().max(50).optional(),
  description: z.string().optional(),
  discountAmount: z.number().positive().optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']).optional(),
});
export class UpdateVoucherDto extends createZodDto(UpdateVoucherSchema) {}

