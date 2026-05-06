import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto, UpdateSortOrderDto } from './dto/banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from 'generated/prisma/client';

@Controller('banners')
export class BannersPublicController {
  constructor(private readonly bannersService: BannersService) {}
  /** GET /banners — Chỉ banner active + trong thời hạn */
  @Get()
  findActive() { return this.bannersService.findActive(); }
}

@Controller('admin/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class BannersAdminController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll() { return this.bannersService.findAll(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBannerDto) { return this.bannersService.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  /** PATCH /admin/banners/:id/sort — Cập nhật thứ tự hiển thị */
  @Patch(':id/sort')
  updateSort(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSortOrderDto) {
    return this.bannersService.updateSortOrder(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) { return this.bannersService.remove(id); }
}
