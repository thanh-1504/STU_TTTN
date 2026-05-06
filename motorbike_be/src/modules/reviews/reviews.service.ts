import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus } from 'generated/prisma/client';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepo: ReviewsRepository) {}

  findApproved() { return this.reviewsRepo.findApproved(); }

  findAll(status?: string) {
    return this.reviewsRepo.findAll(status as ReviewStatus | undefined);
  }

  async findOne(id: number) {
    const r = await this.reviewsRepo.findById(id);
    if (!r) throw new NotFoundException(`Không tìm thấy đánh giá #${id}`);
    return r;
  }

  countByRating() { return this.reviewsRepo.countByRating(); }

  async approve(id: number, adminReply?: string) {
    await this.findOne(id);
    return this.reviewsRepo.updateStatus(id, ReviewStatus.APPROVED, adminReply);
  }

  async hide(id: number, adminReply?: string) {
    await this.findOne(id);
    return this.reviewsRepo.updateStatus(id, ReviewStatus.HIDDEN, adminReply);
  }
}
