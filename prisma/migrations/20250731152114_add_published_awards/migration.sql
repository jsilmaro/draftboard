-- CreateTable
CREATE TABLE "PublishedAward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "rewardTiers" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublishedAward_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublishedAward_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
