import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { RoleName, VehicleType, VoucherStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/shared/services/prisma.service';

const prisma = new PrismaService();

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
    {
      serviceName: 'Thay nhớt máy',
      description: 'Thay nhớt máy định kỳ, vệ sinh lọc nhớt',
      durationMinutes: 30,
      priceManual: 80000,
      priceScooter: 90000,
      priceMoto: 150000,
    },
    {
      serviceName: 'Vệ sinh bugi',
      description: 'Vệ sinh hoặc thay bugi mới',
      durationMinutes: 20,
      priceManual: 50000,
      priceScooter: 60000,
      priceMoto: 100000,
    },
    {
      serviceName: 'Vệ sinh nồi tay ga',
      description: 'Tháo vệ sinh bộ truyền động CVT tay ga',
      durationMinutes: 90,
      priceManual: 0,
      priceScooter: 250000,
      priceMoto: 0,
    },
    {
      serviceName: 'Thay dầu phanh',
      description: 'Thay dầu phanh đĩa, xả khí phanh',
      durationMinutes: 45,
      priceManual: 80000,
      priceScooter: 80000,
      priceMoto: 120000,
    },
    {
      serviceName: 'Căn chỉnh xích – sên',
      description: 'Kiểm tra và căn chỉnh độ căng sên xe số',
      durationMinutes: 30,
      priceManual: 60000,
      priceScooter: 0,
      priceMoto: 80000,
    },
    {
      serviceName: 'Thay lốp xe',
      description: 'Thay lốp trước hoặc sau, cân bằng lốp',
      durationMinutes: 60,
      priceManual: 150000,
      priceScooter: 150000,
      priceMoto: 250000,
    },
    {
      serviceName: 'Kiểm tra tổng quát',
      description: 'Kiểm tra toàn diện: điện, phanh, động cơ, lốp',
      durationMinutes: 60,
      priceManual: 100000,
      priceScooter: 120000,
      priceMoto: 150000,
    },
    {
      serviceName: 'Rửa xe',
      description: 'Rửa xe bằng máy xịt áp lực, lau khô',
      durationMinutes: 20,
      priceManual: 30000,
      priceScooter: 35000,
      priceMoto: 50000,
    },
    {
      serviceName: 'Vệ sinh bộ chế hòa khí',
      description: 'Tháo, ngâm, vệ sinh bộ chế hòa khí',
      durationMinutes: 60,
      priceManual: 150000,
      priceScooter: 180000,
      priceMoto: 200000,
    },
    {
      serviceName: 'Thay má phanh',
      description: 'Thay má phanh trước hoặc sau',
      durationMinutes: 30,
      priceManual: 70000,
      priceScooter: 70000,
      priceMoto: 100000,
    },
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
    create: {
      comboName: 'Combo Bảo Dưỡng Cơ Bản',
      description: 'Thay nhớt + Vệ sinh bugi + Rửa xe – tiết kiệm 15%',
      discountPct: 15,
      isActive: true,
    },
  });
  const combo2 = await prisma.combo.upsert({
    where: { id: 2 },
    update: {},
    create: {
      comboName: 'Combo Tay Ga Toàn Diện',
      description:
        'Vệ sinh nồi + Thay nhớt + Kiểm tra tổng quát – tiết kiệm 20%',
      discountPct: 20,
      isActive: true,
    },
  });

  const svcMap = Object.fromEntries(
    createdServices.map((s) => [s.serviceName, s.id]),
  );

  // Combo 1: thay nhớt + vệ sinh bugi + rửa xe
  for (const name of ['Thay nhớt máy', 'Vệ sinh bugi', 'Rửa xe']) {
    if (svcMap[name]) {
      await prisma.comboService.upsert({
        where: {
          comboId_serviceId: { comboId: combo1.id, serviceId: svcMap[name] },
        },
        update: {},
        create: { comboId: combo1.id, serviceId: svcMap[name] },
      });
    }
  }
  // Combo 2: vệ sinh nồi + thay nhớt + kiểm tra tổng quát
  for (const name of [
    'Vệ sinh nồi tay ga',
    'Thay nhớt máy',
    'Kiểm tra tổng quát',
  ]) {
    if (svcMap[name]) {
      await prisma.comboService.upsert({
        where: {
          comboId_serviceId: { comboId: combo2.id, serviceId: svcMap[name] },
        },
        update: {},
        create: { comboId: combo2.id, serviceId: svcMap[name] },
      });
    }
  }
  console.log('  ✅ 2 combo dịch vụ\n');

  // ── 5. SPARE PARTS ──────────────────────────────────────────────────────────
  console.log('🔩 Tạo phụ tùng...');
  const sparePartsData = [
    {
      partNumber: 'OIL-10W40-1L',
      partName: 'Nhớt Motul 3000 10W40 1L',
      unit: 'lít',
      stockQuantity: 50,
      minStockLevel: 10,
      sellingPrice: 85000,
    },
    {
      partNumber: 'OIL-LM-1L',
      partName: 'Nhớt Liqui Moly 10W40 1L',
      unit: 'lít',
      stockQuantity: 40,
      minStockLevel: 10,
      sellingPrice: 95000,
    },
    {
      partNumber: 'SPARK-NGK-CR8E',
      partName: 'Bugi NGK CR8E',
      unit: 'cái',
      stockQuantity: 30,
      minStockLevel: 5,
      sellingPrice: 45000,
    },
    {
      partNumber: 'SPARK-DENSO-IU27',
      partName: 'Bugi Denso IU27 Iridium',
      unit: 'cái',
      stockQuantity: 20,
      minStockLevel: 5,
      sellingPrice: 120000,
    },
    {
      partNumber: 'BRAKE-SHOE-WAVE',
      partName: 'Má phanh sau Wave Alpha',
      unit: 'bộ',
      stockQuantity: 15,
      minStockLevel: 5,
      sellingPrice: 55000,
    },
    {
      partNumber: 'BRAKE-PAD-DISC',
      partName: 'Má phanh đĩa Brembo SC',
      unit: 'bộ',
      stockQuantity: 4,
      minStockLevel: 5,
      sellingPrice: 180000,
    },
    {
      partNumber: 'TYRE-MICHELIN-275',
      partName: 'Lốp Michelin Pilot Street 2.75-17',
      unit: 'cái',
      stockQuantity: 10,
      minStockLevel: 3,
      sellingPrice: 320000,
    },
    {
      partNumber: 'TYRE-IRC-300',
      partName: 'Lốp IRC NR-77 3.00-10',
      unit: 'cái',
      stockQuantity: 8,
      minStockLevel: 3,
      sellingPrice: 280000,
    },
    {
      partNumber: 'FILTER-OIL-WAVE',
      partName: 'Lọc nhớt Wave RSX',
      unit: 'cái',
      stockQuantity: 25,
      minStockLevel: 8,
      sellingPrice: 35000,
    },
    {
      partNumber: 'FILTER-AIR-AIRBLADE',
      partName: 'Lọc gió Air Blade 2020-2023',
      unit: 'cái',
      stockQuantity: 15,
      minStockLevel: 5,
      sellingPrice: 65000,
    },
    {
      partNumber: 'CHAIN-DID-420',
      partName: 'Sên DID 420 Standard 106 mắt',
      unit: 'bộ',
      stockQuantity: 10,
      minStockLevel: 3,
      sellingPrice: 150000,
    },
    {
      partNumber: 'BRAKE-FLUID-DOT4',
      partName: 'Dầu phanh Castrol DOT4 500ml',
      unit: 'chai',
      stockQuantity: 12,
      minStockLevel: 4,
      sellingPrice: 75000,
    },
    {
      partNumber: 'BELT-CVT-HONDA',
      partName: 'Dây curoa Honda Vision chính hãng',
      unit: 'cái',
      stockQuantity: 2,
      minStockLevel: 3,
      sellingPrice: 380000,
    },
    {
      partNumber: 'ROLLER-CVT-VISION',
      partName: 'Bi nhông Vision 13g (bộ 6 cái)',
      unit: 'bộ',
      stockQuantity: 3,
      minStockLevel: 3,
      sellingPrice: 90000,
    },
    {
      partNumber: 'BATTERY-GS-9L',
      partName: 'Ắc quy GS 12V 9Ah',
      unit: 'cái',
      stockQuantity: 5,
      minStockLevel: 2,
      sellingPrice: 450000,
    },
  ];

  for (const part of sparePartsData) {
    await prisma.sparePart.upsert({
      where: { partNumber: part.partNumber },
      update: {},
      create: part,
    });
  }
  console.log(`  ✅ ${sparePartsData.length} phụ tùng\n`);

  // ── 6. VOUCHERS ─────────────────────────────────────────────────────────────
  console.log('🎫 Tạo voucher...');
  const now = new Date();
  const vouchersData = [
    {
      voucherCode: 'WELCOME50K',
      description: 'Giảm 50.000đ cho khách hàng mới',
      discountAmount: 50000,
      minOrderValue: 200000,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0),
      status: VoucherStatus.ACTIVE,
    },
    {
      voucherCode: 'SUMMER10',
      description: 'Giảm 10% tối đa 100.000đ dịp hè',
      discountPercent: 10,
      maxDiscount: 100000,
      minOrderValue: 300000,
      startDate: new Date(now.getFullYear(), 5, 1),
      endDate: new Date(now.getFullYear(), 7, 31),
      status: VoucherStatus.ACTIVE,
    },
    {
      voucherCode: 'BDAY100K',
      description: 'Voucher sinh nhật – giảm 100.000đ',
      discountAmount: 100000,
      minOrderValue: 500000,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear() + 1, now.getMonth(), 0),
      status: VoucherStatus.ACTIVE,
    },
  ];

  for (const v of vouchersData) {
    await prisma.voucher.upsert({
      where: { voucherCode: v.voucherCode },
      update: {},
      create: v as any,
    });
  }
  console.log(`  ✅ ${vouchersData.length} voucher\n`);

  // ── 7. BLOG CATEGORIES ──────────────────────────────────────────────────────
  console.log('📰 Tạo danh mục blog...');
  const blogCats = [
    'Mẹo chăm sóc xe',
    'Tin tức xe máy',
    'Hướng dẫn sửa chữa',
    'Khuyến mãi & Ưu đãi',
  ];
  for (const name of blogCats) {
    await prisma.blogCategory.upsert({
      where: { categoryName: name },
      update: {},
      create: { categoryName: name },
    });
  }
  console.log(`  ✅ ${blogCats.length} danh mục blog\n`);

  // ── 8. SYSTEM CONFIG ────────────────────────────────────────────────────────
  console.log('⚙️  Tạo cấu hình hệ thống...');
  const configs = [
    {
      configKey: 'shop_name',
      configValue: 'Shop2Bánh',
      description: 'Tên cửa hàng',
    },
    {
      configKey: 'shop_phone',
      configValue: '0901234567',
      description: 'Số điện thoại cửa hàng',
    },
    {
      configKey: 'shop_address',
      configValue: '123 Đường Láng, Đống Đa, Hà Nội',
      description: 'Địa chỉ cửa hàng',
    },
    {
      configKey: 'shop_email',
      configValue: 'contact@shop2banh.vn',
      description: 'Email cửa hàng',
    },
    {
      configKey: 'working_hours',
      configValue: '07:30 - 18:00',
      description: 'Giờ làm việc',
    },
    {
      configKey: 'oil_change_km_interval',
      configValue: '2000',
      description: 'Km định kỳ thay nhớt',
    },
    {
      configKey: 'maintenance_km_interval',
      configValue: '5000',
      description: 'Km định kỳ bảo dưỡng tổng quát',
    },
    {
      configKey: 'appointment_slot_minutes',
      configValue: '30',
      description: 'Thời lượng mỗi slot đặt lịch (phút)',
    },
    {
      configKey: 'max_appointments_per_slot',
      configValue: '3',
      description: 'Số lịch hẹn tối đa mỗi slot',
    },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: cfg.configKey },
      update: {},
      create: cfg,
    });
  }
  console.log(`  ✅ ${configs.length} cấu hình\n`);

  // ── 9. SAMPLE CUSTOMERS & VEHICLES ─────────────────────────────────────────
  console.log('🏍️  Tạo khách hàng mẫu...');
  const customer1 = await prisma.customer.upsert({
    where: { phone: '0912345678' },
    update: {},
    create: {
      phone: '0912345678',
      customerName: 'Nguyễn Văn An',
      address: '45 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    },
  });
  const customer2 = await prisma.customer.upsert({
    where: { phone: '0987654321' },
    update: {},
    create: {
      phone: '0987654321',
      customerName: 'Trần Thị Bình',
      address: '12 Hoàng Mai, Hà Nội',
    },
  });

  await prisma.vehicle.upsert({
    where: { licensePlate: '30A-12345' },
    update: {},
    create: {
      licensePlate: '30A-12345',
      brand: 'Honda',
      vehicleType: VehicleType.SCOOTER,
      model: 'Air Blade 150',
      currentKm: 12500,
      customerId: customer1.id,
    },
  });
  await prisma.vehicle.upsert({
    where: { licensePlate: '29B-67890' },
    update: {},
    create: {
      licensePlate: '29B-67890',
      brand: 'Yamaha',
      vehicleType: VehicleType.MANUAL,
      model: 'Exciter 150',
      currentKm: 8200,
      customerId: customer2.id,
    },
  });
  console.log('  ✅ 2 khách hàng mẫu + 2 xe\n');

  // ── 10. SUMMARY ─────────────────────────────────────────────────────────────
  console.log('━'.repeat(50));
  console.log('✅ Seed hoàn tất!\n');
  console.log('📋 Tài khoản đăng nhập:');
  console.log('  ADMIN       : admin / Admin@123');
  console.log('  LỄ TÂN      : letan01 / Letan@123');
  console.log('  KỸ THUẬT 1  : ktv01 / Ktv@123456');
  console.log('  KỸ THUẬT 2  : ktv02 / Ktv@123456');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
