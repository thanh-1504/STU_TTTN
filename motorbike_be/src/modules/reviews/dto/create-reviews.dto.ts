import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).describe('Số sao đánh giá (1-5)'),
  comment: z.string().optional().describe('Nội dung đánh giá'),
  customerId: z.number().int().positive().describe('ID khách hàng'),
});

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}
