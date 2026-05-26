import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerRepository } from '../customer.repository';

/** Payload trong JWT của khách hàng (Customer OTP) */
export interface CustomerJwtPayload {
  sub: number;         // customerId
  phone: string;
  type: 'customer';
}

/**
 * CustomerJwtStrategy — xác thực JWT của khách hàng (OTP flow).
 * Tên strategy: 'jwt-customer' (dùng cho @UseGuards(CustomerJwtAuthGuard))
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  constructor(
    private readonly customerRepository: CustomerRepository,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'change_me_in_env'),
    });
  }

  async validate(payload: CustomerJwtPayload) {
    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Bạn không có quyền thực hiện hành động này.');
    }
    const customer = await this.customerRepository.findByPhone(payload.phone);
    if (!customer) {
      throw new UnauthorizedException('Khách hàng không tồn tại');
    }
    return customer; // gắn vào request.user
  }
}
