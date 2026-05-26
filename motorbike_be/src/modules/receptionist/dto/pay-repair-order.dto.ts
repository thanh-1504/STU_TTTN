import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PayRepairOrderSchema = z.object({
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'QR_CODE']),
  paidAmount: z.number().positive('Số tiền thanh toán phải > 0'),
  voucherCode: z.string().max(50).optional(),
});

export class PayRepairOrderDto extends createZodDto(PayRepairOrderSchema) {}
