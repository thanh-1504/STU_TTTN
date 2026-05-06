import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { RepairOrderRepository } from './repair-order.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    VehiclesModule,      // VehiclesRepository
    ReviewsModule,       // ReviewsRepository
    AppointmentsModule,  // AppointmentsRepository
  ],
  controllers: [
    CustomersController,      // Admin: quản lý khách hàng
    CustomerPortalController, // Customer JWT: portal tự phục vụ
  ],
  providers: [
    CustomersService,
    CustomersRepository,
    CustomerPortalService,
    RepairOrderRepository,
  ],
  exports: [CustomersService, CustomersRepository, RepairOrderRepository],
})
export class CustomersModule {}
