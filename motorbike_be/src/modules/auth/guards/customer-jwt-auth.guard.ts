import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * CustomerJwtAuthGuard — bảo vệ route chỉ cho khách hàng (OTP JWT).
 * Dùng strategy 'jwt-customer'.
 */
@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('jwt-customer') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
