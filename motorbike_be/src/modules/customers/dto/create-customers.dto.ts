import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCustomerSchema = z.object({
  phone: z.string().max(15).describe('Số điện thoại khách hàng'),
  customerName: z.string().min(2).max(100).describe('Tên khách hàng'),
  address: z.string().optional().describe('Địa chỉ'),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
