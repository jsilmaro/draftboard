const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// eslint-disable-next-line no-console
console.log('🔧 Testing Neon PostgreSQL connection...');
// eslint-disable-next-line no-console
console.log('📊 DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING');

// Function to enhance DATABASE_URL with proper Neon settings
function getEnhancedDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    // eslint-disable-next-line no-console
    console.error('❌ DATABASE_URL is not set in environment variables');
    return null;
  }
  
  // Add Neon-specific connection parameters
  const separator = baseUrl.includes('?') ? '&' : '?';
  const neonParams = [
    'sslmode=require',
    'connection_limit=20',
    'pool_timeout=60',
    'idle_timeout=120',
    'connect_timeout=30'
  ].join('&');
  
  const enhancedUrl = `${baseUrl}${separator}${neonParams}`;
  // eslint-disable-next-line no-console
  console.log('🔗 Enhanced DATABASE_URL preview:', enhancedUrl.substring(0, 50) + '...');
  
  return enhancedUrl;
}

// Create Prisma client with enhanced connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    // eslint-disable-next-line no-console
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    // eslint-disable-next-line no-console
    console.log('✅ Basic connection test passed:', result);
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    // eslint-disable-next-line no-console
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Test if Brand table exists and has data
    try {
      const brandCount = await prisma.brand.count();
      // eslint-disable-next-line no-console
      console.log('👥 Brand count:', brandCount);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('⚠️ Brand table not found or empty:', error.message);
    }
    
    // Test if Brief table exists and has data
    try {
      const briefCount = await prisma.brief.count();
      // eslint-disable-next-line no-console
      console.log('📝 Brief count:', briefCount);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('⚠️ Brief table not found or empty:', error.message);
    }
    
    // eslint-disable-next-line no-console
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database connection test failed:', error);
    // eslint-disable-next-line no-console
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Provide troubleshooting suggestions
    // eslint-disable-next-line no-console
    console.log('\n🔧 Troubleshooting suggestions:');
    // eslint-disable-next-line no-console
    console.log('1. Check if your Neon database is active');
    // eslint-disable-next-line no-console
    console.log('2. Verify the DATABASE_URL in your .env file');
    // eslint-disable-next-line no-console
    console.log('3. Ensure your IP is whitelisted in Neon');
    // eslint-disable-next-line no-console
    console.log('4. Check if the database schema is properly migrated');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
