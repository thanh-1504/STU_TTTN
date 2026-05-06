import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { RedisService } from './services/redis.service';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';

@Global()
@Module({
  controllers: [SharedController],
  providers: [SharedService, PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class SharedModule {}

