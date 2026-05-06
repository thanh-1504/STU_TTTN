// Module
export { AuthModule } from './auth.module';

// Service & Repositories
export { AuthService } from './auth.service';
export { UserRepository } from './user.repository';
export { CustomerRepository } from './customer.repository';

// DTOs & Schemas
export { LoginDto, LoginSchema } from './dto/auth.dto';
export { SendOtpDto, SendOtpSchema } from './dto/auth.dto';
export { VerifyOtpDto, VerifyOtpSchema } from './dto/auth.dto';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Decorators
export { Roles, ROLES_KEY } from './decorators/roles.decorator';
export { CurrentUser } from './decorators/current-user.decorator';

// Strategies (payload types)
export type { StaffJwtPayload } from './strategies/jwt.strategy';
export type { CustomerJwtPayload } from './strategies/customer-jwt.strategy';
