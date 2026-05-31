import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { RoleName } from '../generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...\n');

  // ── 1. ROLES ────────────────────────────────────────────────────────────────
  console.log('📋 Tạo roles...');
  const roleAdmin = await prisma.role.upsert({
    where: { roleName: RoleName.ADMIN },
    update: {},
    create: { roleName: RoleName.ADMIN },
  });
  const roleReceptionist = await prisma.role.upsert({
    where: { roleName: RoleName.RECEPTIONIST },
    update: {},
    create: { roleName: RoleName.RECEPTIONIST },
  });
  const roleTechnician = await prisma.role.upsert({
    where: { roleName: RoleName.TECHNICIAN },
    update: {},
    create: { roleName: RoleName.TECHNICIAN },
  });
  console.log('  ✅ Roles: ADMIN, RECEPTIONIST, TECHNICIAN\n');

  // ── 2. USERS (Staff) ────────────────────────────────────────────────────────
  console.log('👥 Tạo nhân viên...');
  const hashPw = (pw: string) => bcrypt.hash(pw, 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await hashPw('Admin@123'),
      fullname: 'Quản trị viên',
      phone: '0901000001',
      email: 'admin@shop2banh.vn',
      roleId: roleAdmin.id,
      isActive: true,
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { username: 'letan01' },
    update: {},
    create: {
      username: 'letan01',
      password: await hashPw('Letan@123'),
      fullname: 'Nguyễn Thị Lễ Tân',
      phone: '0901000002',
      email: 'letan01@shop2banh.vn',
      roleId: roleReceptionist.id,
      isActive: true,
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { username: 'ktv01' },
    update: {},
    create: {
      username: 'ktv01',
      password: await hashPw('Ktv@123456'),
      fullname: 'Trần Văn Kỹ Thuật',
      phone: '0901000003',
      email: 'ktv01@shop2banh.vn',
      roleId: roleTechnician.id,
      isActive: true,
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { username: 'ktv02' },
    update: {},
    create: {
      username: 'ktv02',
      password: await hashPw('Ktv@123456'),
      fullname: 'Lê Minh Tuấn',
      phone: '0901000004',
      email: 'ktv02@shop2banh.vn',
      roleId: roleTechnician.id,
      isActive: true,
    },
  });
  console.log('  ✅ 4 nhân viên (1 admin, 1 lễ tân, 2 KTV)\n');

  // ── 3. SERVICES ─────────────────────────────────────────────────────────────
  console.log('🔧 Tạo dịch vụ...');
  const servicesData = [
    { serviceName: 'Thay nhớt máy', description: 'Thay nhớt máy định kỳ', durationMinutes: 30, priceManual: 80000, priceScooter: 90000, priceMoto: 150000 },
    { serviceName: 'Vệ sinh bugi', description: 'Vệ sinh hoặc thay bugi', durationMinutes: 20, priceManual: 50000, priceScooter: 60000, priceMoto: 100000 },
    { serviceName: 'Vệ sinh nồi tay ga', description: 'Tháo vệ sinh bộ nồi', durationMinutes: 90, priceManual: 0, priceScooter: 250000, priceMoto: 0 },
    { serviceName: 'Kiểm tra tổng quát', description: 'Kiểm tra toàn diện', durationMinutes: 60, priceManual: 100000, priceScooter: 120000, priceMoto: 150000 },
    { serviceName: 'Rửa xe', description: 'Rửa xe sạch sẽ', durationMinutes: 20, priceManual: 30000, priceScooter: 35000, priceMoto: 50000 },
  ];

  const createdServices: { id: number; serviceName: string }[] = [];
  for (const svc of servicesData) {
    const s = await prisma.service.upsert({
      where: { serviceName: svc.serviceName },
      update: {},
      create: { ...svc, isActive: true },
    });
    createdServices.push(s);
  }
  console.log(`  ✅ ${createdServices.length} dịch vụ\n`);

  // ── 4. COMBOS ───────────────────────────────────────────────────────────────
  console.log('📦 Tạo combo dịch vụ...');
  const combo1 = await prisma.combo.upsert({
    where: { id: 1 },
    update: {},
    create: { comboName: 'Combo Bảo Dưỡng Cơ Bản', description: 'Tiết kiệm 15%', discountPct: 15, isActive: true },
  });
  
  const svcMap = Object.fromEntries(createdServices.map((s) => [s.serviceName, s.id]));
  for (const name of ['Thay nhớt máy', 'Vệ sinh bugi', 'Rửa xe']) {
    if (svcMap[name]) {
      await prisma.comboService.upsert({
        where: { comboId_serviceId: { comboId: combo1.id, serviceId: svcMap[name] } },
        update: {},
        create: { comboId: combo1.id, serviceId: svcMap[name] },
      });
    }
  }
  console.log('  ✅ 1 combo dịch vụ\n');

  // ── 5. SUMMARY ─────────────────────────────────────────────────────────────
  console.log('━'.repeat(50));
  console.log('✅ Seed hoàn tất!');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => { console.error('❌ Seed thất bại:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });