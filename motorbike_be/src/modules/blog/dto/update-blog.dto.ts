import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateBlogPostSchema, CreateBlogCategorySchema } from './create-blog.dto';

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();
export class UpdateBlogPostDto extends createZodDto(UpdateBlogPostSchema) {}

export const UpdateBlogCategorySchema = CreateBlogCategorySchema.partial();
export class UpdateBlogCategoryDto extends createZodDto(UpdateBlogCategorySchema) {}
