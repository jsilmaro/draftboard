/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkWithdrawals() {
  try {
    console.log('🔍 Checking withdrawal requests in database...');
    
    // Check all withdrawal requests
    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
            userName: true
          }
        }
      }
    });
    
    console.log(`Found ${withdrawals.length} withdrawal request(s)`);
    
    if (withdrawals.length > 0) {
      console.log('\n📋 Withdrawal Requests:');
      withdrawals.forEach((withdrawal, index) => {
        console.log(`\n${index + 1}. ID: ${withdrawal.id}`);
        console.log(`   Amount: $${withdrawal.amount}`);
        console.log(`   Status: ${withdrawal.status}`);
        console.log(`   Requested: ${withdrawal.requestedAt}`);
        console.log(`   Creator: ${withdrawal.creator?.fullName || 'Unknown'} (${withdrawal.creator?.email || 'No email'})`);
        if (withdrawal.reason) console.log(`   Reason: ${withdrawal.reason}`);
        if (withdrawal.adminNotes) console.log(`   Admin Notes: ${withdrawal.adminNotes}`);
      });
    } else {
      console.log('❌ No withdrawal requests found');
    }
    
    // Check creators with wallets
    console.log('\n💰 Checking creator wallets...');
    const wallets = await prisma.creatorWallet.findMany({
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });
    
    console.log(`Found ${wallets.length} creator wallet(s)`);
    wallets.forEach(wallet => {
      console.log(`  - ${wallet.creator.fullName}: $${wallet.balance} balance, $${wallet.totalEarned} earned, $${wallet.totalWithdrawn} withdrawn`);
    });
    
    // Check if there are any database connection issues
    console.log('\n🔌 Database connection test...');
    const adminCount = await prisma.admin.count();
    console.log(`Admin count: ${adminCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

checkWithdrawals();

