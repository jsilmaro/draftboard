-- Add WithdrawalRequest table to existing database
CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "adminNotes" TEXT,
    "stripeTransferId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_creatorId_idx" ON "WithdrawalRequest"("creatorId");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_requestedAt_idx" ON "WithdrawalRequest"("requestedAt");

-- Add foreign key constraint to link with Creator table
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_creatorId_fkey" 
    FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;








