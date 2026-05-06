import { Module } from '@nestjs/common';
import { BannersPublicController, BannersAdminController } from './banners.controller';
import { BannersService } from './banners.service';
import { BannersRepository } from './banners.repository';

@Module({
  controllers: [BannersPublicController, BannersAdminController],
  providers: [BannersService, BannersRepository],
  exports: [BannersService],
})
export class BannersModule {}
