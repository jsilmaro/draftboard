const { PrismaClient } = require('@prisma/client');

// Function to enhance DATABASE_URL with connection pool settings
function getEnhancedDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;
  
  // Add Neon-specific connection parameters for better reliability
  const separator = baseUrl.includes('?') ? '&' : '?';
  const neonParams = [
    'sslmode=require',
    'connection_limit=10', // Reduced from 20 to avoid connection limits
    'pool_timeout=30', // Reduced timeout
    'idle_timeout=60', // Reduced idle timeout
    'connect_timeout=15', // Reduced connect timeout
    'statement_timeout=30000', // 30 second statement timeout
    'application_name=draftboard-app'
  ].join('&');
  
  return `${baseUrl}${separator}${neonParams}`;
}

// Create a single Prisma client instance with enhanced configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: 'pretty',
  // Add transaction options for better reliability
  transactionOptions: {
    timeout: 30000, // 30 seconds
    isolationLevel: 'ReadCommitted',
  },
});

// Add connection pool event listeners for better error handling
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
    
    // Log slow queries
    if (e.duration > 1000) {
      console.warn(`⚠️ Slow query detected: ${e.duration}ms - ${e.query}`);
    }
  }
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
  
  // Handle connection errors more gracefully
  if (e.message && e.message.includes('connection')) {
    console.error('❌ Database connection error detected');
    console.error('🔧 Please check your DATABASE_URL and database service status');
  }
});

// Add connection health check function
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Test connection on startup
testDatabaseConnection().then(success => {
  if (success) {
    console.log('🚀 Database ready for operations');
  } else {
    console.log('⚠️ Database connection issues detected - some features may not work');
  }
});

// Add graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma, testDatabaseConnection };

