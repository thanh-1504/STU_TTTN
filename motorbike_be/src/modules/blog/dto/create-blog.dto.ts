import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(5).max(500).describe('Tiêu đề bài viết'),
  slug: z.string().max(500).describe('Slug URL'),
  content: z.string().min(10).describe('Nội dung bài viết'),
  thumbnailUrl: z.string().url().max(500).optional().describe('URL thumbnail'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  publishedAt: z.coerce.date().optional().describe('Ngày đăng'),
  categoryId: z.number().int().positive().optional().describe('ID danh mục'),
});

export class CreateBlogPostDto extends createZodDto(CreateBlogPostSchema) {}

export const CreateBlogCategorySchema = z.object({
  categoryName: z.string().min(2).max(100).describe('Tên danh mục blog'),
});

export class CreateBlogCategoryDto extends createZodDto(CreateBlogCategorySchema) {}
