import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg'; // Cần cài đặt: npm install pg
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Tạo một kết nối Pool cho PostgreSQL
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    
    // 2. Truyền adapter với pool đã khởi tạo
    const adapter = new PrismaPg(pool);
    
    // 3. Khởi tạo PrismaClient với adapter
    super({ adapter });
  }

  async onModuleInit() {
    // Kết nối tới database khi ứng dụng bắt đầu
    await this.$connect();
  }
}