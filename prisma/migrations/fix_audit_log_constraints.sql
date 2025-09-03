-- Fix AuditLog table constraints
ALTER TABLE "AuditLog" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have updatedAt value
UPDATE "AuditLog" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Make sure the constraint is properly set
ALTER TABLE "AuditLog" ALTER COLUMN "updatedAt" SET NOT NULL;
