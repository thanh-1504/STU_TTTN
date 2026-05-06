import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { BlogCategory } from 'generated/prisma/client';

@Injectable()
export class BlogCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy tất cả danh mục kèm số bài viết */
  async findAll(): Promise<any[]> {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { categoryName: 'asc' },
    });
  }

  async findById(id: number): Promise<BlogCategory | null> {
    return this.prisma.blogCategory.findUnique({ where: { id } });
  }

  async create(categoryName: string): Promise<BlogCategory> {
    return this.prisma.blogCategory.create({ data: { categoryName } });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.blogCategory.delete({ where: { id } });
  }

  /** Đếm số bài viết trong danh mục (để guard trước khi xóa) */
  async countPosts(categoryId: number): Promise<number> {
    return this.prisma.blogPost.count({ where: { categoryId } });
  }
}
