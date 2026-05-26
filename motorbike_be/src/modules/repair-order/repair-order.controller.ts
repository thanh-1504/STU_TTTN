import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RepairOrderService } from './repair-order.service';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { PayDto } from './dto/pay.dto';

@Controller('repair-orders/:id/payment')
export class RepairOrderController {
  constructor(private service: RepairOrderService) {}

  @Get('summary')
  getSummary(@Param('id') id: string) {
    return this.service.getSummary(Number(id));
  }

  @Post('voucher')
  applyVoucher(@Param('id') id: string, @Body() dto: ApplyVoucherDto) {
    return this.service.applyVoucher(Number(id), dto);
  }

  @Get('qr')
  createQR(@Param('id') id: string) {
    return this.service.createQR(Number(id));
  }

  @Post('pay')
  pay(@Param('id') id: string, @Body() dto: PayDto) {
    return this.service.pay(Number(id), dto);
  }
}