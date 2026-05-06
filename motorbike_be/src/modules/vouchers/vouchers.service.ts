import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VoucherStatus } from 'generated/prisma/client';
import { VouchersRepository } from './vouchers.repository';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(private readonly vouchersRepo: VouchersRepository) {}

  findAll(status?: string) {
    return this.vouchersRepo.findAll(status as VoucherStatus | undefined);
  }

  async findOne(id: number) {
    const voucher = await this.vouchersRepo.findById(id);
    if (!voucher) {
      throw new NotFoundException(`Khong tim thay voucher #${id}`);
    }
    return voucher;
  }

  async create(dto: CreateVoucherDto) {
    const existing = await this.vouchersRepo.findByCode(dto.voucherCode);
    if (existing) {
      throw new BadRequestException(
        `Ma voucher "${dto.voucherCode}" da ton tai.`,
      );
    }

    return this.vouchersRepo.create({
      ...dto,
      status: this.resolveVoucherStatus(dto.startDate, dto.endDate),
    });
  }

  async update(id: number, dto: UpdateVoucherDto) {
    const currentVoucher = await this.findOne(id);
    const nextStartDate = dto.startDate ?? currentVoucher.startDate;
    const nextEndDate = dto.endDate ?? currentVoucher.endDate;

    return this.vouchersRepo.update(id, {
      ...dto,
      status: this.resolveVoucherStatus(
        nextStartDate,
        nextEndDate,
        currentVoucher.status,
      ),
    });
  }

  async revoke(id: number) {
    const voucher = await this.findOne(id);
    if (voucher.status === VoucherStatus.REVOKED) {
      throw new BadRequestException('Voucher nay da bi huy truoc do.');
    }
    return this.vouchersRepo.revoke(id);
  }

  async validateAndApply(
    code: string,
    orderAmount: number,
  ): Promise<{ discountAmount: number; finalAmount: number }> {
    const voucher = await this.vouchersRepo.findByCode(code);

    if (!voucher) {
      throw new BadRequestException(`Ma voucher "${code}" khong ton tai.`);
    }
    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Ma voucher "${code}" da het han hoac bi huy (${voucher.status}).`,
      );
    }

    const now = new Date();
    if (now < voucher.startDate) {
      throw new BadRequestException(
        `Ma voucher "${code}" chua den ngay ap dung (tu ${voucher.startDate.toLocaleDateString('vi-VN')}).`,
      );
    }
    if (now > voucher.endDate) {
      throw new BadRequestException(
        `Ma voucher "${code}" da het han (den ${voucher.endDate.toLocaleDateString('vi-VN')}).`,
      );
    }

    const minOrderValue = Number(voucher.minOrderValue);
    if (orderAmount < minOrderValue) {
      throw new BadRequestException(
        `Don hang phai co gia tri toi thieu ${minOrderValue.toLocaleString('vi-VN')}d de dung voucher nay.`,
      );
    }

    let discount = 0;
    if (voucher.discountAmount) {
      discount = Number(voucher.discountAmount);
    } else if (voucher.discountPercent) {
      discount = (orderAmount * voucher.discountPercent) / 100;
      if (voucher.maxDiscount) {
        discount = Math.min(discount, Number(voucher.maxDiscount));
      }
    }

    discount = Math.min(discount, orderAmount);

    return {
      discountAmount: Math.round(discount),
      finalAmount: Math.round(orderAmount - discount),
    };
  }

  /** Trigger thủ công hoặc từ cron: quét và set EXPIRED. */
  async scanExpiredNow(): Promise<number> {
    const count = await this.vouchersRepo.revokeExpired();
    if (count > 0) {
      this.logger.log(`[scanExpiredNow] Đã set EXPIRED cho ${count} voucher quá hạn.`);
    }
    return count;
  }

  @Cron('0 0 * * *')
  async handleExpiredVouchers() {
    await this.scanExpiredNow();
  }

  private resolveVoucherStatus(
    startDate: Date,
    endDate: Date,
    currentStatus?: VoucherStatus,
  ): VoucherStatus {
    if (currentStatus === VoucherStatus.REVOKED) {
      return VoucherStatus.REVOKED;
    }

    const now = new Date();

    if (endDate < now) {
      return VoucherStatus.EXPIRED;
    }

    return VoucherStatus.ACTIVE;
  }
}
