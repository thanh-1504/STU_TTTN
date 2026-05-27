import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerPortalService } from './customer-portal.service';
import {
  PortalCreateVehicleDto,
  UpdateKmDto,
  CreatePortalReviewDto,
} from './dto/portal.dto';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { imageUploadInterceptorOptions } from '../../shared/upload/image-upload.util';

/**
 * CustomerPortalController â€” táº¥t cáº£ route yÃªu cáº§u Customer JWT.
 * customerId luÃ´n láº¥y tá»« @CurrentUser(), khÃ´ng truyá»n qua body.
 */
@Controller('portal')
@UseGuards(CustomerJwtAuthGuard)
export class CustomerPortalController {
  constructor(
    private readonly portalService: CustomerPortalService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('vehicles')
  getMyVehicles(@CurrentUser() customer: any) {
    return this.portalService.getMyVehicles(customer.id);
  }

  @Post('vehicles/upload-image')
  @UseInterceptors(FileInterceptor('image', imageUploadInterceptorOptions))
  uploadVehicleImage(
    @UploadedFile() file: any,
    @CurrentUser() customer: any,
  ) {
    if (!file) {
      throw new BadRequestException('Vui long chon file anh can upload');
    }

    return this.cloudinaryService.uploadImage(
      file,
      `shop2banh/vehicles/customer-${customer.id}`,
      'vehicle-image',
    );
  }

  @Post('vehicles')
  @HttpCode(HttpStatus.CREATED)
  addVehicle(
    @Body() dto: PortalCreateVehicleDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.addVehicle(dto, customer.id);
  }

  @Patch('vehicles/:id/km')
  updateKm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKmDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.updateKm(id, dto, customer.id);
  }

  @Delete('vehicles/:id')
  @HttpCode(HttpStatus.OK)
  deleteVehicle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.deleteVehicle(id, customer.id);
  }

  @Get('appointments')
  getMyAppointments(@CurrentUser() customer: any) {
    return this.portalService.getMyAppointments(customer.id);
  }

  @Patch('appointments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.cancelAppointment(id, customer.id);
  }

  @Get('repair-orders')
  getMyRepairOrders(@CurrentUser() customer: any) {
    return this.portalService.getMyRepairOrders(customer.id);
  }

  @Get('repair-orders/:id')
  getRepairOrderDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.getRepairOrderDetail(id, customer.id);
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(
    @Body() dto: CreatePortalReviewDto,
    @CurrentUser() customer: any,
  ) {
    return this.portalService.createReview(dto, customer.id);
  }
}
