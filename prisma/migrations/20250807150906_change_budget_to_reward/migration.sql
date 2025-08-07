/*
  Warnings:

  - You are about to drop the column `budget` on the `Brief` table. All the data in the column will be lost.
  - Added the required column `reward` to the `Brief` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "reward" REAL NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "additionalFields" TEXT,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "Brief_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Brief" ("additionalFields", "brandId", "closedAt", "createdAt", "deadline", "description", "id", "isPrivate", "requirements", "reward", "status", "title", "updatedAt") SELECT "additionalFields", "brandId", "closedAt", "createdAt", "deadline", "description", "id", "isPrivate", "requirements", "budget", "status", "title", "updatedAt" FROM "Brief";
DROP TABLE "Brief";
ALTER TABLE "new_Brief" RENAME TO "Brief";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
