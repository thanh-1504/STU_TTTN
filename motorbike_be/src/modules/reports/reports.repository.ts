import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { RepairOrderStatus, SparePart } from 'generated/prisma/client';

/**
 * ReportsRepository — chỉ chứa Prisma queries, không có business logic.
 * Mọi thứ trả về raw data, Service sẽ format lại.
 */
@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REVENUE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tổng doanh thu + số phiếu trong khoảng thời gian.
   * Chỉ tính RepairOrder status = PAID.
   */
  async getRevenueTotal(
    from: Date,
    to: Date,
  ): Promise<{ totalAmount: any; totalOrders: number }> {
    const result = await this.prisma.repairOrder.aggregate({
      _sum: { paidAmount: true },
      _count: { id: true },
      where: {
        status: RepairOrderStatus.PAID,
        paidAt: { gte: from, lte: to },
      },
    });

    return {
      totalAmount: result._sum.paidAmount ?? 0,
      totalOrders: result._count.id,
    };
  }

  /**
   * Doanh thu group by ngày — dùng $queryRaw vì Prisma không support groupBy trên Date.
   * Trả về mảng { date: string (YYYY-MM-DD), amount: number }.
   */
  async getRevenueByDateRange(
    from: Date,
    to: Date,
  ): Promise<{ date: string; amount: any }[]> {
    const rows = await this.prisma.$queryRaw<
      { date: Date; amount: any }[]
    >`
      SELECT
        DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS date,
        SUM(paid_amount)                               AS amount
      FROM repair_orders
      WHERE status = 'PAID'
        AND paid_at >= ${from}
        AND paid_at <= ${to}
      GROUP BY DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY date ASC
    `;

    // Chuyển Date object → string YYYY-MM-DD
    return rows.map((r) => ({
      date:
        r.date instanceof Date
          ? r.date.toISOString().split('T')[0]
          : String(r.date),
      amount: r.amount,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Top dịch vụ được dùng nhiều nhất trong khoảng thời gian.
   * Join RepairOrderService → RepairOrder (filter PAID + paidAt) → Service.
   */
  async getTopServices(
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<{ serviceName: string; count: number; totalAmount: any }[]> {
    return this.prisma.$queryRaw<
      { serviceName: string; count: number; totalAmount: any }[]
    >`
      SELECT
        s.service_name  AS "serviceName",
        COUNT(ros.id)::int AS count,
        SUM(ros.applied_price)  AS "totalAmount"
      FROM repair_order_services ros
      JOIN repair_orders ro  ON ro.id  = ros.repair_order_id
      JOIN services s        ON s.id   = ros.service_id
      WHERE ro.status   = 'PAID'
        AND ro.paid_at >= ${from}
        AND ro.paid_at <= ${to}
      GROUP BY s.id, s.service_name
      ORDER BY count DESC, "totalAmount" DESC
      LIMIT ${limit}
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Giá trị tồn kho hiện tại + danh sách phụ tùng dưới ngưỡng cảnh báo.
   * totalValue = Σ(stockQuantity × sellingPrice) cho toàn bộ kho.
   */
  async getInventoryValue(): Promise<{
    totalValue: any;
    belowMinStock: SparePart[];
  }> {
    // Tính tổng giá trị kho bằng $queryRaw
    const [valueResult] = await this.prisma.$queryRaw<
      { totalValue: any }[]
    >`
      SELECT COALESCE(SUM(stock_quantity::numeric * selling_price), 0) AS "totalValue"
      FROM spare_parts
    `;

    // Lấy danh sách phụ tùng dưới ngưỡng (Prisma không support field comparison)
    const allParts = await this.prisma.sparePart.findMany({
      orderBy: { stockQuantity: 'asc' },
    });
    const belowMinStock = allParts.filter(
      (p) => p.stockQuantity <= p.minStockLevel,
    );

    return {
      totalValue: valueResult?.totalValue ?? 0,
      belowMinStock,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Thống kê khách hàng trong khoảng thời gian.
   * - newCustomers: số KH tạo trong khoảng đó
   * - returningCustomers: số KH có >= 2 phiếu PAID trong khoảng đó
   * - avgOrderValue: giá trị trung bình phiếu PAID
   */
  async getCustomerStats(
    from: Date,
    to: Date,
  ): Promise<{
    newCustomers: number;
    returningCustomers: number;
    avgOrderValue: any;
  }> {
    const [newCustomers, returningResult, avgResult] = await Promise.all([
      // Khách hàng mới: tạo tài khoản trong khoảng thời gian
      this.prisma.customer.count({
        where: { createdAt: { gte: from, lte: to } },
      }),

      // Khách hàng quay lại: có >= 2 phiếu PAID trong khoảng
      this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT customer_id)::int AS count
        FROM (
          SELECT customer_id
          FROM repair_orders
          WHERE status = 'PAID'
            AND paid_at >= ${from}
            AND paid_at <= ${to}
          GROUP BY customer_id
          HAVING COUNT(id) >= 2
        ) AS returning_customers
      `,

      // Giá trị trung bình phiếu PAID
      this.prisma.repairOrder.aggregate({
        _avg: { paidAmount: true },
        where: {
          status: RepairOrderStatus.PAID,
          paidAt: { gte: from, lte: to },
        },
      }),
    ]);

    return {
      newCustomers,
      returningCustomers: returningResult[0]?.count ?? 0,
      avgOrderValue: avgResult._avg.paidAmount ?? 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD (giữ lại từ bản cũ)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Thống kê tổng quan dashboard */
  async getDashboardStats() {
    const [customers, pendingAppointments, inProgressOrders, revenue] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.appointment.count({ where: { status: 'PENDING' } }),
        this.prisma.repairOrder.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.repairOrder.aggregate({
          _sum: { paidAmount: true },
          where: { paidAt: { not: null } },
        }),
      ]);

    return {
      totalCustomers: customers,
      pendingAppointments,
      inProgressOrders,
      totalRevenue: revenue._sum.paidAmount ?? 0,
    };
  }

  /** Top khách hàng chi tiêu nhiều nhất */
  async getTopCustomers(limit = 10) {
    return this.prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        customerName: true,
        phone: true,
        totalSpent: true,
        _count: { select: { repairOrders: true } },
      },
    });
  }
}
