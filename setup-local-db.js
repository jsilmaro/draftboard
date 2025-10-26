/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');

console.log('🔧 Setting up Local Database for Development');
console.log('=============================================\n');

// Create a backup of current .env
const envBackup = `# Backup of original .env
# Created: ${new Date().toISOString()}
# Original DATABASE_URL: ${process.env.DATABASE_URL}

# Local SQLite Database for Development
DATABASE_URL="file:./dev.db"

# Keep all other environment variables
NODE_ENV=development
PORT=3001
JWT_SECRET=${process.env.JWT_SECRET}
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY_TEST=${process.env.STRIPE_PUBLISHABLE_KEY_TEST}
STRIPE_MODE=test
ADMIN_EMAIL=${process.env.ADMIN_EMAIL}
ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD}
ADMIN_NAME=${process.env.ADMIN_NAME}
FRONTEND_URL=${process.env.FRONTEND_URL}
VITE_GOOGLE_CLIENT_ID=${process.env.VITE_GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID}
`;

// Write the new .env file
fs.writeFileSync('.env.local', envBackup);

console.log('✅ Created .env.local with local database configuration');
console.log('\n📋 To use local database:');
console.log('1. Copy .env.local to .env: cp .env.local .env');
console.log('2. Run: npx prisma db push');
console.log('3. Run: npm run dev');
console.log('\n⚠️  Note: This will use SQLite instead of PostgreSQL');
console.log('   You can switch back to Neon later by restoring your original .env');


