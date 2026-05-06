import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../user.repository';

/** Payload trong JWT của nhân viên (Admin / Receptionist / Technician) */
export interface StaffJwtPayload {
  sub: number;      // userId
  role: string;     // RoleName enum string
  type: 'staff';
}

/**
 * JwtStrategy — xác thực JWT của nhân viên nội bộ.
 * Tên strategy: 'jwt' (dùng cho @UseGuards(JwtAuthGuard))
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepository: UserRepository,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'change_me_in_env'),
    });
  }

  async validate(payload: StaffJwtPayload) {
    if (payload.type !== 'staff') {
      throw new UnauthorizedException('Token không hợp lệ cho tài khoản nhân viên');
    }
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hoá');
    }
    return user; // gắn vào request.user
  }
}
