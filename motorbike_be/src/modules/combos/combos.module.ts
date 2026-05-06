import { Module } from '@nestjs/common';
import { CombosPublicController, CombosAdminController } from './combos.controller';
import { CombosService } from './combos.service';
import { CombosRepository } from './combos.repository';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule], // import để inject ServicesRepository vào CombosService
  controllers: [CombosPublicController, CombosAdminController],
  providers: [CombosService, CombosRepository],
  exports: [CombosService, CombosRepository],
})
export class CombosModule {}
