import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { parseDateRange } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepo: ReportsRepository) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REVENUE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/reports/revenue
   * Trả về:
   *  - totalAmount: tổng doanh thu
   *  - totalOrders: tổng phiếu PAID
   *  - byDate: [{date: 'YYYY-MM-DD', amount: number}]
   */
  async getRevenue(fromStr?: string, toStr?: string) {
    const { from, to } = parseDateRange(fromStr, toStr);

    const [totals, byDate] = await Promise.all([
      this.reportsRepo.getRevenueTotal(from, to),
      this.reportsRepo.getRevenueByDateRange(from, to),
    ]);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      totalAmount: Number(totals.totalAmount),
      totalOrders: totals.totalOrders,
      byDate: byDate.map((r) => ({
        date: r.date,
        amount: Number(r.amount),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/reports/services
   * Trả về danh sách dịch vụ được sử dụng nhiều nhất.
   */
  async getTopServices(fromStr?: string, toStr?: string, limit = 10) {
    const { from, to } = parseDateRange(fromStr, toStr);
    const rows = await this.reportsRepo.getTopServices(from, to, limit);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      data: rows.map((r) => ({
        serviceName: r.serviceName,
        count: Number(r.count),
        totalAmount: Number(r.totalAmount),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/reports/inventory
   * Không cần date range — snapshot hiện tại.
   * Trả về tổng giá trị kho + danh sách phụ tùng dưới ngưỡng cảnh báo.
   */
  async getInventory() {
    const { totalValue, belowMinStock } =
      await this.reportsRepo.getInventoryValue();

    return {
      totalValue: Number(totalValue),
      belowMinStockCount: belowMinStock.length,
      belowMinStock: belowMinStock.map((p) => ({
        id: p.id,
        partNumber: p.partNumber,
        partName: p.partName,
        unit: p.unit,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        sellingPrice: Number(p.sellingPrice),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/reports/customers
   * Thống kê KH mới, KH quay lại, giá trị đơn trung bình.
   */
  async getCustomerStats(fromStr?: string, toStr?: string) {
    const { from, to } = parseDateRange(fromStr, toStr);
    const stats = await this.reportsRepo.getCustomerStats(from, to);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      newCustomers: stats.newCustomers,
      returningCustomers: Number(stats.returningCustomers),
      avgOrderValue: Number(stats.avgOrderValue ?? 0),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD (giữ lại)
  // ─────────────────────────────────────────────────────────────────────────────

  async getDashboard() {
    return this.reportsRepo.getDashboardStats();
  }

  async getTopCustomers(limit = 10) {
    return this.reportsRepo.getTopCustomers(limit);
  }
}
