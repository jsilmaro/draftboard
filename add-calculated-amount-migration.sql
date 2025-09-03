-- Add calculatedAmount column to WinnerReward table
ALTER TABLE "WinnerReward" ADD COLUMN "calculatedAmount" DOUBLE PRECISION DEFAULT 0;

-- Update existing records to calculate the amount
UPDATE "WinnerReward" 
SET "calculatedAmount" = COALESCE("cashAmount", 0) + COALESCE("creditAmount", 0)
WHERE "calculatedAmount" IS NULL OR "calculatedAmount" = 0;

-- Make the column NOT NULL after updating existing data
ALTER TABLE "WinnerReward" ALTER COLUMN "calculatedAmount" SET NOT NULL;


