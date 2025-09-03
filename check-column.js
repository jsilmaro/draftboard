/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkColumn() {
  try {
    console.log('🔍 Checking if calculatedAmount column exists...');
    
    // Try to query the column directly
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'WinnerReward' 
      AND column_name = 'calculatedAmount'
    `;
    
    console.log('📊 Column info:', result);
    
    if (result && result.length > 0) {
      console.log('✅ calculatedAmount column exists!');
      
      // Check a few records
      const sampleRecords = await prisma.$queryRaw`
        SELECT id, "cashAmount", "creditAmount", "calculatedAmount"
        FROM "WinnerReward" 
        LIMIT 5
      `;
      
      console.log('📋 Sample records:', sampleRecords);
      
    } else {
      console.log('❌ calculatedAmount column does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumn();
