const { PrismaClient } = require('@prisma/client');

// Function to enhance DATABASE_URL with connection pool settings
function getEnhancedDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;
  
  // Add connection pool parameters to prevent timeout issues
  const separator = baseUrl.includes('?') ? '&' : '?';
  const poolParams = [
    'connection_limit=20',
    'pool_timeout=60',
    'idle_timeout=120',
    'connect_timeout=30'
  ].join('&');
  
  return `${baseUrl}${separator}${poolParams}`;
}

// Create a single Prisma client instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
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

module.exports = prisma;

