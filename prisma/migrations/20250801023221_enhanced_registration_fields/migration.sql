/*
  Warnings:

  - You are about to drop the column `bankingInfo` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `contactInfo` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `bankingInfo` on the `Creator` table. All the data in the column will be lost.
  - You are about to drop the column `socialHandles` on the `Creator` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneCountry" TEXT,
    "phoneNumber" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "addressCountry" TEXT,
    "socialInstagram" TEXT,
    "socialTwitter" TEXT,
    "socialLinkedIn" TEXT,
    "socialWebsite" TEXT,
    "paymentMethod" TEXT,
    "cardNumber" TEXT,
    "cardType" TEXT,
    "bankName" TEXT,
    "bankAccountType" TEXT,
    "bankRouting" TEXT,
    "bankAccount" TEXT,
    "logo" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Brand" ("companyName", "contactName", "createdAt", "email", "id", "isVerified", "logo", "password", "updatedAt") SELECT "companyName", "contactName", "createdAt", "email", "id", "isVerified", "logo", "password", "updatedAt" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE UNIQUE INDEX "Brand_email_key" ON "Brand"("email");
CREATE TABLE "new_Creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneCountry" TEXT,
    "phoneNumber" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "addressCountry" TEXT,
    "socialInstagram" TEXT,
    "socialTwitter" TEXT,
    "socialLinkedIn" TEXT,
    "socialTikTok" TEXT,
    "socialYouTube" TEXT,
    "portfolio" TEXT,
    "paymentMethod" TEXT,
    "cardNumber" TEXT,
    "cardType" TEXT,
    "bankName" TEXT,
    "bankAccountType" TEXT,
    "bankRouting" TEXT,
    "bankAccount" TEXT,
    "paypalEmail" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Creator" ("createdAt", "email", "fullName", "id", "isVerified", "password", "portfolio", "updatedAt", "userName") SELECT "createdAt", "email", "fullName", "id", "isVerified", "password", "portfolio", "updatedAt", "userName" FROM "Creator";
DROP TABLE "Creator";
ALTER TABLE "new_Creator" RENAME TO "Creator";
CREATE UNIQUE INDEX "Creator_userName_key" ON "Creator"("userName");
CREATE UNIQUE INDEX "Creator_email_key" ON "Creator"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
