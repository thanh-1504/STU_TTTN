import { Module } from '@nestjs/common';
import { ReviewsPublicController, ReviewsAdminController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';

@Module({
  controllers: [ReviewsPublicController, ReviewsAdminController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
