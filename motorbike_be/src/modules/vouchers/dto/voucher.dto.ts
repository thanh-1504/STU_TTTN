import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** Base fields — KHÔNG có superRefine để .partial() hoạt động */
const VoucherBaseSchema = z.object({
  voucherCode: z
    .string()
    .min(1, 'Mã voucher không được để trống')
    .max(50, 'Mã voucher tối đa 50 ký tự')
    .regex(/^[A-Z0-9_-]+$/i, 'Mã voucher chỉ gồm chữ, số, gạch dưới, gạch ngang'),
  description: z.string().max(1000).optional(),
  discountAmount: z.number().positive('Số tiền giảm phải lớn hơn 0').optional().nullable(),
  discountPercent: z.number().int().min(1).max(100).optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  minOrderValue: z.number().min(0).optional().default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

/** Kiểm tra exactly-one discount và endDate > startDate */
function refineVoucher(data: any, ctx: z.RefinementCtx) {
  const hasAmount = data.discountAmount != null && data.discountAmount > 0;
  const hasPercent = data.discountPercent != null && data.discountPercent > 0;

  if (!hasAmount && !hasPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountAmount'],
      message: 'Phải cung cấp discountAmount hoặc discountPercent.',
    });
  }
  if (hasAmount && hasPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountAmount'],
      message: 'Không thể vừa có discountAmount vừa có discountPercent.',
    });
  }
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: '"endDate" phải lớn hơn "startDate".',
    });
  }
}

/** Create: tất cả required fields + validate */
export const CreateVoucherSchema = VoucherBaseSchema.superRefine(refineVoucher);
export class CreateVoucherDto extends createZodDto(CreateVoucherSchema) {}

/** Update: partial của BASE (không có superRefine) + thêm date check riêng */
export const UpdateVoucherSchema = VoucherBaseSchema.partial().superRefine(
  (data, ctx) => {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '"endDate" phải lớn hơn "startDate".',
      });
    }
  },
);
export class UpdateVoucherDto extends createZodDto(UpdateVoucherSchema) {}
