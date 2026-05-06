import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import {
  PortalCreateVehicleDto,
  UpdateKmDto,
  CreatePortalReviewDto,
} from './dto/portal.dto';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * CustomerPortalController — tất cả route yêu cầu Customer JWT.
 * customerId luôn lấy từ @CurrentUser(), không truyền qua body.
 */
@Controller('portal')
@UseGuards(CustomerJwtAuthGuard)
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // VEHICLES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /portal/vehicles
   * Danh sách xe của customer đang đăng nhập.
   */
  @Get('vehicles')
  getMyVehicles(@CurrentUser() customer: any) {
    return this.portalService.getMyVehicles(customer.id);
  }

  /**
   * POST /portal/vehicles
   * Thêm xe mới. Biển số được normalize (UPPERCASE, bỏ khoảng trắng).
   * Body: { licensePlate, brand, vehicleType, model?, currentKm?, notes? }
   */
  @Post('vehicles')
  @HttpCode(HttpStatus.CREATED)
  addVehicle(
    @Body() dto: PortalCreateVehicleDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.addVehicle(dto, customer.id);
  }

  /**
   * PATCH /portal/vehicles/:id/km
   * Cập nhật số KM (phải là xe của chính customer).
   * Body: { currentKm: number }
   */
  @Patch('vehicles/:id/km')
  updateKm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKmDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.updateKm(id, dto, customer.id);
  }

  /**
   * DELETE /portal/vehicles/:id
   * Xóa xe (không có phiếu sửa đang active).
   */
  @Delete('vehicles/:id')
  @HttpCode(HttpStatus.OK)
  deleteVehicle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.deleteVehicle(id, customer.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /portal/appointments
   * Tất cả lịch hẹn của customer (kèm thông tin xe).
   */
  @Get('appointments')
  getMyAppointments(@CurrentUser() customer: any) {
    return this.portalService.getMyAppointments(customer.id);
  }

  /**
   * PATCH /portal/appointments/:id/cancel
   * Hủy lịch hẹn — chỉ khi status = PENDING.
   */
  @Patch('appointments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.cancelAppointment(id, customer.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPAIR ORDERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /portal/repair-orders
   * Lịch sử phiếu sửa chữa (summary).
   */
  @Get('repair-orders')
  getMyRepairOrders(@CurrentUser() customer: any) {
    return this.portalService.getMyRepairOrders(customer.id);
  }

  /**
   * GET /portal/repair-orders/:id
   * Chi tiết đầy đủ một phiếu (dịch vụ + phụ tùng + KTV + voucher).
   */
  @Get('repair-orders/:id')
  getRepairOrderDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.getRepairOrderDetail(id, customer.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REVIEWS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /portal/reviews
   * Gửi đánh giá cho dịch vụ.
   * Body: { repairOrderId, rating (1-5), comment? }
   *
   * Điều kiện:
   *  - Phiếu thuộc customer này
   *  - Phiếu đã thanh toán (status = PAID)
   *  - Customer chưa đánh giá trước đó
   */
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(
    @Body() dto: CreatePortalReviewDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.createReview(dto, customer.id);
  }
}
