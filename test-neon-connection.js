/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing Neon Database Connection');
console.log('=====================================\n');

// Test 1: Basic connection test
async function testBasicConnection() {
  console.log('📡 Test 1: Basic Connection Test');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Basic connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Basic connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test 2: Connection with timeout
async function testConnectionWithTimeout() {
  console.log('\n📡 Test 2: Connection with Extended Timeout');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '&connect_timeout=60&statement_timeout=30000'
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Extended timeout connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Extended timeout connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test 3: Test with different connection string format
async function testAlternativeFormat() {
  console.log('\n📡 Test 3: Alternative Connection String Format');
  
  // Try without channel_binding parameter
  const altUrl = process.env.DATABASE_URL.replace('&channel_binding=require', '');
  console.log('Trying without channel_binding parameter...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: altUrl
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Alternative format connection successful!');
    console.log('💡 Consider updating your .env with this format');
    return true;
  } catch (error) {
    console.log('❌ Alternative format connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run all tests
async function runAllTests() {
  const results = await Promise.all([
    testBasicConnection(),
    testConnectionWithTimeout(),
    testAlternativeFormat()
  ]);
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Basic Connection: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Extended Timeout: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Alternative Format: ${results[2] ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!results.some(r => r)) {
    console.log('\n🚨 All connection tests failed!');
    console.log('\n🔧 Next Steps:');
    console.log('1. Go to https://console.neon.tech/');
    console.log('2. Check if your database is paused or has issues');
    console.log('3. Try creating a new database in Neon Console');
    console.log('4. Get a fresh connection string');
    console.log('5. Update your .env file with the new DATABASE_URL');
  } else {
    console.log('\n🎉 At least one connection method worked!');
  }
}

runAllTests().catch(console.error);


