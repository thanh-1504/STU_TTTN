import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Review, ReviewStatus } from 'generated/prisma/client';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: ReviewStatus): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: status ? { status } : undefined,
      include: { customer: { select: { customerName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApproved(): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.APPROVED },
      include: { customer: { select: { customerName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: { customer: true },
    });
  }

  async updateStatus(id: number, status: ReviewStatus, adminReply?: string): Promise<Review> {
    return this.prisma.review.update({
      where: { id },
      data: { status, ...(adminReply !== undefined && { adminReply }) },
    });
  }

  /** Thống kê số lượng đánh giá theo sao (1-5) */
  async countByRating(): Promise<{ rating: number; count: number }[]> {
    const rows = await this.prisma.review.groupBy({
      by: ['rating'],
      _count: { id: true },
      where: { status: ReviewStatus.APPROVED },
      orderBy: { rating: 'asc' },
    });
    return rows.map((r) => ({ rating: r.rating, count: r._count.id }));
  }

  async findByCustomerId(customerId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByCustomerId(customerId: number): Promise<boolean> {
    const count = await this.prisma.review.count({ where: { customerId } });
    return count > 0;
  }

  async createReview(data: { customerId: number; rating: number; comment?: string }): Promise<Review> {
    return this.prisma.review.create({
      data: { ...data, comment: data.comment ?? null, status: ReviewStatus.PENDING },
    });
  }

  async moderate(id: number, status: ReviewStatus, adminReply?: string): Promise<Review> {
    return this.prisma.review.update({
      where: { id },
      data: { status, adminReply },
    });
  }
}
