import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RoleName } from 'generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Staff Login ──────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * Đăng nhập nhân viên (Admin / Receptionist / Technician)
   * Body: { username, password }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /auth/me
   * Trả thông tin nhân viên đang đăng nhập (protected)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      role: user.role?.roleName,
    };
  }

  /**
   * GET /auth/admin-only
   * Ví dụ route chỉ ADMIN mới truy cập được
   */
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  adminOnly(@CurrentUser() user: any) {
    return { message: `Xin chào Admin ${user.fullname}` };
  }

  // ── Customer OTP ─────────────────────────────────────────────────────────────

  /**
   * POST /auth/otp/send
   * Gửi OTP về số điện thoại khách hàng (mock: log console)
   * Body: { phone, customerName? }
   */
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /**
   * POST /auth/otp/verify
   * Xác thực OTP, upsert Customer, trả JWT
   * Body: { phone, otp }
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * GET /auth/customer/me
   * Trả thông tin khách hàng đang đăng nhập (protected by CustomerJwtAuthGuard)
   */
  @Get('customer/me')
  @UseGuards(CustomerJwtAuthGuard)
  getCustomerMe(@CurrentUser() customer: any) {
    return {
      id: customer.id,
      phone: customer.phone,
      customerName: customer.customerName,
      totalSpent: customer.totalSpent,
    };
  }
}
