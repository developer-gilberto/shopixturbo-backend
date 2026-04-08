/*
  Warnings:

  - Added the required column `status` to the `shops` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('NORMAL', 'BANNED', 'FROZEN');

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "authorized_in" TIMESTAMP(3),
ADD COLUMN     "invoice_issuer" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "status" "ShopStatus" NOT NULL;
