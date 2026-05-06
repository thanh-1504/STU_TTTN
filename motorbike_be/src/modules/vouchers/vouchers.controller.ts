import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from 'generated/prisma/client';

@Controller('admin/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class VouchersAdminController {
  constructor(private readonly vouchersService: VouchersService) {}

  /**
   * GET /admin/vouchers?status=ACTIVE|EXPIRED|REVOKED
   */
  @Get()
  findAll(@Query('status') status?: string) {
    return this.vouchersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vouchersService.findOne(id);
  }

  /**
   * POST /admin/vouchers
   * Validate: discountAmount XOR discountPercent, endDate > startDate
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  /** POST /admin/vouchers/:id/revoke — Hủy thủ công */
  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  revoke(@Param('id', ParseIntPipe) id: number) {
    return this.vouchersService.revoke(id);
  }

  /**
   * POST /admin/vouchers/scan-expired
   * Trigger thủ công: quét và set EXPIRED cho các voucher quá hạn.
   * Dùng khi admin load trang để đảm bảo dữ liệu luôn cập nhật.
   */
  @Post('scan-expired')
  @HttpCode(HttpStatus.OK)
  async scanExpired() {
    const count = await this.vouchersService.scanExpiredNow();
    return { updated: count, message: `Đã cập nhật ${count} voucher sang trạng thái Hết hạn.` };
  }
}
