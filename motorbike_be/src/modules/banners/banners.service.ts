import { Injectable, NotFoundException } from '@nestjs/common';
import { BannersRepository } from './banners.repository';
import { CreateBannerDto, UpdateBannerDto, UpdateSortOrderDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly bannersRepo: BannersRepository) {}

  findActive() { return this.bannersRepo.findAllActive(); }
  findAll() { return this.bannersRepo.findAll(); }

  async findOne(id: number) {
    const b = await this.bannersRepo.findById(id);
    if (!b) throw new NotFoundException(`Không tìm thấy banner #${id}`);
    return b;
  }

  create(dto: CreateBannerDto) { return this.bannersRepo.create(dto); }

  async update(id: number, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.bannersRepo.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.bannersRepo.delete(id);
    return { message: 'Xóa banner thành công.' };
  }

  async updateSortOrder(id: number, dto: UpdateSortOrderDto) {
    await this.findOne(id);
    return this.bannersRepo.updateSortOrder(id, dto.sortOrder);
  }
}
