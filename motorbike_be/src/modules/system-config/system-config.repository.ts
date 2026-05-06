import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { SystemConfig } from 'generated/prisma/client';

@Injectable()
export class SystemConfigRepository extends BaseRepository<SystemConfig> {
  constructor(prisma: PrismaService) {
    super(prisma, 'systemConfig');
  }

  /** Lấy giá trị cấu hình theo key */
  async findByKey(configKey: string): Promise<SystemConfig | null> {
    return this.prisma.systemConfig.findUnique({ where: { configKey } });
  }

  /** Upsert: tạo mới hoặc cập nhật cấu hình theo key */
  async upsertByKey(
    configKey: string,
    configValue: string,
    description?: string,
  ): Promise<SystemConfig> {
    return this.prisma.systemConfig.upsert({
      where: { configKey },
      update: { configValue, description },
      create: { configKey, configValue, description },
    });
  }
}
