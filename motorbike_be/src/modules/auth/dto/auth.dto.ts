import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ─── Admin / Staff Login ──────────────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập hoặc email tối thiểu 3 ký tự')
    .max(255, 'Tên đăng nhập hoặc email tối đa 255 ký tự'),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(255),
});

export class LoginDto extends createZodDto(LoginSchema) {}

// ─── Customer OTP (giữ lại để backward-compat) ───────────────────────────────

export const SendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  customerName: z
    .string()
    .max(100, 'Tên tối đa 100 ký tự')
    .optional()
    .describe('Tên khách hàng (tùy chọn, dùng khi đăng ký lần đầu)'),
});

export class SendOtpDto extends createZodDto(SendOtpSchema) {}

export const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  otp: z
    .string()
    .length(6, 'Mã OTP phải đúng 6 ký tự')
    .regex(/^\d{6}$/, 'Mã OTP chỉ gồm chữ số'),
});

export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {}

// ─── Customer Email / Password ────────────────────────────────────────────────

export const CustomerRegisterSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(255),
  customerName: z
    .string()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z
    .string()
    .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
});

export class CustomerRegisterDto extends createZodDto(CustomerRegisterSchema) {}

export const CustomerLoginSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu'),
});

export class CustomerLoginDto extends createZodDto(CustomerLoginSchema) {}

