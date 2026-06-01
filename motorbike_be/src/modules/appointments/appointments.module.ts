import { Module } from '@nestjs/common';
import { MailService } from 'src/shared/services/mail.service';
import {
  AppointmentsAdminController,
  AppointmentsCustomerController,
  AppointmentsPublicController,
} from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  controllers: [
    AppointmentsPublicController, // GET /appointments/available-slots (public)
    AppointmentsCustomerController, // POST /appointments (Customer JWT)
    AppointmentsAdminController, // /admin/appointments (Staff JWT)
  ],
  providers: [AppointmentsService, AppointmentsRepository, MailService],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
