-- AddBriefFundingFields
ALTER TABLE "Brief" ADD COLUMN "isFunded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Brief" ADD COLUMN "fundedAt" TIMESTAMP(3);
