import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemConfigRepository } from './system-config.repository';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private readonly systemConfigRepository: SystemConfigRepository) {}

  async findAll() {
    return this.systemConfigRepository.findAll({ orderBy: { configKey: 'asc' } });
  }

  async findByKey(key: string) {
    return this.systemConfigRepository.findByKey(key);
  }

  async findOne(id: number) {
    const config = await this.systemConfigRepository.findById(id);
    if (!config) throw new NotFoundException(`Không tìm thấy cấu hình #${id}`);
    return config;
  }

  async upsert(dto: CreateSystemConfigDto) {
    return this.systemConfigRepository.upsertByKey(
      dto.configKey,
      dto.configValue,
      dto.description,
    );
  }

  async update(id: number, dto: UpdateSystemConfigDto) {
    await this.findOne(id);
    return this.systemConfigRepository.update(id, dto as any);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.systemConfigRepository.delete(id);
  }
}
