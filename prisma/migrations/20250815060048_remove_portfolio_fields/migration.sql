/*
  Warnings:

  - You are about to drop the column `portfolio` on the `Creator` table. All the data in the column will be lost.
  - You are about to drop the `PortfolioItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PortfolioItem" DROP CONSTRAINT "PortfolioItem_creatorId_fkey";

-- AlterTable
ALTER TABLE "public"."Creator" DROP COLUMN "portfolio";

-- DropTable
DROP TABLE "public"."PortfolioItem";
