import { PrismaService } from '../../shared/services/prisma.service';

/**
 * Tham số phân trang & lọc dùng chung cho findAll
 */
export interface FindAllParams {
  skip?: number;
  take?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * BaseRepository – lớp trừu tượng dùng chung cho toàn bộ Repository.
 * Mỗi Repository cụ thể phải kế thừa class này và truyền vào
 * tên model Prisma tương ứng (delegate).
 *
 * Quy tắc:
 *  - Repository CHỈ được inject PrismaService, không có business logic.
 *  - Service chỉ gọi Repository, không gọi PrismaService trực tiếp.
 *  - Controller chỉ gọi Service.
 */
export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaService,
    // tên delegate trong PrismaClient, vd: 'user', 'customer', ...
    private readonly modelName: string,
  ) {}

  // Lấy delegate model từ PrismaClient (dùng any để tránh lỗi TS phức tạp)
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Tìm một bản ghi theo ID (khoá chính số nguyên).
   */
  async findById(id: number): Promise<T | null> {
    return this.model.findUnique({ where: { id } }) as Promise<T | null>;
  }

  /**
   * Lấy danh sách bản ghi, hỗ trợ phân trang và lọc cơ bản.
   */
  async findAll(params: FindAllParams = {}): Promise<T[]> {
    const { skip, take, where, orderBy } = params;
    return this.model.findMany({ skip, take, where, orderBy }) as Promise<T[]>;
  }

  /**
   * Tạo mới một bản ghi.
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data }) as Promise<T>;
  }

  /**
   * Cập nhật bản ghi theo ID.
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    return this.model.update({ where: { id }, data }) as Promise<T>;
  }

  /**
   * Xoá bản ghi theo ID.
   */
  async delete(id: number): Promise<T> {
    return this.model.delete({ where: { id } }) as Promise<T>;
  }
}
