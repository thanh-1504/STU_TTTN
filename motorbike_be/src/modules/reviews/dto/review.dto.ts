import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AdminReviewActionSchema = z.object({
  adminReply: z.string().max(1000).optional(),
});
export class AdminReviewActionDto extends createZodDto(AdminReviewActionSchema) {}
