import { BlogStatus } from 'generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBlogCategorySchema = z.object({
  categoryName: z
    .string()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),
});
export class CreateBlogCategoryDto extends createZodDto(CreateBlogCategorySchema) {}

export const CreateBlogPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(500, 'Tiêu đề tối đa 500 ký tự'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  thumbnailUrl: z.string().url('URL ảnh không hợp lệ').max(500).optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(BlogStatus).optional(),
});
export class CreateBlogPostDto extends createZodDto(CreateBlogPostSchema) {}

export const UpdateBlogPostSchema = CreateBlogPostSchema.omit({
  status: true,
}).partial();
export class UpdateBlogPostDto extends createZodDto(UpdateBlogPostSchema) {}
