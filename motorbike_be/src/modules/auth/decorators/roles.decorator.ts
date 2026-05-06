import { SetMetadata } from '@nestjs/common';
import { RoleName } from 'generated/prisma/client';

/** Key dùng để lưu metadata roles trong Reflector */
export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) — gắn vào Controller hoặc Handler để yêu cầu role cụ thể.
 *
 * Ví dụ:
 *   @Roles(RoleName.ADMIN)
 *   @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
