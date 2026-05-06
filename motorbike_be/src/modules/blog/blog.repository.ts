import { Injectable } from '@nestjs/common';
import { BlogPost, BlogStatus } from 'generated/prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

export interface BlogPostFilter {
  status?: BlogStatus;
  categoryId?: number;
}

export interface BlogPostPaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class BlogPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: BlogPostFilter): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      where: {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    return this.prisma.blogPost.findUnique({
      where: { slug },
      include: { category: true },
    });
  }

  async findPublishedPage({ page, limit }: BlogPostPaginationOptions) {
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({
        where: { status: BlogStatus.PUBLISHED },
      }),
    ]);

    return {
      items,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      page,
      limit,
    };
  }

  async findLatestPublished(limit: number): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      where: { status: BlogStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        thumbnailUrl: true,
        content: true,
        category: true,
        categoryId: true,
        updatedAt: true,
        publishedAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<BlogPost[]>;
  }

  async findById(id: number): Promise<BlogPost | null> {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post) return false;
    if (excludeId && post.id === excludeId) return false;
    return true;
  }

  async create(data: {
    title: string;
    slug: string;
    content: string;
    thumbnailUrl?: string;
    categoryId?: number;
    status?: BlogStatus;
  }): Promise<BlogPost> {
    const status = data.status || BlogStatus.DRAFT;

    return this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl,
        categoryId: data.categoryId,
        status,
        publishedAt: status === BlogStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async update(
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      content: string;
      thumbnailUrl: string | null;
      categoryId: number | null;
    }>,
  ): Promise<BlogPost> {
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async publish(id: number): Promise<BlogPost> {
    return this.prisma.blogPost.update({
      where: { id },
      data: { status: BlogStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async archive(id: number): Promise<BlogPost> {
    return this.prisma.blogPost.update({
      where: { id },
      data: { status: BlogStatus.ARCHIVED },
    });
  }
}
