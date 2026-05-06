import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateBannerSchema = z.object({
  title: z.string().max(255).optional().describe('Tiêu đề banner'),
  imageUrl: z.string().url().max(500).describe('URL hình ảnh banner'),
  linkUrl: z.string().url().max(500).optional().describe('URL liên kết khi click'),
  sortOrder: z.number().int().min(0).optional().default(0).describe('Thứ tự sắp xếp'),
  isActive: z.boolean().optional().default(true),
  startDate: z.coerce.date().optional().describe('Ngày bắt đầu hiển thị'),
  endDate: z.coerce.date().optional().describe('Ngày kết thúc hiển thị'),
});

export class CreateBannerDto extends createZodDto(CreateBannerSchema) {}
