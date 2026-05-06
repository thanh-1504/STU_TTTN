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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointments.dto';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from 'generated/prisma/client';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// DTO cho cancel admin
const AdminCancelSchema = z.object({ reason: z.string().max(500).optional() });
class AdminCancelDto extends createZodDto(AdminCancelSchema) {}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /appointments/available-slots
// ─────────────────────────────────────────────────────────────────────────────

@Controller('appointments')
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('available-slots')
  getAvailableSlots(@Query('date') date: string) {
    if (!date) {
      return { statusCode: 400, message: 'Thiếu query param ?date=YYYY-MM-DD' };
    }
    return this.appointmentsService.getAvailableSlots(date);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER JWT
// ─────────────────────────────────────────────────────────────────────────────

@Controller('appointments')
@UseGuards(CustomerJwtAuthGuard)
export class AppointmentsCustomerController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() customer: any) {
    return this.appointmentsService.createByCustomer(dto, customer.id);
  }

  @Get('my')
  getMyAppointments(@CurrentUser() customer: any) {
    return this.appointmentsService.findByCustomer(customer.id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: /admin/appointments
// ─────────────────────────────────────────────────────────────────────────────

@Controller('admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.TECHNICIAN)
export class AppointmentsAdminController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * GET /admin/appointments?status=PENDING|CONFIRMED|CANCELLED&date=YYYY-MM-DD
   * Filter kết hợp status + date.
   */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAll(status, date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.appointmentsService.findByCustomer(customerId);
  }

  /** PATCH /admin/appointments/:id — Cập nhật chung (gán KTV, v.v.) */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  /**
   * PATCH /admin/appointments/:id/confirm
   * PENDING → CONFIRMED + gửi Notification APPOINTMENT_CONFIRM cho customer.
   */
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.adminConfirm(id);
  }

  /**
   * PATCH /admin/appointments/:id/cancel
   * → CANCELLED + gửi Notification APPOINTMENT_CANCEL cho customer.
   * Body: { reason?: string }
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminCancelDto,
  ) {
    return this.appointmentsService.adminCancel(id, dto.reason);
  }
}
