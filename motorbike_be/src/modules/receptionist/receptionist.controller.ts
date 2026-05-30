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
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAppointmentByStaffDto } from './dto/create-appointment-staff.dto';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { PayRepairOrderDto } from './dto/pay-repair-order.dto';
import { ReceptionistService } from './receptionist.service';

const AssignTechSchema = z.object({
  technicianId: z.number().int().positive(),
});
class AssignTechDto extends createZodDto(AssignTechSchema) {}

const RescheduleSchema = z.object({
  appointmentTime: z.coerce
    .date()
    .refine((d) => d > new Date(), {
      message: 'Thoi gian hen phai la thoi diem trong tuong lai',
    }),
  technicianId: z.number().int().positive().optional().nullable(),
});
class RescheduleDto extends createZodDto(RescheduleSchema) {}

@Controller('receptionist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class ReceptionistController {
  constructor(private readonly service: ReceptionistService) {}

  // ── Dashboard ──────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  // ── Technicians (dropdown) ─────────────────────────────────
  @Get('technicians')
  listTechnicians() {
    return this.service.listTechnicians();
  }

  // ── Appointments ───────────────────────────────────────────
  @Get('appointments')
  listAppointments(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.service.listAppointments({
      status,
      date,
      technicianId: technicianId ? Number(technicianId) : undefined,
    });
  }

  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  createAppointment(@Body() dto: CreateAppointmentByStaffDto) {
    return this.service.createAppointment(dto);
  }

  @Patch('appointments/:id/assign')
  assignTechnician(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTechDto,
  ) {
    return this.service.assignTechnician(id, dto.technicianId);
  }

  @Patch('appointments/:id/reschedule')
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleDto,
  ) {
    return this.service.rescheduleAppointment(id, dto);
  }

  // ── Repair Orders ──────────────────────────────────────────
  @Get('repair-orders')
  listRepairOrders(@Query('status') status?: string) {
    return this.service.listRepairOrders(status);
  }

  @Get('repair-orders/:id')
  getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRepairOrderDetail(id);
  }

  @Post('repair-orders')
  @HttpCode(HttpStatus.CREATED)
  createRepairOrder(
    @Body() dto: CreateRepairOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createRepairOrder(dto, user.id);
  }

  // ── Payment ────────────────────────────────────────────────
  @Post('repair-orders/:id/preview-voucher')
  @HttpCode(HttpStatus.OK)
  previewVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { voucherCode?: string },
  ) {
    return this.service.previewVoucher(id, body?.voucherCode);
  }

  @Get('payment-info')
  getPaymentInfo() {
    return this.service.getPaymentInfo();
  }

  @Post('repair-orders/:id/pay')
  @HttpCode(HttpStatus.OK)
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayRepairOrderDto,
  ) {
    return this.service.payRepairOrder(id, dto);
  }

  // ── Customers ──────────────────────────────────────────────
  @Get('customers')
  listCustomers(@Query('search') search?: string) {
    return this.service.listCustomers(search);
  }

  @Get('customers/:id')
  getCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCustomerDetail(id);
  }

  // ── Vehicles ───────────────────────────────────────────────
  @Get('vehicles')
  listVehicles(@Query('search') search?: string) {
    return this.service.listVehicles(search);
  }

  @Get('vehicles/:id')
  getVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.service.getVehicleDetail(id);
  }
}
