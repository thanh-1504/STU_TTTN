import { Module } from '@nestjs/common';
import {
  SparePartsAdminController,
  ImportOrdersAdminController,
} from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';
import { SparePartsRepository } from './spare-parts.repository';
import { ImportOrderRepository } from './import-order.repository';

@Module({
  controllers: [
    SparePartsAdminController,   // GET /admin/spare-parts (ADMIN + RECEPTIONIST)
    ImportOrdersAdminController, // GET/POST /admin/import-orders (ADMIN only)
  ],
  providers: [
    SparePartsService,
    SparePartsRepository,
    ImportOrderRepository,
  ],
  exports: [
    SparePartsService,
    SparePartsRepository,
    ImportOrderRepository,
  ],
})
export class SparePartsModule {}
