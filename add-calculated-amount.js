/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCalculatedAmountColumn() {
  try {
    console.log('🔧 Starting migration to add calculatedAmount column...');
    
    // Add the calculatedAmount column
    await prisma.$executeRaw`
      ALTER TABLE "WinnerReward" 
      ADD COLUMN IF NOT EXISTS "calculatedAmount" DOUBLE PRECISION DEFAULT 0
    `;
    console.log('✅ Added calculatedAmount column');
    
    // Update existing records
    const updatedCount = await prisma.$executeRaw`
      UPDATE "WinnerReward" 
      SET "calculatedAmount" = COALESCE("cashAmount", 0) + COALESCE("creditAmount", 0)
      WHERE "calculatedAmount" IS NULL OR "calculatedAmount" = 0
    `;
    console.log(`✅ Updated ${updatedCount} existing records`);
    
    // Make the column NOT NULL
    await prisma.$executeRaw`
      ALTER TABLE "WinnerReward" 
      ALTER COLUMN "calculatedAmount" SET NOT NULL
    `;
    console.log('✅ Made calculatedAmount column NOT NULL');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addCalculatedAmountColumn();
