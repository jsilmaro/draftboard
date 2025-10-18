const { PrismaClient } = require('@prisma/client');

// Function to enhance DATABASE_URL with connection pool settings for permanent connection
function getEnhancedDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;
  
  // Add connection parameters for permanent, stable connection
  const separator = baseUrl.includes('?') ? '&' : '?';
  const neonParams = [
    'sslmode=require',
    'connection_limit=15', // Optimal connection pool size
    'pool_timeout=0', // No timeout - keep connections alive
    'idle_timeout=0', // No idle timeout - prevent connection drops
    'connect_timeout=30', // Allow more time for initial connection
    'statement_timeout=60000', // 60 second statement timeout
    'application_name=draftboard-app',
    'keepalive=1', // Enable keepalive
    'keepalives_idle=30', // Send keepalive every 30 seconds
    'keepalives_interval=10', // Retry keepalive every 10 seconds
    'keepalives_count=5' // Allow 5 failed keepalives before disconnect
  ].join('&');
  
  return `${baseUrl}${separator}${neonParams}`;
}

// Create a single Prisma client instance with enhanced configuration for permanent connection
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
    timeout: 60000, // 60 seconds for complex operations
    isolationLevel: 'ReadCommitted',
  },
});

// Ensure connection stays alive - ping database periodically
let keepAliveInterval = null;

async function keepDatabaseAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database keepalive ping successful');
  } catch (error) {
    console.error('❌ Database keepalive ping failed:', error.message);
    // Attempt to reconnect
    try {
      await prisma.$connect();
      console.log('🔄 Database reconnected successfully');
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError.message);
    }
  }
}

// Start keepalive pings every 30 seconds to maintain permanent connection
function startKeepAlive() {
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(keepDatabaseAlive, 30000); // Every 30 seconds
    console.log('🔄 Database keepalive started (pinging every 30 seconds)');
  }
}

// Stop keepalive on shutdown
function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('🛑 Database keepalive stopped');
  }
}

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

// Test connection on startup and start keepalive
testDatabaseConnection().then(success => {
  if (success) {
    console.log('🚀 Database ready for operations');
    startKeepAlive(); // Start permanent connection keepalive
  } else {
    console.log('⚠️ Database connection issues detected - some features may not work');
  }
});

// Add graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Disconnecting from database...');
  stopKeepAlive();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Disconnecting from database...');
  stopKeepAlive();
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma, testDatabaseConnection, keepDatabaseAlive, startKeepAlive, stopKeepAlive };

