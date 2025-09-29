-- CreateRewardTierSystem
-- This migration adds the new reward-tier based system

-- Create RewardTier table
CREATE TABLE "RewardTier" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardTier_pkey" PRIMARY KEY ("id")
);

-- Create RewardAssignment table
CREATE TABLE "RewardAssignment" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "rewardTierId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "payoutStatus" TEXT NOT NULL DEFAULT 'pending',
    "stripeTransferId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardAssignment_pkey" PRIMARY KEY ("id")
);

-- Create BriefStatus table for tracking brief lifecycle
CREATE TABLE "BriefStatus" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BriefStatus_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "RewardTier_briefId_idx" ON "RewardTier"("briefId");
CREATE INDEX "RewardTier_tierNumber_idx" ON "RewardTier"("tierNumber");
CREATE INDEX "RewardTier_position_idx" ON "RewardTier"("position");

CREATE INDEX "RewardAssignment_briefId_idx" ON "RewardAssignment"("briefId");
CREATE INDEX "RewardAssignment_creatorId_idx" ON "RewardAssignment"("creatorId");
CREATE INDEX "RewardAssignment_rewardTierId_idx" ON "RewardAssignment"("rewardTierId");
CREATE INDEX "RewardAssignment_status_idx" ON "RewardAssignment"("status");
CREATE INDEX "RewardAssignment_payoutStatus_idx" ON "RewardAssignment"("payoutStatus");

CREATE INDEX "BriefStatus_briefId_idx" ON "BriefStatus"("briefId");
CREATE INDEX "BriefStatus_status_idx" ON "BriefStatus"("status");

-- Add foreign key constraints
ALTER TABLE "RewardTier" ADD CONSTRAINT "RewardTier_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_rewardTierId_fkey" FOREIGN KEY ("rewardTierId") REFERENCES "RewardTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BriefStatus" ADD CONSTRAINT "BriefStatus_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraints
ALTER TABLE "RewardTier" ADD CONSTRAINT "RewardTier_briefId_tierNumber_key" UNIQUE ("briefId", "tierNumber");
ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_rewardTierId_key" UNIQUE ("rewardTierId");
ALTER TABLE "RewardAssignment" ADD CONSTRAINT "RewardAssignment_submissionId_key" UNIQUE ("submissionId");

