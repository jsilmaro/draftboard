-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "budget" REAL NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "additionalFields" TEXT,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Brief_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Brief" ("brandId", "budget", "createdAt", "deadline", "description", "id", "requirements", "status", "title", "updatedAt") SELECT "brandId", "budget", "createdAt", "deadline", "description", "id", "requirements", "status", "title", "updatedAt" FROM "Brief";
DROP TABLE "Brief";
ALTER TABLE "new_Brief" RENAME TO "Brief";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
