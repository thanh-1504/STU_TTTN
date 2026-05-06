import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Repositories
import { UserRepository } from './user.repository';
import { CustomerRepository } from './customer.repository';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

// Guards (export để module khác dùng @UseGuards)
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'change_me_in_env'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN', '7d')) as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Service & Repositories
    AuthService,
    UserRepository,
    CustomerRepository,
    // Passport Strategies
    JwtStrategy,
    CustomerJwtStrategy,
    // Guards (registered as providers để có thể @Inject ở nơi khác)
    JwtAuthGuard,
    CustomerJwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    // Export để các module khác dùng guards, decorators, JwtService
    AuthService,
    JwtModule,
    JwtAuthGuard,
    CustomerJwtAuthGuard,
    RolesGuard,
    UserRepository,
    CustomerRepository,
  ],
})
export class AuthModule {}
