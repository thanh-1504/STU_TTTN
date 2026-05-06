import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AdminReviewActionDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from 'generated/prisma/client';

@Controller('reviews')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}
  /** GET /reviews — Chỉ APPROVED, dùng trên trang chủ */
  @Get()
  findApproved() { return this.reviewsService.findApproved(); }
}

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class ReviewsAdminController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** GET /admin/reviews?status=PENDING|APPROVED|HIDDEN */
  @Get()
  findAll(@Query('status') status?: string) { return this.reviewsService.findAll(status); }

  /** GET /admin/reviews/stats — Phân bố theo sao */
  @Get('stats')
  stats() { return this.reviewsService.countByRating(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.reviewsService.findOne(id); }

  /** PATCH /admin/reviews/:id/approve */
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminReviewActionDto) {
    return this.reviewsService.approve(id, dto.adminReply);
  }

  /** PATCH /admin/reviews/:id/hide */
  @Patch(':id/hide')
  @HttpCode(HttpStatus.OK)
  hide(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminReviewActionDto) {
    return this.reviewsService.hide(id, dto.adminReply);
  }
}
