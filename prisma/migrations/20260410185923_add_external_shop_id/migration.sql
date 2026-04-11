/*
  Warnings:

  - Added the required column `external_shop_id` to the `marketplace_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "marketplace_tokens" ADD COLUMN     "external_shop_id" TEXT NOT NULL;
