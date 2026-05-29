import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ReceptionistController } from './receptionist.controller';
import { ReceptionistService } from './receptionist.service';

@Module({
  imports: [AppointmentsModule],
  controllers: [ReceptionistController],
  providers: [ReceptionistService],
})
export class ReceptionistModule {}
