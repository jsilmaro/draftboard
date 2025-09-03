-- Add calculatedAmount field to WinnerReward table
ALTER TABLE "WinnerReward" ADD COLUMN "calculatedAmount" DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records to have calculated amounts
UPDATE "WinnerReward" 
SET "calculatedAmount" = "cashAmount" + "creditAmount" 
WHERE "calculatedAmount" = 0 OR "calculatedAmount" IS NULL;

