import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from 'generated/prisma/client';

/**
 * RolesGuard — kiểm tra role của nhân viên đã đăng nhập.
 * Phải dùng SAU JwtAuthGuard (vì cần request.user đã được set).
 *
 * Ví dụ dùng:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(RoleName.ADMIN)
 *   @Get('admin-only')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không yêu cầu role cụ thể → cho phép tất cả nhân viên đã login
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const hasRole = requiredRoles.includes(user.role.roleName as RoleName);
    if (!hasRole) {
      throw new ForbiddenException(
        `Yêu cầu quyền: ${requiredRoles.join(', ')}. Vai trò hiện tại: ${user.role.roleName}`,
      );
    }

    return true;
  }
}
