/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addWithdrawalTableOnly() {
  try {
    console.log('🔧 Adding ONLY the WithdrawalRequest table to existing Neon database...');
    console.log('⚠️  This will NOT remove any existing data or tables');
    
    // Check if table already exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'WithdrawalRequest'
      )
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ WithdrawalRequest table already exists!');
      return;
    }
    
    console.log('📋 Creating WithdrawalRequest table...');
    
    // Create the table
    await prisma.$executeRaw`
      CREATE TABLE "WithdrawalRequest" (
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
    await prisma.$executeRaw`CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status")`;
    await prisma.$executeRaw`CREATE INDEX "WithdrawalRequest_creatorId_idx" ON "WithdrawalRequest"("creatorId")`;
    await prisma.$executeRaw`CREATE INDEX "WithdrawalRequest_requestedAt_idx" ON "WithdrawalRequest"("requestedAt")`;
    
    console.log('✅ Indexes created successfully');
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_creatorId_fkey" 
      FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `;
    
    console.log('✅ Foreign key constraint added successfully');
    
    // Verify the table was created
    const verification = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'WithdrawalRequest'
      )
    `;
    
    if (verification[0].exists) {
      console.log('✅ WithdrawalRequest table verified in database');
      console.log('\n🚀 SUCCESS! WithdrawalRequest table is now ready!');
      console.log('You can now create withdrawal requests and they will appear in the admin dashboard.');
    } else {
      console.log('❌ Table creation failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

addWithdrawalTableOnly();

