/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing Specific Neon Database Connection');
console.log('==============================================\n');

// Test the specific connection string you provided
const specificUrl = "postgresql://neondb_owner:npg_sqURT8pItkj4@ep-holy-cloud-adtxx3yw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('📍 Testing connection string:');
console.log(specificUrl.replace(/:[^:@]+@/, ':****@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: specificUrl
    }
  }
});

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    console.log('\n🔄 Testing database query...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Query successful:', result);
    
    // Test if we can access tables
    console.log('\n🔄 Testing table access...');
    const briefCount = await prisma.brief.count();
    console.log(`✅ Brief table accessible, count: ${briefCount}`);
    
    console.log('\n🎉 Database is fully operational!');
    
  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 The database server is not responding');
      console.log('This usually means:');
      console.log('1. Database is paused in Neon Console');
      console.log('2. Database has been deleted');
      console.log('3. Network connectivity issues');
      console.log('\n💡 Try waking up the database in Neon Console:');
      console.log('   https://console.neon.tech/');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();


