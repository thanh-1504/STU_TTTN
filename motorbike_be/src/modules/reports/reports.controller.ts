import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from 'generated/prisma/client';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /admin/reports/dashboard
   * Tổng quan nhanh: tổng KH, lịch hẹn chờ, phiếu đang xử lý, tổng doanh thu.
   */
  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  /**
   * GET /admin/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Response:
   * {
   *   from, to,
   *   totalAmount: number,
   *   totalOrders: number,
   *   byDate: [{date: 'YYYY-MM-DD', amount: number}]
   * }
   *
   * Validate:
   *  - from <= to
   *  - Khoảng cách tối đa 365 ngày
   *  - Mặc định: tháng hiện tại
   */
  @Get('revenue')
  getRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRevenue(from, to);
  }

  /**
   * GET /admin/reports/services?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=10
   *
   * Response: { from, to, data: [{serviceName, count, totalAmount}] }
   */
  @Get('services')
  getTopServices(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.reportsService.getTopServices(from, to, limit);
  }

  /**
   * GET /admin/reports/inventory
   * Không cần date range — snapshot tồn kho hiện tại.
   *
   * Response: { totalValue, belowMinStockCount, belowMinStock: SparePart[] }
   */
  @Get('inventory')
  getInventory() {
    return this.reportsService.getInventory();
  }

  /**
   * GET /admin/reports/customers?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Response: { from, to, newCustomers, returningCustomers, avgOrderValue }
   */
  @Get('customers')
  getCustomerStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getCustomerStats(from, to);
  }

  /**
   * GET /admin/reports/top-customers?limit=10
   * Khách hàng chi tiêu nhiều nhất (all time).
   */
  @Get('top-customers')
  getTopCustomers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.reportsService.getTopCustomers(limit);
  }
}
