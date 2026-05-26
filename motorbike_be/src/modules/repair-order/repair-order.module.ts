import { Module } from '@nestjs/common';
import { RepairOrderController } from './repair-order.controller';
import { RepairOrderService } from './repair-order.service';
import { RepairOrderRepository } from './repair-order.repository';

@Module({
  controllers: [RepairOrderController],
  providers: [RepairOrderService, RepairOrderRepository],
})
export class RepairOrderModule {}