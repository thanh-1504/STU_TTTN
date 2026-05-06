import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username tối thiểu 3 ký tự')
    .max(50, 'Username tối đa 50 ký tự')
    .regex(/^[a-z0-9_.]+$/i, 'Username chỉ gồm chữ, số, dấu chấm, gạch dưới'),
  fullname: z.string().min(1, 'Họ tên không được để trống').max(150),
  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').max(150),
  roleId: z
    .number()
    .int()
    .positive('roleId phải là số nguyên dương')
    .describe('ID của vai trò (chỉ RECEPTIONIST hoặc TECHNICIAN)'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UpdateUserSchema = CreateUserSchema.partial().omit({ username: true });
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
