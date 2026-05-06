import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateReviewSchema } from './create-reviews.dto';

export const UpdateReviewSchema = CreateReviewSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']).optional(),
  adminReply: z.string().optional().describe('Phản hồi của admin'),
}).partial();

export class UpdateReviewDto extends createZodDto(UpdateReviewSchema) {}
