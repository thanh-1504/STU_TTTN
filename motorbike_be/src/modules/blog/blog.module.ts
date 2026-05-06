import { Module } from '@nestjs/common';
import { BlogPublicController, BlogCategoryAdminController, BlogPostAdminController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPostRepository } from './blog.repository';
import { BlogCategoryRepository } from './blog-category.repository';

@Module({
  controllers: [BlogPublicController, BlogCategoryAdminController, BlogPostAdminController],
  providers: [BlogService, BlogPostRepository, BlogCategoryRepository],
  exports: [BlogService],
})
export class BlogModule {}
