-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "logo" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bankingInfo" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "socialHandles" TEXT,
    "portfolio" TEXT,
    "bankingInfo" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_email_key" ON "Brand"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_userName_key" ON "Creator"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_email_key" ON "Creator"("email");
