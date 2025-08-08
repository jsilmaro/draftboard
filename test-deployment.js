/* eslint-disable no-console */
// Test script to debug deployment issues
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testDeployment() {
  console.log('🔍 Testing deployment configuration...');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
  
  if (process.env.DATABASE_URL) {
    console.log('- DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
  }
  
  // Test Prisma connection
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔍 Testing Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test basic queries
    const brandCount = await prisma.brand.count();
    console.log('✅ Brand count:', brandCount);
    
    const creatorCount = await prisma.creator.count();
    console.log('✅ Creator count:', creatorCount);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDeployment().catch(console.error);
