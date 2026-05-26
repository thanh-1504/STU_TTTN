import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AppointmentsModule,
  AuthModule,
  BannersModule,
  BlogModule,
  CombosModule,
  CustomersModule,
  ReceptionistModule,
  RepairOrderModule,
  ReportsModule,
  ReviewsModule,
  ServicesModule,
  SparePartsModule,
  SystemConfigModule,
  TechnicianModule,
  UsersModule,
  VehiclesModule,
  VouchersModule,
} from './modules';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    // ── Business Modules ─────────────────────────────────────
    AuthModule,
    UsersModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    ServicesModule,
    CombosModule,
    SparePartsModule,
    VouchersModule,
    BlogModule,
    BannersModule,
    ReviewsModule,
    ReportsModule,
    SystemConfigModule,
    RepairOrderModule,
    ReceptionistModule,
    TechnicianModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
