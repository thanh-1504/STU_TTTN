import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepairOrderRepository } from './repair-order.repository';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { PayDto } from './dto/pay.dto';
import { RepairOrderStatus } from 'generated/prisma/enums';

@Injectable()
export class RepairOrderService {
  constructor(private repo: RepairOrderRepository) {}

  // 🔹 Tổng hợp chi phí
  async getSummary(orderId: number) {
    const order = await this.repo.findOrderWithDetails(orderId);
    if (!order) throw new NotFoundException('Repair order not found');

    const serviceTotal = order.services.reduce(
      (sum, s) => sum + Number(s.appliedPrice),
      0,
    );

    const partTotal = order.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0,
    );

    let total = serviceTotal + partTotal;
    let discount = 0;

    if (order.voucher) {
      if (order.voucher.discountPercent)
        discount = (total * order.voucher.discountPercent) / 100;
      else discount = Number(order.voucher.discountAmount);

      total -= discount;
    }

    return {
      serviceTotal,
      partTotal,
      discount,
      finalTotal: total,
      paidAmount: Number(order.paidAmount),
    };
  }

  // 🔹 Áp dụng voucher
  async applyVoucher(orderId: number, dto: ApplyVoucherDto) {
    const voucher = await this.repo.findVoucherByCode(dto.code);
    if (!voucher) throw new BadRequestException('Voucher không tồn tại');

    return this.repo.updateVoucher(orderId, voucher.id);
  }

  // 🔹 Sinh QR chuyển khoản
  async createQR(orderId: number) {
    const summary = await this.getSummary(orderId);

    return {
      qrUrl: `https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${summary.finalTotal}&addInfo=REPAIR_${orderId}`,
    };
  }

  // 🔥 THANH TOÁN
  async pay(orderId: number, dto: PayDto) {
    const order = await this.repo.findOrderWithDetails(orderId);
    if (!order) throw new NotFoundException();

    const summary = await this.getSummary(orderId);

    const newPaidAmount = Number(order.paidAmount) + dto.amount;

    const newStatus =
      newPaidAmount >= summary.finalTotal
        ? RepairOrderStatus.PAID
        : RepairOrderStatus.COMPLETED;

    return this.repo.updatePayment(orderId, {
      paidAmount: newPaidAmount,
      paymentMethod: dto.method,
      paidAt: new Date(),
      status: newStatus,
    });
  }
}