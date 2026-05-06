import { Module } from '@nestjs/common';
import {
  AppointmentsPublicController,
  AppointmentsCustomerController,
  AppointmentsAdminController,
} from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';

@Module({
  controllers: [
    AppointmentsPublicController,   // GET /appointments/available-slots (public)
    AppointmentsCustomerController, // POST /appointments (Customer JWT)
    AppointmentsAdminController,    // /admin/appointments (Staff JWT)
  ],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
