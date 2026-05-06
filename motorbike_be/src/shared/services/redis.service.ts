import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * RedisService — singleton kết nối Redis dùng ioredis.
 * Được export từ SharedModule (@Global) để các module khác inject.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private mockStore = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const options: RedisOptions = {
      host: this.configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: Number(this.configService.get<string>('REDIS_PORT') ?? 6379),
      db: Number(this.configService.get<string>('REDIS_DB') ?? 0),
      lazyConnect: true,
      enableOfflineQueue: false, // Ngăn chặn treo ứng dụng (timeout) khi Redis không chạy
      maxRetriesPerRequest: 1, // Dừng thử lại nếu không kết nối được
    };

    const password = this.configService.get<string>('REDIS_PASSWORD');
    if (password) options.password = password;

    this.client = new Redis(options);

    this.client.on('error', (err: Error) => {
      // Bỏ qua log lỗi liên tục nếu không dùng Redis
    });

    this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis not available. Using local Mock Store for OTP: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  /** Lưu key-value với TTL (giây) */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch {
      // Fallback khi Redis không khả dụng
      this.mockStore.set(key, value);
      this.logger.warn(`[MOCK REDIS] SET ${key} = ${value} (TTL: ${ttlSeconds}s)`);
      
      // Xóa sau khi hết TTL
      setTimeout(() => {
        if (this.mockStore.get(key) === value) {
          this.mockStore.delete(key);
        }
      }, ttlSeconds * 1000);
    }
  }

  /** Lấy giá trị theo key */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      const value = this.mockStore.get(key) || null;
      this.logger.warn(`[MOCK REDIS] GET ${key} = ${value}`);
      return value;
    }
  }

  /** Xoá key */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      this.mockStore.delete(key);
      this.logger.warn(`[MOCK REDIS] DEL ${key}`);
    }
  }

  /** Kiểm tra key có tồn tại không */
  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch {
      return this.mockStore.has(key);
    }
  }
}
