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
import { RoleName } from 'generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  AddItemDto,
  AddServiceDto,
  CompleteRepairDto,
  ExtraQuoteDto,
  UpdateKmTechDto,
  UpdateRepairStatusDto,
} from './dto/technician.dto';
import { TechnicianService } from './technician.service';

@Controller('technician')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.TECHNICIAN)
export class TechnicianController {
  constructor(private readonly service: TechnicianService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.service.getDashboard(user.id);
  }

  @Get('repair-orders')
  listAssigned(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('today') today?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.service.listAssignedOrders(user.id, {
      status,
      today: today === 'true',
      overdue: overdue === 'true',
    });
  }

  @Get('repair-orders/:id')
  getOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.getOrderDetail(id, user.id);
  }

  @Patch('repair-orders/:id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateRepairStatusDto,
  ) {
    return this.service.updateStatus(id, user.id, dto);
  }

  @Post('repair-orders/:id/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: AddItemDto,
  ) {
    return this.service.addItem(id, user.id, dto);
  }

  @Post('repair-orders/:id/services')
  @HttpCode(HttpStatus.CREATED)
  addService(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: AddServiceDto,
  ) {
    return this.service.addService(id, user.id, dto);
  }

  @Patch('repair-orders/:id/vehicle-km')
  @HttpCode(HttpStatus.OK)
  updateKm(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateKmTechDto,
  ) {
    return this.service.updateVehicleKm(id, user.id, dto);
  }

  @Post('repair-orders/:id/extra-quote')
  @HttpCode(HttpStatus.CREATED)
  extraQuote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: ExtraQuoteDto,
  ) {
    return this.service.createExtraQuote(id, user.id, dto);
  }

  @Post('repair-orders/:id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CompleteRepairDto,
  ) {
    return this.service.completeRepair(id, user.id, dto);
  }
}
