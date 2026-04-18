-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('FULL', 'INCREMENTAL');

-- AlterTable
ALTER TABLE "shops" ALTER COLUMN "status" SET DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "marketplace" "MarketplaceType" NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "image_url" TEXT,
    "stock" INTEGER NOT NULL,
    "sale_price_cents" INTEGER NOT NULL,
    "cost_price_cents" INTEGER,
    "government_taxes" INTEGER,
    "external_id" TEXT,
    "external_created_at" TIMESTAMP(3),
    "external_updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "shop_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_sync_control" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "marketplace" "MarketplaceType" NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "last_cursor" TEXT,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "sync_type" "SyncType" NOT NULL DEFAULT 'INCREMENTAL',
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_sync_control_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_shop_id_idx" ON "products"("shop_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_external_updated_at_idx" ON "products"("external_updated_at");

-- CreateIndex
CREATE INDEX "products_shop_id_marketplace_external_updated_at_idx" ON "products"("shop_id", "marketplace", "external_updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_external_id_marketplace_shop_id_key" ON "products"("external_id", "marketplace", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sync_control_shop_id_marketplace_key" ON "products_sync_control"("shop_id", "marketplace");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_sync_control" ADD CONSTRAINT "products_sync_control_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
