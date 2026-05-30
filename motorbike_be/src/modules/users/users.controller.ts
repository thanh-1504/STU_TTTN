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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './dto/create-users.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /admin/users?role=RECEPTIONIST|TECHNICIAN&isActive=true|false
   * Danh sách nhân viên, filter theo role và trạng thái hoạt động.
   */
  @Get()
  findAll(@Query('role') role?: string, @Query('isActive') isActive?: string) {
    return this.usersService.findAll(role, isActive);
  }

  /** GET /admin/users/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /**
   * GET /admin/users/:id/stats
   * Thống kê tháng hiện tại: totalOrders + totalRevenue (join RepairOrder)
   */
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getStats(id);
  }

  /**
   * POST /admin/users
   * Tạo tài khoản nhân viên — chỉ RECEPTIONIST | TECHNICIAN.
   * Mật khẩu tự động sinh 8 ký tự, log ra console (mock email).
   *
   * Body: { username, fullname, phone?, email?, roleId }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  /**
   * PATCH /admin/users/:id/toggle-active
   * Bật/tắt trạng thái hoạt động (không xóa tài khoản).
   */
  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActive(id);
  }

  /** PATCH /admin/users/:id */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }
}

@Controller('public/technicians')
export class PublicTechniciansController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll('TECHNICIAN', 'true');
  }
}
