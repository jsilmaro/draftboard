-- Add Reward Tier System Tables
-- This script manually adds the new tables for the reward-tier based system

-- Create RewardTier table
CREATE TABLE IF NOT EXISTS "RewardTier" (
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
CREATE TABLE IF NOT EXISTS "RewardAssignment" (
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
CREATE TABLE IF NOT EXISTS "BriefStatus" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BriefStatus_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "RewardTier_briefId_idx" ON "RewardTier"("briefId");
CREATE INDEX IF NOT EXISTS "RewardTier_tierNumber_idx" ON "RewardTier"("tierNumber");
CREATE INDEX IF NOT EXISTS "RewardTier_position_idx" ON "RewardTier"("position");

CREATE INDEX IF NOT EXISTS "RewardAssignment_briefId_idx" ON "RewardAssignment"("briefId");
CREATE INDEX IF NOT EXISTS "RewardAssignment_creatorId_idx" ON "RewardAssignment"("creatorId");
CREATE INDEX IF NOT EXISTS "RewardAssignment_rewardTierId_idx" ON "RewardAssignment"("rewardTierId");
CREATE INDEX IF NOT EXISTS "RewardAssignment_status_idx" ON "RewardAssignment"("status");
CREATE INDEX IF NOT EXISTS "RewardAssignment_payoutStatus_idx" ON "RewardAssignment"("payoutStatus");

CREATE INDEX IF NOT EXISTS "BriefStatus_briefId_idx" ON "BriefStatus"("briefId");
CREATE INDEX IF NOT EXISTS "BriefStatus_status_idx" ON "BriefStatus"("status");

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

-- Add totalBudget column to Brief table if it doesn't exist
ALTER TABLE "Brief" ADD COLUMN IF NOT EXISTS "totalBudget" DECIMAL(10,2);

