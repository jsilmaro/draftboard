/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addWithdrawalTable() {
  try {
    console.log('🔧 Adding WithdrawalRequest table to existing database...');
    
    // Execute the SQL to create the table
    await prisma.$executeRaw`
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
      )
    `;
    
    console.log('✅ Table created successfully');
    
    // Add indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_creatorId_idx" ON "WithdrawalRequest"("creatorId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_requestedAt_idx" ON "WithdrawalRequest"("requestedAt")`;
    
    console.log('✅ Indexes created successfully');
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_creatorId_fkey" 
      FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `;
    
    console.log('✅ Foreign key constraint added successfully');
    
    // Verify the table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'WithdrawalRequest'
      )
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ WithdrawalRequest table verified in database');
    } else {
      console.log('❌ Table creation failed');
    }
    
    console.log('\n🚀 WithdrawalRequest table is now ready!');
    console.log('You can now create withdrawal requests and they will appear in the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

addWithdrawalTable();

