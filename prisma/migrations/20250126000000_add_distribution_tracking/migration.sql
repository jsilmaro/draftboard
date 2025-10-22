-- AddDistributionTracking
-- This migration adds fields to track distributed rewards and disable reward tiers

-- Add distributedAt field to Submission table
ALTER TABLE "Submission" ADD COLUMN "distributedAt" TIMESTAMP(3);

-- Add isAvailable and distributedAt fields to RewardTier table
ALTER TABLE "RewardTier" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RewardTier" ADD COLUMN "distributedAt" TIMESTAMP(3);

-- Add index for isAvailable field
CREATE INDEX "RewardTier_isAvailable_idx" ON "RewardTier"("isAvailable");

