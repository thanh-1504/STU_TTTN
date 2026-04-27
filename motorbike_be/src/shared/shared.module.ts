import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';

@Global()
@Module({
  controllers: [SharedController],
  providers: [SharedService, PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
