import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import {
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
} from './modules';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
