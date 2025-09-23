-- CreateTable
CREATE TABLE "StripeConnectAccount" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "requirements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeConnectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefFunding" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "stripeTransferId" TEXT,
    "stripeTransferGroupId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefRefund" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "stripeRefundId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_creatorId_key" ON "StripeConnectAccount"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_stripeAccountId_key" ON "StripeConnectAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BriefFunding_briefId_key" ON "BriefFunding"("briefId");

-- CreateIndex
CREATE INDEX "BriefFunding_brandId_idx" ON "BriefFunding"("brandId");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorPayout_briefId_idx" ON "CreatorPayout"("briefId");

-- CreateIndex
CREATE INDEX "BriefRefund_briefId_idx" ON "BriefRefund"("briefId");

-- CreateIndex
CREATE INDEX "BriefRefund_brandId_idx" ON "BriefRefund"("brandId");

-- AddForeignKey
ALTER TABLE "StripeConnectAccount" ADD CONSTRAINT "StripeConnectAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefFunding" ADD CONSTRAINT "BriefFunding_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefFunding" ADD CONSTRAINT "BriefFunding_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefRefund" ADD CONSTRAINT "BriefRefund_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefRefund" ADD CONSTRAINT "BriefRefund_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;


