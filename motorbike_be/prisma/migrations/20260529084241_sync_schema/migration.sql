/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "password" VARCHAR(255),
ADD COLUMN     "avatar_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "image_url" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
