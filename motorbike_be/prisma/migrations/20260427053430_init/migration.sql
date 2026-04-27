-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'RECEPTIONIST', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MANUAL', 'SCOOTER', 'BIG');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RepairOrderStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'QR_CODE');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_CONFIRM', 'APPOINTMENT_REMINDER', 'REPAIR_COMPLETED', 'MAINTENANCE_DUE', 'OIL_CHANGE_DUE', 'STOCK_ALERT', 'PRICE_APPROVAL');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" "RoleName" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "total_spent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "model" VARCHAR(100),
    "current_km" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" INTEGER NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "appointment_time" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "symptoms" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "technician_id" INTEGER,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_orders" (
    "id" SERIAL NOT NULL,
    "status" "RepairOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "symptoms" TEXT,
    "vehicle_condition_note" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod",
    "warranty_note" TEXT,
    "technician_note" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appointment_id" INTEGER,
    "customer_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "receptionist_id" INTEGER NOT NULL,
    "technician_id" INTEGER NOT NULL,
    "voucher_id" INTEGER,

    CONSTRAINT "repair_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "duration_minutes" INTEGER NOT NULL,
    "price_manual" DECIMAL(15,2) NOT NULL,
    "price_scooter" DECIMAL(15,2) NOT NULL,
    "price_moto" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combos" (
    "id" SERIAL NOT NULL,
    "combo_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "discount_pct" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_services" (
    "combo_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,

    CONSTRAINT "combo_services_pkey" PRIMARY KEY ("combo_id","service_id")
);

-- CreateTable
CREATE TABLE "repair_order_services" (
    "id" SERIAL NOT NULL,
    "applied_price" DECIMAL(15,2) NOT NULL,
    "repair_order_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,

    CONSTRAINT "repair_order_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" SERIAL NOT NULL,
    "part_number" VARCHAR(50) NOT NULL,
    "part_name" VARCHAR(200) NOT NULL,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'cái',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock_level" INTEGER NOT NULL DEFAULT 5,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_items" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "warranty_note" VARCHAR(255),
    "repair_order_id" INTEGER NOT NULL,
    "spare_part_id" INTEGER NOT NULL,

    CONSTRAINT "repair_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_orders" (
    "id" SERIAL NOT NULL,
    "import_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "import_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_items" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "import_price" DECIMAL(15,2) NOT NULL,
    "import_order_id" INTEGER NOT NULL,
    "spare_part_id" INTEGER NOT NULL,

    CONSTRAINT "import_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" SERIAL NOT NULL,
    "voucher_code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_amount" DECIMAL(15,2),
    "discount_percent" INTEGER,
    "max_discount" DECIMAL(15,2),
    "min_order_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_id" INTEGER,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "image_url" VARCHAR(500) NOT NULL,
    "link_url" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "admin_reply" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" INTEGER NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" INTEGER,
    "repair_order_id" INTEGER,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" SERIAL NOT NULL,
    "work_date" DATE NOT NULL,
    "shift_start" TIMESTAMP(3) NOT NULL,
    "shift_end" TIMESTAMP(3) NOT NULL,
    "max_vehicles" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" SERIAL NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "description" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "repair_orders_appointment_id_key" ON "repair_orders"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_service_name_key" ON "services"("service_name");

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_part_number_key" ON "spare_parts"("part_number");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_voucher_code_key" ON "vouchers"("voucher_code");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_category_name_key" ON "blog_categories"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_config_key_key" ON "system_configs"("config_key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_receptionist_id_fkey" FOREIGN KEY ("receptionist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_services" ADD CONSTRAINT "combo_services_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_services" ADD CONSTRAINT "combo_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_services" ADD CONSTRAINT "repair_order_services_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_services" ADD CONSTRAINT "repair_order_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_items" ADD CONSTRAINT "repair_order_items_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_items" ADD CONSTRAINT "repair_order_items_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_import_order_id_fkey" FOREIGN KEY ("import_order_id") REFERENCES "import_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
