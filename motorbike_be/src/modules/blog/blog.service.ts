import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogStatus } from 'generated/prisma/client';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { BlogCategoryRepository } from './blog-category.repository';
import { CreateBlogCategoryDto, CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';
import { BlogPostRepository } from './blog.repository';

@Injectable()
export class BlogService {
  constructor(
    private readonly blogPostRepo: BlogPostRepository,
    private readonly blogCategoryRepo: BlogCategoryRepository,
  ) {}

  async findAllCategories() {
    return this.blogCategoryRepo.findAll();
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    return this.blogCategoryRepo.create(dto.categoryName);
  }

  async deleteCategory(id: number) {
    const category = await this.blogCategoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục #${id}`);
    }

    const postCount = await this.blogCategoryRepo.countPosts(id);
    if (postCount > 0) {
      throw new BadRequestException(
        `Danh mục này đang có ${postCount} bài viết. Không thể xóa.`,
      );
    }

    await this.blogCategoryRepo.delete(id);
    return { message: 'Xóa danh mục thành công.' };
  }

  async findPublished() {
    return this.blogPostRepo.findAll({ status: BlogStatus.PUBLISHED });
  }

  async findPublishedPage(page = 1, limit = 5) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 5;

    return this.blogPostRepo.findPublishedPage({
      page: safePage,
      limit: safeLimit,
    });
  }

  async findLatestPublished(limit = 5) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 10) : 5;
    return this.blogPostRepo.findLatestPublished(safeLimit);
  }

  async findBySlug(slug: string) {
    const post = await this.blogPostRepo.findBySlug(slug);
    if (!post || post.status !== BlogStatus.PUBLISHED) {
      throw new NotFoundException(`Không tìm thấy bài viết "${slug}"`);
    }

    return post;
  }

  async findAll(status?: string, categoryId?: number) {
    return this.blogPostRepo.findAll({
      status: status as BlogStatus | undefined,
      categoryId,
    });
  }

  async findOne(id: number) {
    const post = await this.blogPostRepo.findById(id);
    if (!post) {
      throw new NotFoundException(`Không tìm thấy bài viết #${id}`);
    }

    return post;
  }

  async create(dto: CreateBlogPostDto) {
    const baseSlug = slugify(dto.title);
    const slugExist = await this.blogPostRepo.slugExists(baseSlug);
    const finalSlug = slugExist ? slugifyUnique(dto.title) : baseSlug;

    const nextStatus =
      dto.status === BlogStatus.PUBLISHED ? BlogStatus.PUBLISHED : BlogStatus.DRAFT;

    return this.blogPostRepo.create({
      title: dto.title,
      slug: finalSlug,
      content: dto.content,
      thumbnailUrl: dto.thumbnailUrl,
      categoryId: dto.categoryId ?? undefined,
      status: nextStatus,
    });
  }

  async update(id: number, dto: UpdateBlogPostDto) {
    await this.findOne(id);

    let slug: string | undefined;
    if (dto.title) {
      const baseSlug = slugify(dto.title);
      const slugExist = await this.blogPostRepo.slugExists(baseSlug, id);
      slug = slugExist ? slugifyUnique(dto.title) : baseSlug;
    }

    return this.blogPostRepo.update(id, {
      ...(dto.title && { title: dto.title }),
      ...(slug && { slug }),
      ...(dto.content && { content: dto.content }),
      ...(dto.thumbnailUrl !== undefined && {
        thumbnailUrl: dto.thumbnailUrl ?? null,
      }),
      ...(dto.categoryId !== undefined && {
        categoryId: dto.categoryId ?? null,
      }),
    });
  }

  async publish(id: number) {
    await this.findOne(id);
    return this.blogPostRepo.publish(id);
  }

  async archive(id: number) {
    await this.findOne(id);
    return this.blogPostRepo.archive(id);
  }
}
