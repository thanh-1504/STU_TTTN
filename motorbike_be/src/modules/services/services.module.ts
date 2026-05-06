import { Module } from '@nestjs/common';
import { ServicesPublicController, ServicesAdminController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';

@Module({
  controllers: [ServicesPublicController, ServicesAdminController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService, ServicesRepository],
})
export class ServicesModule {}
