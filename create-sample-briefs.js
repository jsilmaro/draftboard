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

// Create Prisma client with the same configuration as server
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
  log: ['warn', 'error'],
});
