import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { VouchersAdminController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { VouchersRepository } from './vouchers.repository';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [VouchersAdminController],
  providers: [VouchersService, VouchersRepository],
  exports: [VouchersService, VouchersRepository],
})
export class VouchersModule {}
