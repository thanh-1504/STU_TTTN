import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SparePartsService } from './spare-parts.service';
import { CreateSparePartDto } from './dto/create-spare-parts.dto';
import { UpdateSparePartDto } from './dto/update-spare-parts.dto';
import { CreateImportOrderDto } from './dto/create-import-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from 'generated/prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// SPARE PARTS — /admin/spare-parts
// ─────────────────────────────────────────────────────────────────────────────

@Controller('admin/spare-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class SparePartsAdminController {
  constructor(private readonly service: SparePartsService) {}

  /**
   * GET /admin/spare-parts
   * Query params:
   *   - search=<string>      : tìm theo partNumber hoặc partName
   *   - belowMinStock=true   : chỉ hiển thị phụ tùng sắp hết hàng
   */
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('belowMinStock') belowMinStock?: string,
  ) {
    return this.service.findAll(search, belowMinStock === 'true');
  }

  /** GET /admin/spare-parts/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * POST /admin/spare-parts
   * Body: { partNumber, partName, unit?, stockQuantity?, minStockLevel?, sellingPrice }
   * partNumber phải unique.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSparePartDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /admin/spare-parts/:id
   * Chỉ cập nhật: partName, unit, minStockLevel, sellingPrice.
   * Không cho sửa partNumber hay stockQuantity trực tiếp.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSparePartDto,
  ) {
    return this.service.update(id, dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT ORDERS — /admin/import-orders
// ─────────────────────────────────────────────────────────────────────────────

@Controller('admin/import-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class ImportOrdersAdminController {
  constructor(private readonly service: SparePartsService) {}

  /**
   * GET /admin/import-orders
   * Danh sách phiếu nhập kho kèm admin + items + sparePart.
   */
  @Get()
  findAll() {
    return this.service.findAllImportOrders();
  }

  /**
   * GET /admin/import-orders/:id
   * Chi tiết phiếu nhập.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findImportOrderById(id);
  }

  /**
   * POST /admin/import-orders
   * Body: { notes?, items: [{ sparePartId, quantity, importPrice }] }
   *
   * Flow trong $transaction:
   *  1. Tạo ImportOrder (totalAmount = Σ qty*price)
   *  2. Tạo ImportItems
   *  3. incrementStock cho từng phụ tùng
   * Sau đó: tạo STOCK_ALERT notification nếu cần.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateImportOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createImportOrder(dto, user.id);
  }
}
