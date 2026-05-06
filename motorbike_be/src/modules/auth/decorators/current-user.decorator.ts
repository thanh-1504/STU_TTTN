import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User, Customer } from 'generated/prisma/client';

/**
 * @CurrentUser() — lấy user hiện tại từ request (được set bởi JwtStrategy hoặc CustomerJwtStrategy).
 *
 * Dùng cho nhân viên (sau JwtAuthGuard) → trả về User object (kèm role)
 * Dùng cho khách hàng (sau CustomerJwtAuthGuard) → trả về Customer object
 *
 * Ví dụ:
 *   @Get('profile')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: User) { ... }
 *
 *   @Get('me')
 *   @UseGuards(CustomerJwtAuthGuard)
 *   getMe(@CurrentUser() customer: Customer) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | Customer => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
