import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateBannerSchema = z.object({
  title: z.string().max(255).optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').max(500),
  linkUrl: z.string().url('URL liên kết không hợp lệ').max(500).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export class CreateBannerDto extends createZodDto(CreateBannerSchema) {}

export const UpdateBannerSchema = CreateBannerSchema.partial();
export class UpdateBannerDto extends createZodDto(UpdateBannerSchema) {}

export const UpdateSortOrderSchema = z.object({
  sortOrder: z.number().int().min(0, 'Thứ tự sắp xếp phải >= 0'),
});
export class UpdateSortOrderDto extends createZodDto(UpdateSortOrderSchema) {}
