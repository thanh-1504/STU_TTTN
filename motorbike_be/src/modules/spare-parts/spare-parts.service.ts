import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { SparePartsRepository } from './spare-parts.repository';
import { ImportOrderRepository } from './import-order.repository';
import { CreateSparePartDto } from './dto/create-spare-parts.dto';
import { UpdateSparePartDto } from './dto/update-spare-parts.dto';
import { CreateImportOrderDto } from './dto/create-import-order.dto';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class SparePartsService {
  private readonly logger = new Logger(SparePartsService.name);

  constructor(
    private readonly sparePartsRepo: SparePartsRepository,
    private readonly importOrderRepo: ImportOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // SPARE PARTS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/spare-parts?search=&belowMinStock=true
   */
  async findAll(search?: string, belowMinStock?: boolean) {
    return this.sparePartsRepo.findAllParts({
      search,
      belowMinStock,
    });
  }

  /**
   * GET /admin/spare-parts/:id
   */
  async findOne(id: number) {
    return this.ensureExists(id);
  }

  /**
   * POST /admin/spare-parts
   * Validate partNumber unique trước khi tạo.
   */
  async create(dto: CreateSparePartDto) {
    const existing = await this.sparePartsRepo.findByPartNumber(dto.partNumber);
    if (existing) {
      throw new BadRequestException(
        `Mã phụ tùng "${dto.partNumber}" đã tồn tại trong hệ thống.`,
      );
    }
    return this.sparePartsRepo.createPart(dto);
  }

  /**
   * PATCH /admin/spare-parts/:id
   */
  async update(id: number, dto: UpdateSparePartDto) {
    await this.ensureExists(id);
    return this.sparePartsRepo.updatePart(id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // IMPORT ORDERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /admin/import-orders */
  async findAllImportOrders() {
    return this.importOrderRepo.findAll();
  }

  /** GET /admin/import-orders/:id */
  async findImportOrderById(id: number) {
    const order = await this.importOrderRepo.findById(id);
    if (!order) throw new NotFoundException(`Không tìm thấy phiếu nhập kho #${id}`);
    return order;
  }

  /**
   * POST /admin/import-orders
   *
   * Luồng transaction:
   *  1. Validate tất cả sparePartId tồn tại
   *  2. Tính totalAmount = Σ(quantity * importPrice)
   *  3. $transaction:
   *     a. Tạo ImportOrder (với totalAmount)
   *     b. Tạo ImportItems
   *     c. incrementStock cho từng phụ tùng
   *  4. Sau transaction: kiểm tra tồn kho <= minStockLevel → tạo STOCK_ALERT notification
   */
  async createImportOrder(dto: CreateImportOrderDto, adminId: number) {
    // ── STEP 1: Validate tất cả sparePartId ───────────────────────────────────
    const partIds = [...new Set(dto.items.map((i) => i.sparePartId))];
    const partsMap = new Map<number, any>();

    for (const id of partIds) {
      const part = await this.sparePartsRepo.findPartById(id);
      if (!part) {
        throw new BadRequestException(`Phụ tùng #${id} không tồn tại.`);
      }
      partsMap.set(id, part);
    }

    // ── STEP 2: Tính totalAmount ──────────────────────────────────────────────
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.importPrice,
      0,
    );

    // ── STEP 3: Transaction ───────────────────────────────────────────────────
    const importOrder = await this.prisma.$transaction(async (tx) => {
      // 3a + 3b: Tạo ImportOrder + Items
      const order = await this.importOrderRepo.createWithItems(
        dto.notes,
        dto.items,
        adminId,
        totalAmount,
        tx,
      );

      // 3c: Tăng tồn kho cho từng phụ tùng
      for (const item of dto.items) {
        await this.sparePartsRepo.incrementStock(item.sparePartId, item.quantity, tx);
      }

      return order;
    });

    // ── STEP 4: Post-transaction — kiểm tra STOCK_ALERT ──────────────────────
    // Chạy ngoài transaction để không làm rollback nếu notification fail
    this.checkStockAlertsAfterImport(partIds).catch((err) => {
      this.logger.warn(`Tạo STOCK_ALERT thất bại: ${err.message}`);
    });

    return importOrder;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async ensureExists(id: number) {
    const part = await this.sparePartsRepo.findPartById(id);
    if (!part) throw new NotFoundException(`Không tìm thấy phụ tùng #${id}`);
    return part;
  }

  /**
   * Sau khi nhập kho, kiểm tra từng phụ tùng vừa cập nhật.
   * Nếu tồn kho vẫn <= minStockLevel → tạo Notification STOCK_ALERT.
   *
   * NOTE: Gọi bất đồng bộ (.catch) để không block response.
   */
  private async checkStockAlertsAfterImport(partIds: number[]): Promise<void> {
    for (const id of partIds) {
      const part = await this.sparePartsRepo.findPartById(id);
      if (!part) continue;

      if (part.stockQuantity <= part.minStockLevel) {
        await this.prisma.notification.create({
          data: {
            type: NotificationType.STOCK_ALERT,
            title: `Cảnh báo tồn kho thấp: ${part.partName}`,
            message:
              `Phụ tùng "${part.partName}" (${part.partNumber}) chỉ còn ` +
              `${part.stockQuantity} ${part.unit} (ngưỡng cảnh báo: ${part.minStockLevel} ${part.unit}).`,
          },
        });

        this.logger.warn(
          `STOCK_ALERT: ${part.partName} (${part.partNumber}) — ` +
            `còn ${part.stockQuantity}/${part.minStockLevel} ${part.unit}`,
        );
      }
    }
  }
}
