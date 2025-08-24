require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Debug environment variables
console.log('🔧 Environment check:');
console.log('TEST_VAR:', process.env.TEST_VAR || 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const app = express();

// Function to enhance DATABASE_URL with connection pool settings
function getEnhancedDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;
  
  // Add connection pool parameters to prevent timeout issues
  const separator = baseUrl.includes('?') ? '&' : '?';
  const poolParams = [
    'connection_limit=20', // Increased from 10
    'pool_timeout=60',     // Increased from 30 to 60 seconds
    'idle_timeout=120',    // Increased from 60 to 120 seconds
    'connect_timeout=30'   // Increased from 15 to 30 seconds
  ].join('&');
  
  return `${baseUrl}${separator}${poolParams}`;
}

// Configure Prisma client with connection pool settings to prevent timeout issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getEnhancedDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Configure connection pool settings to prevent timeout issues
// Note: $use middleware is not available in current Prisma version
// Connection pool is handled automatically by Prisma

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
    
    // In production, you might want to restart the connection
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Attempting to reconnect...');
      setTimeout(() => {
        console.log('🔄 Reconnection not needed - Prisma handles connections automatically');
      }, 5000);
    }
  }
});

const PORT = process.env.PORT || 3001;

// Utility function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Database connection test
// Note: $connect is deprecated in newer Prisma versions
// Connection is established automatically on first query
console.log('✅ Prisma client initialized');
console.log('🔍 Environment Variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  - PORT:', process.env.PORT || 'not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING!');
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING!');
if (process.env.DATABASE_URL) {
  console.log('  - DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://draftboard-b44q.vercel.app',
        'https://draftboard-b44q-git-master-jsilmaros-projects.vercel.app',
        'https://draftboard-b44q-guyh12yl8-jsilmaros-projects.vercel.app',
        'https://draftboard-rf3ugm5tg-jsilmaros-projects.vercel.app',
        'https://draftboard-ecru.vercel.app',
        'https://draftboard-octj8189e-jsilmaros-projects.vercel.app'
      ]
    : ['http://localhost:3000', 'https://draftboard-b44q.vercel.app', ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'https://draftboard-b44q-git-master-jsilmaros-projects.vercel.app', 'https://draftboard-b44q-guyh12yl8-jsilmaros-projects.vercel.app']
}));

// Enhanced COOP and security headers middleware for Google OAuth compatibility
app.use((req, res, next) => {
  // Primary COOP headers - using unsafe-none to completely disable COOP restrictions
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // CORS headers for cross-origin requests
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, X-Client-Version, X-Client-Name');
  
  // Security headers that don't interfere with OAuth
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Changed from ALLOWALL for better security
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Additional headers for Google OAuth compatibility
  res.setHeader('Permissions-Policy', 'interest-cohort=(), camera=(), microphone=(), geolocation=()');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.static('uploads'));

// Request timeout middleware - REMOVED to allow longer login times
// app.use((req, res, next) => {
//   // Set a 30-second timeout for all requests
//   req.setTimeout(30000, () => {
//     console.error(`⏰ Request timeout: ${req.method} ${req.url}`);
//     if (!res.headersSent) {
//       res.status(408).json({ error: 'Request timeout' });
//     }
//   });
//   
//   // Set response timeout
//   res.setTimeout(30000, () => {
//     console.error(`⏰ Response timeout: ${req.method} ${req.url}`);
//     if (!res.headersSent) {
//       res.status(408).json({ error: 'Response timeout' });
//     }
//   });
//   
//   next();
// });

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Healthcheck endpoint for Railway
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const brandCount = await prisma.brand.count();
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseConnected: true,
      brandCount
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Server is running but database connection failed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseConnected: false,
      error: error.message
    });
  }
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Brand-Creator Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://draftboard-b44q.vercel.app', 'https://draftboard-b44q-git-master-jsilmaros-projects.vercel.app', 'https://draftboard-b44q-guyh12yl8-jsilmaros-projects.vercel.app', 'https://draftboard-rf3ugm5tg-jsilmaros-projects.vercel.app', 'https://draftboard-ecru.vercel.app', 'https://draftboard-octj8189e-jsilmaros-projects.vercel.app']
      : ['http://localhost:3000'],
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('🔍 Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET'
    });
    
    console.log('✅ Database connection successful');
    
    // Try a simple query
    const brandCount = await prisma.brand.count();
    console.log('✅ Database query successful, brand count:', brandCount);
    
    // Test all models
    const [brands, creators, briefs, submissions] = await Promise.all([
      prisma.brand.count(),
      prisma.creator.count(),
      prisma.brief.count(),
      prisma.submission.count()
    ]);
    
    res.json({ 
      status: 'success', 
      message: 'Database connection working',
      counts: { brands, creators, briefs, submissions },
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
});



// Multer configuration for file uploads
// In serverless environments (Vercel), use memory storage instead of disk storage
const storage = process.env.VERCEL || process.env.NODE_ENV === 'production' 
  ? multer.memoryStorage() // Use memory storage for serverless
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    });

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to handle file uploads in different environments
const handleFileUpload = (file) => {
  if (!file) return null;
  
  // In serverless environments, we'd typically upload to cloud storage
  // For now, we'll return a placeholder or handle differently
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // In production, you might want to upload to AWS S3, Cloudinary, etc.
    // For now, return a data URL or handle differently
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  } else {
    // In development, use local file system
    return `/uploads/${file.filename}`;
  }
};



// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    hasJwtSecret: !!process.env.JWT_SECRET,
    url: req.url,
    method: req.method
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    console.log('❌ JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('✅ Token verified successfully for user:', user.id);
    req.user = user;
    next();
  });
};

        // Brand registration
        app.post('/api/brands/register', upload.single('logo'), async (req, res) => {
          try {
            console.log('📝 Brand registration attempt:', { email: req.body.email });
            console.log('🔍 Environment check:', {
              hasJwtSecret: !!process.env.JWT_SECRET,
              hasDatabaseUrl: !!process.env.DATABASE_URL,
              databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING'
            });
            
            const {
              companyName,
              contactName,
              email,
              password,
              // Contact Information
              phoneCountry,
              phoneNumber,
              addressStreet,
              addressCity,
              addressState,
              addressZip,
              addressCountry,
              // Social Media
              socialInstagram,
              socialTwitter,
              socialLinkedIn,
              socialWebsite,
              // Banking Information
              paymentMethod,
              cardNumber,
              cardType,
              bankName,
              bankAccountType,
              bankRouting,
              bankAccount,
              // Terms
              termsAccepted
            } = req.body;

                // Validate required fields
            if (!email || !password || !companyName || !contactName || !termsAccepted) {
              return res.status(400).json({ error: 'Missing required fields' });
            }

    // Check if email already exists
    console.log('🔍 Checking if email exists in database...');
    const existingBrand = await prisma.brand.findUnique({
      where: { email }
    });

    if (existingBrand) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.log('✅ Email is available for registration');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

                // Create brand
            const brand = await prisma.brand.create({
              data: {
                companyName,
                contactName,
                email,
                password: hashedPassword,
                // Contact Information
                phoneCountry,
                phoneNumber,
                addressStreet,
                addressCity,
                addressState,
                addressZip,
                addressCountry,
                // Social Media
                socialInstagram,
                socialTwitter,
                socialLinkedIn,
                socialWebsite,
                // Banking Information
                paymentMethod,
                cardNumber,
                cardType,
                bankName,
                bankAccountType,
                bankRouting,
                bankAccount,
                // Terms
                termsAccepted: termsAccepted === 'true' || termsAccepted === true,
                // Profile
                logo: handleFileUpload(req.file)
              }
            });

    console.log('✅ Brand created successfully:', { id: brand.id, email: brand.email });

    // Generate JWT token
    const token = jwt.sign(
      { id: brand.id, email: brand.email, type: 'brand' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Brand registered successfully',
      token,
      user: {
        id: brand.id,
        companyName: brand.companyName,
        email: brand.email,
        type: 'brand'
      }
    });
  } catch (error) {
    console.error('❌ Brand registration error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed'
    });
  }
});

// Optimized unified login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Optimized login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Promise.all to check both tables simultaneously for better performance
    const [brand, creator] = await Promise.all([
      prisma.brand.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          companyName: true
        }
      }),
      prisma.creator.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          userName: true,
          fullName: true
        }
      })
    ]);

    // Check brand first
    if (brand) {
      // Check if this is a Google OAuth account (empty password)
      if (!brand.password || brand.password === '') {
        return res.status(401).json({ 
          error: 'This account was created with Google Sign-In. Please use Google Sign-In to log in.',
          googleOAuthRequired: true
        });
      }

      const validPassword = await bcrypt.compare(password, brand.password);
      if (validPassword) {
        if (!process.env.JWT_SECRET) {
          console.log('❌ JWT_SECRET not configured during brand login');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        const token = jwt.sign(
          { id: brand.id, email: brand.email, type: 'brand' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log('✅ Brand login successful:', { 
          brandId: brand.id, 
          hasJwtSecret: !!process.env.JWT_SECRET,
          tokenPreview: token.substring(0, 20) + '...'
        });

        // Create welcome notification asynchronously (don't wait for it)
        createNotification(
          brand.id,
          'brand',
          'Welcome Back! 👋',
          `Welcome back to your dashboard, ${brand.companyName}!`,
          'brief'
        ).catch(error => {
          console.error('Failed to create welcome notification:', error);
        });

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: brand.id,
            companyName: brand.companyName,
            email: brand.email,
            type: 'brand'
          }
        });
      }
    }

    // Check creator if brand login failed
    if (creator) {
      // Check if this is a Google OAuth account (empty password)
      if (!creator.password || creator.password === '') {
        return res.status(401).json({ 
          error: 'This account was created with Google Sign-In. Please use Google Sign-In to log in.',
          googleOAuthRequired: true
        });
      }

      const validPassword = await bcrypt.compare(password, creator.password);
      if (validPassword) {
        if (!process.env.JWT_SECRET) {
          console.log('❌ JWT_SECRET not configured during creator login');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        const token = jwt.sign(
          { id: creator.id, email: creator.email, type: 'creator' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log('✅ Creator login successful:', { 
          creatorId: creator.id, 
          hasJwtSecret: !!process.env.JWT_SECRET,
          tokenPreview: token.substring(0, 20) + '...'
        });

        // Create welcome notification asynchronously (don't wait for it)
        createNotification(
          creator.id,
          'creator',
          'Welcome Back! 👋',
          `Welcome back to your dashboard, ${creator.fullName || creator.userName}!`,
          'brief'
        ).catch(error => {
          console.error('Failed to create welcome notification:', error);
        });

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: creator.id,
            userName: creator.userName,
            email: creator.email,
            type: 'creator'
          }
        });
      }
    }

    // If we get here, either the user doesn't exist or the password is wrong
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Optimized login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimized brand login (kept for backward compatibility)
app.post('/api/brands/login', async (req, res) => {
  try {
    console.log('🔐 Optimized brand login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const brand = await prisma.brand.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        companyName: true
      }
    });

    if (!brand) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if this is a Google OAuth account (empty password)
    if (!brand.password || brand.password === '') {
      return res.status(401).json({ 
        error: 'This account was created with Google Sign-In. Please use Google Sign-In to log in.',
        googleOAuthRequired: true
      });
    }

    const validPassword = await bcrypt.compare(password, brand.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not configured during brand login');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: brand.id, email: brand.email, type: 'brand' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Brand login successful:', { 
      brandId: brand.id, 
      hasJwtSecret: !!process.env.JWT_SECRET,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // Create a welcome notification asynchronously (don't wait for it)
    createNotification(
      brand.id,
      'brand',
      'Welcome Back! 👋',
      `Welcome back to your dashboard, ${brand.companyName}!`,
      'brief'
    ).catch(error => {
      console.error('Failed to create welcome notification:', error);
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: brand.id,
        companyName: brand.companyName,
        email: brand.email,
        type: 'brand'
      }
    });
  } catch (error) {
    console.error('Optimized brand login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator registration
app.post('/api/creators/register', async (req, res) => {
  try {
    const {
      userName,
      email,
      password,
      fullName,
      // Contact Information
      phoneCountry,
      phoneNumber,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      // Social Media
      socialInstagram,
      socialTwitter,
      socialLinkedIn,
      socialTikTok,
      socialYouTube,
      // Banking Information (optional - removed from registration flow)
      paymentMethod,
      cardNumber,
      cardType,
      bankName,
      bankAccountType,
      bankRouting,
      bankAccount,
      paypalEmail,
      // Terms
      termsAccepted
    } = req.body;

    // Check if email or username already exists
    const existingCreator = await prisma.creator.findFirst({
      where: {
        OR: [
          { email },
          { userName }
        ]
      }
    });

    if (existingCreator) {
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    // Validate required fields
    if (!userName || !email || !password || !fullName || !termsAccepted) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create creator
    const creator = await prisma.creator.create({
      data: {
        userName,
        email,
        password: hashedPassword,
        fullName,
        // Contact Information
        phoneCountry,
        phoneNumber,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        addressCountry,
        // Social Media
        socialInstagram,
        socialTwitter,
        socialLinkedIn,
        socialTikTok,
        socialYouTube,
        // Banking Information (optional - removed from registration flow)
        paymentMethod: paymentMethod || null,
        cardNumber: cardNumber || null,
        cardType: cardType || null,
        bankName: bankName || null,
        bankAccountType: bankAccountType || null,
        bankRouting: bankRouting || null,
        bankAccount: bankAccount || null,
        paypalEmail: paypalEmail || null,
        // Terms
        termsAccepted: termsAccepted === 'true' || termsAccepted === true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: creator.id, email: creator.email, type: 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Creator registered successfully',
      token,
      user: {
        id: creator.id,
        userName: creator.userName,
        fullName: creator.fullName,
        email: creator.email,
        type: 'creator'
      }
    });
  } catch (error) {
    console.error('Creator registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator login
app.post('/api/creators/login', async (req, res) => {
  try {
    console.log('🔐 Creator login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const creator = await prisma.creator.findUnique({
      where: { email }
    });

          if (!creator) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if this is a Google OAuth account (empty password)
      if (!creator.password || creator.password === '') {
        return res.status(401).json({ 
          error: 'This account was created with Google Sign-In. Please use Google Sign-In to log in.',
          googleOAuthRequired: true
        });
      }

      const validPassword = await bcrypt.compare(password, creator.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not configured during creator login');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: creator.id, email: creator.email, type: 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Creator login successful:', { 
      creatorId: creator.id, 
      hasJwtSecret: !!process.env.JWT_SECRET,
      tokenPreview: token.substring(0, 20) + '...'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: creator.id,
        userName: creator.userName,
        email: creator.email,
        type: 'creator'
      }
    });
  } catch (error) {
    console.error('Creator login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    console.log('🔐 Google OAuth request received:', { 
      hasCredential: !!req.body.credential, 
      userType: req.body.userType,
      bodyKeys: Object.keys(req.body)
    });

    const { credential, userType } = req.body;

    if (!credential) {
      console.log('❌ No credential provided');
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Decode the JWT token from Google
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(credential);
    
    if (!decoded) {
      console.log('❌ Invalid credential format');
      return res.status(400).json({ error: 'Invalid Google credential' });
    }

    const { email, name } = decoded;
    console.log('✅ Google credential decoded:', { email, name: name?.substring(0, 20) + '...' });

    // Check if user already exists
    let existingUser = null;
    let userTypeFound = null;

    console.log('🔍 Checking for existing user with email:', email);

    // Check as brand first
    const existingBrand = await prisma.brand.findUnique({
      where: { email }
    });

    if (existingBrand) {
      existingUser = existingBrand;
      userTypeFound = 'brand';
      console.log('✅ Found existing brand user:', existingBrand.id);
    } else {
      console.log('❌ No existing brand found');
      // Check as creator
      const existingCreator = await prisma.creator.findUnique({
        where: { email }
      });

      if (existingCreator) {
        existingUser = existingCreator;
        userTypeFound = 'creator';
        console.log('✅ Found existing creator user:', existingCreator.id);
      } else {
        console.log('❌ No existing creator found');
      }
    }

    if (existingUser) {
      // User exists, log them in
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const token = jwt.sign(
        { 
          id: existingUser.id, 
          email: existingUser.email, 
          type: userTypeFound 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userData = {
        id: existingUser.id,
        email: existingUser.email,
        type: userTypeFound,
        ...(userTypeFound === 'brand' ? {
          companyName: existingUser.companyName
        } : {
          userName: existingUser.userName,
          fullName: existingUser.fullName
        })
      };

      console.log('✅ Login successful for existing user:', userData.id);
      res.json({
        message: 'Login successful',
        token,
        user: userData
      });
    } else {
      // User doesn't exist, create new account
      console.log('🆕 Creating new user account, userType:', userType);
      
      if (!userType) {
        console.log('❌ No userType provided for new account');
        return res.status(400).json({ error: 'User type is required for new accounts' });
      }

      if (!process.env.JWT_SECRET) {
        console.log('❌ JWT_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      let newUser;
      let userData;

      if (userType === 'brand') {
        console.log('🏢 Creating new brand account...');
        newUser = await prisma.brand.create({
          data: {
            email,
            companyName: name || 'New Brand',
            contactName: name || 'New Brand Contact',
            password: '', // Empty password for Google OAuth accounts
            isVerified: true
          }
        });

        userData = {
          id: newUser.id,
          email: newUser.email,
          companyName: newUser.companyName,
          type: 'brand'
        };
        console.log('✅ Brand account created:', newUser.id);
      } else {
        console.log('👤 Creating new creator account...');
        newUser = await prisma.creator.create({
          data: {
            email,
            userName: email.split('@')[0], // Use email prefix as username
            fullName: name || 'New Creator',
            password: '', // Empty password for Google OAuth accounts
            isVerified: true
          }
        });

        userData = {
          id: newUser.id,
          email: newUser.email,
          userName: newUser.userName,
          type: 'creator'
        };
        console.log('✅ Creator account created:', newUser.id);
      }

      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          type: userType 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('✅ Account created and login successful:', userData.id);
      res.status(201).json({
        message: 'Account created and login successful',
        token,
        user: userData
      });
    }
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type === 'brand') {
      const brand = await prisma.brand.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          companyName: true,
          contactInfo: true,
          contactName: true,
          logo: true,
          email: true,
          isVerified: true
        }
      });
      res.json(brand);
    } else {
      const creator = await prisma.creator.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          userName: true,
          fullName: true,
          email: true,
          socialInstagram: true,
          socialTwitter: true,
          socialLinkedIn: true,
          socialTikTok: true,
          socialYouTube: true,
          isVerified: true
        }
      });
      res.json(creator);
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login endpoint (no authentication required)
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('🔐 Admin login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ error: 'Admin account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not configured during admin login');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful:', { 
      adminId: admin.id, 
      hasJwtSecret: !!process.env.JWT_SECRET,
      tokenPreview: token.substring(0, 20) + '...'
    });

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        type: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoints (require authentication)
// Get all brands
app.get('/api/admin/brands', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching brands...');
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Admin: Found ${brands.length} brands`);
    res.json(brands);
  } catch (error) {
    console.error('❌ Admin: Error fetching brands:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code
    });
  }
});

// Get all creators
app.get('/api/admin/creators', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching creators...');
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        userName: true,
        fullName: true,
        email: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Admin: Found ${creators.length} creators`);
    res.json(creators);
  } catch (error) {
    console.error('❌ Admin: Error fetching creators:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code
    });
  }
});

// Get all briefs
app.get('/api/admin/briefs', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching briefs...');
    const briefs = await prisma.brief.findMany({
      include: {
        brand: {
          select: {
            companyName: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Admin: Found ${briefs.length} briefs`);
    res.json(briefs);
  } catch (error) {
    console.error('❌ Admin: Error fetching briefs:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code
    });
  }
});

// Get all submissions
app.get('/api/admin/submissions', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching submissions...');
    const submissions = await prisma.submission.findMany({
      include: {
        brief: {
          select: {
            title: true
          }
        },
        creator: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    console.log(`✅ Admin: Found ${submissions.length} submissions`);
    res.json(submissions);
  } catch (error) {
    console.error('❌ Admin: Error fetching submissions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code
    });
  }
});

// Get admin analytics
app.get('/api/admin/analytics', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching analytics...');
    const [
      totalBrands,
      totalCreators,
      totalBriefs,
      totalSubmissions,
      approvedSubmissions
    ] = await Promise.all([
      prisma.brand.count(),
      prisma.creator.count(),
      prisma.brief.count(),
      prisma.submission.count(),
      prisma.submission.findMany({
        where: { status: 'approved' },
        select: { amount: true }
      })
    ]);

    const totalPayouts = approvedSubmissions.reduce((sum, sub) => sum + sub.amount, 0);
    const monthlyRevenue = totalPayouts * 1.3; // 30% platform fee

    console.log('✅ Admin: Analytics calculated successfully');
    res.json({
      totalBrands,
      totalCreators,
      totalBriefs,
      totalSubmissions,
      totalPayouts,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new brief
app.post('/api/briefs', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      reward,
      amountOfWinners,
      location,
      deadline,
      isPrivate,
      additionalFields,
      rewardTiers
    } = req.body;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create briefs' });
    }

    const brief = await prisma.brief.create({
      data: {
        title,
        description,
        requirements,
        reward: parseFloat(reward),
        amountOfWinners: parseInt(amountOfWinners) || 1,
        location: location || '',
        deadline: new Date(deadline),
        isPrivate: isPrivate || false,
        additionalFields: additionalFields ? JSON.stringify(additionalFields) : null,
        status: 'published', // Set status to published by default
        brandId: req.user.id
      }
    });

    // Save reward tiers if provided
    if (rewardTiers && Array.isArray(rewardTiers) && rewardTiers.length > 0) {
      await prisma.publishedAward.create({
        data: {
          briefId: brief.id,
          brandId: req.user.id,
          rewardTiers: JSON.stringify(rewardTiers)
        }
      });
    }

    // Notify brand about brief creation
    try {
      await createNotification(
        req.user.id,
        'brand',
        'Brief Published Successfully! 📢',
        `Your brief "${title}" has been published and is now visible to creators.`,
        'brief'
      );
      console.log('🔔 Brief creation notification sent successfully');
    } catch (error) {
      console.error('🔔 Failed to send brief creation notification:', error);
    }

    res.status(201).json({
      message: 'Brief created successfully',
      id: brief.id,
      brief
    });
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a brief (including publishing)
app.put('/api/briefs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can update briefs' });
    }
    const { id } = req.params;
    const {
      title,
      description,
      requirements,
      reward,
      amountOfWinners,
      location,
      deadline,
      isPrivate,
      additionalFields,
      status // allow status update (e.g., draft -> active)
    } = req.body;

    // Find the brief and check ownership
    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief || brief.brandId !== req.user.id) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Update the brief
    const updatedBrief = await prisma.brief.update({
      where: { id },
      data: {
        title: title !== undefined ? title : brief.title,
        description: description !== undefined ? description : brief.description,
        requirements: requirements !== undefined ? requirements : brief.requirements,
        reward: reward !== undefined ? parseFloat(reward) : brief.reward,

        amountOfWinners: amountOfWinners !== undefined ? parseInt(amountOfWinners) : brief.amountOfWinners,
        location: location !== undefined ? location : brief.location,
        deadline: deadline !== undefined ? new Date(deadline) : brief.deadline,
        isPrivate: isPrivate !== undefined ? isPrivate : brief.isPrivate,
        additionalFields: additionalFields !== undefined ? JSON.stringify(additionalFields) : brief.additionalFields,
        status: status !== undefined ? status : brief.status
      }
    });

    // Notify brand about status changes
    if (status && status !== brief.status) {
      let statusMessage = '';
      switch (status) {
        case 'active':
          statusMessage = `Your brief "${brief.title}" is now active and accepting applications!`;
          break;
        case 'completed':
          statusMessage = `Your brief "${brief.title}" has been marked as completed.`;
          break;
        case 'draft':
          statusMessage = `Your brief "${brief.title}" has been saved as a draft.`;
          break;
        default:
          statusMessage = `Your brief "${brief.title}" status has been updated to ${status}.`;
      }

      await createNotification(
        req.user.id,
        'brand',
        'Brief Status Updated',
        statusMessage,
        'brief'
      );
    }

    res.json({
      message: 'Brief updated successfully',
      brief: updatedBrief
    });
  } catch (error) {
    console.error('Error updating brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a brief
app.delete('/api/briefs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can delete briefs' });
    }

    const { id } = req.params;

    // Find the brief and check ownership
    const brief = await prisma.brief.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });

    if (!brief || brief.brandId !== req.user.id) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Check if brief has submissions
    if (brief._count.submissions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brief with existing submissions. Please review and handle submissions first.' 
      });
    }

    // Delete related records first (award drafts, published awards)
    await prisma.awardDraft.deleteMany({
      where: { briefId: id }
    });

    await prisma.publishedAward.deleteMany({
      where: { briefId: id }
    });

    // Delete the brief
    await prisma.brief.delete({
      where: { id }
    });

    res.json({
      message: 'Brief deleted successfully',
      deletedBriefId: id
    });
  } catch (error) {
    console.error('Error deleting brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get briefs for a brand
app.get('/api/brands/briefs', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const briefs = await prisma.brief.findMany({
      where: { brandId: req.user.id },
      include: {
        submissions: {
          select: {
            id: true,
            creator: {
              select: {
                userName: true,
                fullName: true
              }
            },
            status: true,
            submittedAt: true
          }
        },
        publishedAwards: {
          select: {
            rewardTiers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform briefs to include calculated values
    const transformedBriefs = briefs.map(brief => {
      // Parse reward tiers and calculate total value
      let totalRewardValue = 0;
      let rewardTiers = [];
      
      if (brief.publishedAwards && brief.publishedAwards.length > 0) {
        try {
          rewardTiers = JSON.parse(brief.publishedAwards[0].rewardTiers);
          totalRewardValue = rewardTiers.reduce((total, tier) => {
            return total + (tier.cashAmount || 0) + (tier.creditAmount || 0);
          }, 0);
        } catch (error) {
          console.error('Error parsing reward tiers:', error);
        }
      }

      // Extract country from location
      let country = '';
      if (brief.location) {
        const locationParts = brief.location.split(', ');
        country = locationParts[locationParts.length - 1] || brief.location;
      }

      return {
        ...brief,
        totalRewardValue,
        rewardTiers,
        displayLocation: country, // Show only country on cards
        submissions: brief.submissions || []
      };
    });

    res.json(transformedBriefs);
  } catch (error) {
    console.error('Error fetching brand briefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submissions for a brand
app.get('/api/brands/submissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            fullName: true,
            userName: true
          }
        },
        brief: {
          select: {
            title: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedSubmissions = submissions.map(sub => ({
      id: sub.id,
      creatorName: sub.creator.fullName || sub.creator.userName,
      briefTitle: sub.brief.title,
      status: sub.status,
      submittedAt: sub.submittedAt,
      thumbnail: null // Placeholder for future image support
    }));

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching brand submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed submission information for brands
app.get('/api/brands/submissions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            fullName: true,
            userName: true,
            email: true,
            socialInstagram: true,
            socialTwitter: true,
            socialLinkedIn: true,
            socialTikTok: true,
            socialYouTube: true
          }
        },
        brief: {
          select: {
            title: true,
            description: true,
            requirements: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Notify creator that their submission was viewed by the brand
    await createNotification(
      submission.creatorId,
      'creator',
      'Your Submission Was Viewed 👀',
      `The brand viewed your submission for "${submission.brief.title}". They're reviewing applications!`,
      'application'
    );

    // Get content submission URL
    let contentUrl = null;
    if (submission.files) {
      contentUrl = submission.files; // Now stores a single URL string
    }

    // Parse content if it's stored as JSON (for rejected/approved submissions)
    let content = submission.content;
    if (submission.status === 'rejected' || submission.status === 'approved') {
      try {
        const parsedContent = JSON.parse(submission.content);
        content = parsedContent.originalContent || submission.content;
      } catch (e) {
        // If parsing fails, use the original content
        content = submission.content;
      }
    }

    const detailedSubmission = {
      id: submission.id,
      content: content,
      files: contentUrl,
      amount: submission.amount,
      status: submission.status,
      submittedAt: submission.submittedAt,
      creator: {
        fullName: submission.creator.fullName,
        userName: submission.creator.userName,
        email: submission.creator.email,
        socialInstagram: submission.creator.socialInstagram,
        socialTwitter: submission.creator.socialTwitter,
        socialLinkedIn: submission.creator.socialLinkedIn,
        socialTikTok: submission.creator.socialTikTok,
        socialYouTube: submission.creator.socialYouTube
      },
      brief: {
        title: submission.brief.title,
        description: submission.brief.description,
        requirements: submission.brief.requirements
      }
    };

    res.json(detailedSubmission);
  } catch (error) {
    console.error('Error fetching detailed submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get creators for a brand
app.get('/api/brands/creators', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        userName: true,
        fullName: true,
        email: true,
        socialInstagram: true,
        socialTwitter: true,
        socialLinkedIn: true,
        socialTikTok: true,
        socialYouTube: true,
        isVerified: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(creators);
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rewards for a brand
app.get('/api/brands/rewards', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For now, return empty arrays as rewards table doesn't exist yet
    // In a real app, you would fetch from rewards and rewards_drafts tables
    // const rewards = [];

    // Fetch real drafts from database
    const drafts = await prisma.awardDraft.findMany({
      where: {
        brandId: req.user.id
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        savedAt: 'desc'
      }
    });

    // Fetch published awards from database
    const publishedAwards = await prisma.publishedAward.findMany({
      where: {
        brandId: req.user.id
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Transform drafts to match expected format
    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      type: 'draft',
      briefTitle: draft.brief.title,
      briefId: draft.briefId,
      rewardTiers: JSON.parse(draft.rewardTiers),
      savedAt: draft.savedAt.toISOString(),
      status: 'draft'
    }));

    // Transform published awards to match expected format
    const formattedRewards = publishedAwards.map(award => ({
      id: award.id,
      type: 'published',
      briefTitle: award.brief.title,
      briefId: award.briefId,
      rewardTiers: JSON.parse(award.rewardTiers),
      publishedAt: award.publishedAt.toISOString(),
      status: 'published'
    }));

    res.json({ rewards: formattedRewards, drafts: formattedDrafts });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save awards as draft
app.post('/api/brands/rewards/draft', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can save award drafts' });
    }

    const { briefId, briefTitle, rewardTiers, savedAt } = req.body;

    // Validate that the brief belongs to this brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Check if draft already exists for this brief
    const existingDraft = await prisma.awardDraft.findFirst({
      where: {
        briefId: briefId,
        brandId: req.user.id
      }
    });

    const draftData = {
      briefId: briefId,
      brandId: req.user.id,
      rewardTiers: JSON.stringify(rewardTiers),
      savedAt: new Date(savedAt)
    };

    let draft;
    if (existingDraft) {
      // Update existing draft
      draft = await prisma.awardDraft.update({
        where: { id: existingDraft.id },
        data: draftData
      });
    } else {
      // Create new draft
      draft = await prisma.awardDraft.create({
        data: draftData
      });
    }

    // Notify brand about draft save
    await createNotification(
      req.user.id,
      'brand',
      'Reward Draft Saved 💾',
      `Reward draft for "${briefTitle}" has been saved successfully.`,
      'reward'
    );

    res.json({
      message: 'Awards draft saved successfully',
      draftId: draft.id,
      rewardTiers,
      briefTitle
    });
  } catch (error) {
    console.error('Error saving rewards draft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create awards for a brief
app.post('/api/brands/rewards', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create awards' });
    }

    const { briefId, briefTitle, rewardTiers, submittedAt } = req.body;

    // Validate that the brief belongs to this brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // For now, we'll just log the awards data
    // In a real app, you would save this to a rewards table
    console.log('Awards created:', {
      brandId: req.user.id,
      briefId,
      briefTitle,
      rewardTiers,
      submittedAt
    });

    // Update submissions to mark winners
    for (const tier of rewardTiers) {
      if (tier.winnerId) {
        await prisma.submission.update({
          where: { id: tier.winnerId },
          data: { 
            status: 'winner',
            // Store reward info in content field for now
            content: JSON.stringify({
              originalContent: 'Winner submission',
              rewardTier: tier.name,
              rewardAmount: tier.amount,
              rewardDescription: tier.description,
              awardedAt: new Date().toISOString()
            })
          }
        });
      }
    }

    // Store the published awards
    await prisma.publishedAward.create({
      data: {
        briefId: briefId,
        brandId: req.user.id,
        rewardTiers: JSON.stringify(rewardTiers),
        publishedAt: new Date()
      }
    });

    // Delete the draft since awards have been published
    await prisma.awardDraft.deleteMany({
      where: {
        briefId: briefId,
        brandId: req.user.id
      }
    });

    // Notify brand about rewards published
    await createNotification(
      req.user.id,
      'brand',
      'Rewards Published Successfully! 🎉',
      `Rewards for "${briefTitle}" have been published and winners have been notified.`,
      'reward'
    );

    // Notify winners about their rewards
    for (const tier of rewardTiers) {
      if (tier.winnerId) {
        // Get submission to find creator
        const submission = await prisma.submission.findUnique({
          where: { id: tier.winnerId },
          include: { creator: true }
        });
        
        if (submission) {
          await createNotification(
            submission.creatorId,
            'creator',
            'Congratulations! You Won a Reward! 🏆',
            `You received "${tier.name}" (${tier.description}) for "${briefTitle}"! Check your wallet for the reward.`,
            'reward'
          );
        }
      }
    }

    res.json({
      message: 'Awards created successfully',
      rewardTiers,
      briefTitle
    });
  } catch (error) {
    console.error('Error creating rewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close a brief
app.put('/api/brands/briefs/:id/close', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can close briefs' });
    }

    const { id } = req.params;

    // Validate that the brief belongs to this brand
    const brief = await prisma.brief.findFirst({
      where: {
        id,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Update brief status to closed
    const updatedBrief = await prisma.brief.update({
      where: { id },
      data: { 
        status: 'closed',
        closedAt: new Date()
      }
    });

    console.log('Brief closed:', {
      briefId: id,
      brandId: req.user.id,
      closedAt: updatedBrief.closedAt
    });

    // Notify brand about brief closure
    await createNotification(
      req.user.id,
      'brand',
      'Brief Closed Successfully 🔒',
      `Your brief "${brief.title}" has been closed. No new applications will be accepted.`,
      'brief'
    );

    // Notify all applicants about brief closure
    const submissions = await prisma.submission.findMany({
      where: { 
        briefId: id,
        status: 'pending'
      },
      include: { creator: true }
    });

    for (const submission of submissions) {
      await createNotification(
        submission.creatorId,
        'creator',
        'Brief Application Closed 📋',
        `The brief "${brief.title}" you applied to has been closed. The brand is reviewing applications.`,
        'brief'
      );
    }

    res.json({
      message: 'Brief closed successfully',
      brief: updatedBrief
    });
  } catch (error) {
    console.error('Error closing brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete award draft
app.delete('/api/brands/rewards/draft/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can delete award drafts' });
    }

    const { id } = req.params;

    // Check if draft exists and belongs to this brand
    const draft = await prisma.awardDraft.findFirst({
      where: {
        id: id,
        brandId: req.user.id
      }
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found or access denied' });
    }

    // Delete the draft
    await prisma.awardDraft.delete({
      where: { id: id }
    });

    res.json({ 
      success: true, 
      message: 'Draft deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});



// Get submissions for a specific brief (for winner selection)
app.get('/api/brands/briefs/:id/submissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const submissions = await prisma.submission.findMany({
      where: { 
        briefId: id,
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            fullName: true,
            userName: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedSubmissions = submissions.map(sub => ({
      id: sub.id,
      creatorName: sub.creator.fullName || sub.creator.userName,
      content: sub.content,
      files: sub.files,
      submittedAt: sub.submittedAt,
      amount: sub.amount
    }));

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching brief submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Select winners for a brief
app.post('/api/brands/briefs/select-winners', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { briefId, winners, rewards } = req.body;

    // Verify brief belongs to the brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Create winner rewards
      for (const reward of rewards) {
        await tx.winnerReward.create({
          data: {
            briefId,
            position: reward.position,
            cashAmount: reward.cashAmount || 0,
            creditAmount: reward.creditAmount || 0,
            prizeDescription: reward.prizeDescription || ''
          }
        });
      }

      // Create winners
      for (const winner of winners) {
        const submission = await tx.submission.findUnique({
          where: { id: winner.submissionId },
          include: { creator: true }
        });

        if (submission) {
          const winnerReward = await tx.winnerReward.findFirst({
            where: { briefId, position: winner.position }
          });

          await tx.winner.create({
            data: {
              briefId,
              submissionId: winner.submissionId,
              creatorId: submission.creatorId,
              position: winner.position,
              rewardId: winnerReward?.id
            }
          });

          // Create notification for winner
          await tx.notification.create({
            data: {
              userId: submission.creatorId,
              userType: 'creator',
              title: 'Congratulations! You\'re a Winner! 🏆',
              message: `You've been selected as ${winner.position === 1 ? '1st' : winner.position === 2 ? '2nd' : winner.position === 3 ? '3rd' : `${winner.position}th`} place winner for "${brief.title}"!`,
              type: 'winner'
            }
          });
        }
      }

      // Update brief to mark winners as selected
      await tx.brief.update({
        where: { id: briefId },
        data: { winnersSelected: true }
      });
    });

    // Notify brand about winner selection completion
    await createNotification(
      req.user.id,
      'brand',
      'Winners Selected Successfully! 🎯',
      `Winners have been selected for "${brief.title}". You can now process payments to the winners.`,
      'winner'
    );

    res.json({ message: 'Winners selected successfully' });
  } catch (error) {
    console.error('Error selecting winners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available briefs for creators
app.get('/api/creators/briefs', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const briefs = await prisma.brief.findMany({
      where: { 
        status: 'active',
        isPrivate: false
      },
      include: {
        brand: {
          select: {
            companyName: true
          }
        },
        submissions: {
          select: {
            id: true,
            creator: {
              select: {
                userName: true,
                fullName: true
              }
            },
            status: true,
            submittedAt: true
          }
        },
        winnerRewards: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedBriefs = briefs.map(brief => ({
      id: brief.id,
      title: brief.title,
      brandName: brief.brand.companyName,
      reward: brief.reward,
      amountOfWinners: brief.amountOfWinners,
      location: brief.location,
      deadline: brief.deadline,
      status: brief.status,
      submissions: brief.submissions || [],
      winnerRewards: brief.winnerRewards || []
    }));

    res.json(transformedBriefs);
  } catch (error) {
    console.error('Error fetching available briefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific brief details for creators
app.get('/api/briefs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // First try to find the brief without status restrictions to debug
    console.log(`Fetching brief details for ID: ${id}`);
    let brief = await prisma.brief.findFirst({
      where: { 
        id
      },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            socialInstagram: true,
            socialTwitter: true,
            socialLinkedIn: true,
            socialWebsite: true
          }
        },
        submissions: {
          select: {
            id: true,
            creator: {
              select: {
                userName: true,
                fullName: true
              }
            },
            status: true,
            submittedAt: true
          }
        },
        winnerRewards: {
          orderBy: { position: 'asc' }
        }
      }
    });

    // If brief not found, return error
    if (!brief) {
      console.log(`Brief not found with ID: ${id}`);
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    console.log(`Found brief with status: ${brief.status}, isPrivate: ${brief.isPrivate}`);

    // Check if brief is accessible (not private and has valid status)
    if (brief.isPrivate || !['published', 'active', 'draft'].includes(brief.status)) {
      console.log(`Brief ${id} has status: ${brief.status}, isPrivate: ${brief.isPrivate}`);
      return res.status(404).json({ error: 'Brief not accessible' });
    }

    // Transform data to match frontend expectations
    const transformedBrief = {
      id: brief.id,
      title: brief.title,
      description: brief.description,
      requirements: brief.requirements,
      reward: brief.reward,
      amountOfWinners: brief.amountOfWinners,
      totalRewardsPaid: brief.totalRewardsPaid,
      deadline: brief.deadline,
      status: brief.status,
      isPrivate: brief.isPrivate,
      location: brief.location || '',
      additionalFields: brief.additionalFields ? JSON.parse(brief.additionalFields) : {},
      brand: brief.brand,
      submissions: brief.submissions,
      rewardTiers: brief.winnerRewards
    };

    res.json(transformedBrief);
  } catch (error) {
    console.error('Error fetching brief details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submissions for a creator
app.get('/api/creators/submissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submissions = await prisma.submission.findMany({
      where: { creatorId: req.user.id },
      include: {
        brief: {
          select: {
            title: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedSubmissions = submissions.map(sub => ({
      id: sub.id,
      briefTitle: sub.brief.title,
      status: sub.status,
      submittedAt: sub.submittedAt,
      amount: sub.amount
    }));

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching creator submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new submission
app.post('/api/creators/submissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can submit applications' });
    }

    const { briefId, contentUrl } = req.body;

    // Validate required fields
    if (!briefId || !contentUrl) {
      return res.status(400).json({ error: 'Brief ID and content URL are required' });
    }

    // Check if brief exists and is active
    console.log(`Looking for brief with ID: ${briefId}`);
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        status: {
          in: ['published', 'active'] // Allow submissions to both published and active briefs
        },
        deadline: {
          gte: new Date() // Only allow submissions to active briefs
        }
      }
    });
    
    console.log(`Found brief:`, brief ? { id: brief.id, status: brief.status, deadline: brief.deadline } : 'null');

    if (!brief) {
      // Check if brief exists but has different status or expired deadline
      const briefExists = await prisma.brief.findUnique({
        where: { id: briefId }
      });
      
      if (!briefExists) {
        return res.status(404).json({ error: 'Brief not found' });
      } else if (briefExists.status !== 'published' && briefExists.status !== 'active') {
        return res.status(400).json({ error: 'Brief is not accepting submissions at this time' });
      } else if (new Date(briefExists.deadline) < new Date()) {
        return res.status(400).json({ error: 'Brief deadline has passed' });
      } else {
        return res.status(404).json({ error: 'Brief not found or no longer accepting submissions' });
      }
    }

    // Check if creator has already submitted to this brief
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        briefId: briefId,
        creatorId: req.user.id
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted to this brief' });
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        briefId: briefId,
        creatorId: req.user.id,
        content: '', // Store empty content field
        files: contentUrl, // Store content URL in files field
        amount: 0, // Default amount, will be set when selected as winner
        status: 'pending'
      }
    });

    // Get creator details for notification
    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: { fullName: true, userName: true }
    });

    // Notify the brand owner about the new submission
    try {
      await createNotification(
        brief.brandId, // brand's user ID
        'brand',
        'New Application Received',
        `${creator?.fullName || creator?.userName || 'A creator'} submitted an application to your brief "${brief.title}"`,
        'application'
      );
      console.log('🔔 Brand notification sent for new submission');
    } catch (error) {
      console.error('🔔 Failed to send brand notification for submission:', error);
    }

    // Notify the creator about successful submission
    try {
      await createNotification(
        req.user.id,
        'creator',
        'Application Submitted Successfully! 📝',
        `Your application for "${brief.title}" has been submitted successfully. The brand will review it soon.`,
        'application'
      );
      console.log('🔔 Creator notification sent for submission');
    } catch (error) {
      console.error('🔔 Failed to send creator notification for submission:', error);
    }

    res.status(201).json({
      id: submission.id,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific submission details for editing
app.get('/api/creators/submissions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        creatorId: req.user.id
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            deadline: true,
            brand: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    res.json({
      id: submission.id,
      content: submission.content,
      files: submission.files, // This will be the content URL
      amount: submission.amount,
      status: submission.status,
      submittedAt: submission.submittedAt,
      brief: submission.brief ? {
        id: submission.brief.id,
        title: submission.brief.title,
        brandName: submission.brief.brand.companyName,
        deadline: submission.brief.deadline
      } : null
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update submission
app.put('/api/creators/submissions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can update submissions' });
    }

    const { id } = req.params;
    const { contentUrl } = req.body;

    console.log('📝 Updating submission:', { submissionId: id, contentUrl });

    // Check if submission exists and belongs to the creator
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        id,
        creatorId: req.user.id
      }
    });

    if (!existingSubmission) {
      console.log('❌ Submission not found or access denied:', { submissionId: id, creatorId: req.user.id });
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Check if submission can be edited (not approved or rejected)
    if (existingSubmission.status === 'approved' || existingSubmission.status === 'rejected') {
      console.log('❌ Cannot edit submission with status:', existingSubmission.status);
      return res.status(400).json({ error: 'Cannot edit approved or rejected submissions' });
    }

    // Validate URL format
    if (!contentUrl || !isValidUrl(contentUrl)) {
      console.log('❌ Invalid content URL:', contentUrl);
      return res.status(400).json({ error: 'Please provide a valid content submission URL' });
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        content: '', // Empty content since we removed the proposal field
        files: contentUrl, // Store the URL in the files field
        updatedAt: new Date()
      }
    });

    console.log('✅ Submission updated successfully:', { submissionId: id });
    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('❌ Error updating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete submission
app.delete('/api/creators/submissions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can delete submissions' });
    }

    const { id } = req.params;

    console.log('🗑️ Deleting submission:', { submissionId: id, creatorId: req.user.id });

    // Check if submission exists and belongs to the creator
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        id,
        creatorId: req.user.id
      }
    });

    if (!existingSubmission) {
      console.log('❌ Submission not found or access denied:', { submissionId: id, creatorId: req.user.id });
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Check if submission can be deleted (not approved or rejected)
    if (existingSubmission.status === 'approved' || existingSubmission.status === 'rejected') {
      console.log('❌ Cannot delete submission with status:', existingSubmission.status);
      return res.status(400).json({ error: 'Cannot delete approved or rejected submissions' });
    }

    // Delete submission
    await prisma.submission.delete({
      where: { id }
    });

    console.log('✅ Submission deleted successfully:', { submissionId: id });
    res.json({
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get creator contact details for brands (when they have submissions)
app.get('/api/brands/creators/:creatorId/contact', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can view creator contact details' });
    }

    const { creatorId } = req.params;

    // Check if the brand has any submissions from this creator
    const hasSubmissions = await prisma.submission.findFirst({
      where: {
        creatorId,
        brief: {
          brandId: req.user.id
        }
      }
    });

    if (!hasSubmissions) {
      return res.status(403).json({ error: 'No submissions found from this creator' });
    }

    // Get creator contact details
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        fullName: true,
        userName: true,
        email: true,
        socialInstagram: true,
        socialTwitter: true,
        socialLinkedIn: true,
        socialTikTok: true,
        socialYouTube: true,

      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json(creator);
  } catch (error) {
    console.error('Error fetching creator contact details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get earnings for a creator
app.get('/api/creators/earnings', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const earnings = await prisma.submission.findMany({
      where: { 
        creatorId: req.user.id,
        status: 'approved'
      },
      select: {
        id: true,
        amount: true,
        status: true,
        submittedAt: true,
        brief: {
          select: {
            title: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedEarnings = earnings.map(earning => ({
      id: earning.id,
      briefTitle: earning.brief.title,
      amount: earning.amount,
      status: 'paid', // Assuming approved submissions are paid
      paidAt: earning.submittedAt // Using submittedAt as paidAt for now
    }));

    res.json(transformedEarnings);
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to a brief (creator submits application)
app.post('/api/briefs/:id/apply', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Brief application received:', {
      briefId: req.params.id,
      userId: req.user.id,
      userType: req.user.type,
      body: req.body
    });

    if (req.user.type !== 'creator') {
      console.log('❌ Non-creator attempting to apply:', req.user.type);
      return res.status(403).json({ error: 'Only creators can apply to briefs' });
    }

    const { id } = req.params;
    const { contentUrl, amount } = req.body;

    console.log('🔍 Validating application data:', { contentUrl, amount });

    // Check if brief exists and is active
    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief || brief.status !== 'active') {
      console.log('❌ Brief not found or inactive:', { briefId: id, briefStatus: brief?.status });
      return res.status(404).json({ error: 'Brief not found or not available for applications' });
    }

    // Check if creator has already applied
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        briefId: id,
        creatorId: req.user.id
      }
    });

    if (existingSubmission) {
      console.log('❌ Creator already applied:', { briefId: id, creatorId: req.user.id });
      return res.status(400).json({ error: 'You have already applied to this brief' });
    }

    // Validate URL format
    if (!contentUrl || !isValidUrl(contentUrl)) {
      console.log('❌ Invalid content URL:', contentUrl);
      return res.status(400).json({ error: 'Please provide a valid content submission URL' });
    }

    console.log('✅ Creating submission...');
    // Create submission
    const submission = await prisma.submission.create({
      data: {
        briefId: id,
        creatorId: req.user.id,
        content: '', // Empty content since we removed the proposal field
        files: contentUrl, // Store the URL in the files field
        amount: parseFloat(amount),
        status: 'pending'
      }
    });

    console.log('✅ Application submitted successfully:', { submissionId: submission.id });
    res.status(201).json({
      message: 'Application submitted successfully',
      submission
    });
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite creator to brief
app.post('/api/brands/invite-creator', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can invite creators' });
    }

    const { creatorId, briefId } = req.body;

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if brief exists (if briefId is provided)
    let brief = null;
    if (briefId) {
      brief = await prisma.brief.findFirst({
        where: { 
          id: briefId,
          brandId: req.user.id 
        }
      });

      if (!brief) {
        return res.status(404).json({ error: 'Brief not found or access denied' });
      }
    }

    // Get brand info for notification
    const brand = await prisma.brand.findUnique({
      where: { id: req.user.id },
      select: { companyName: true }
    });

    // Create notification for the creator
    const briefMessage = briefId && brief ? 
      ` for the brief "${brief.title}"` : 
      ' to collaborate on future projects';
    
    await createNotification(
      creatorId,
      'creator',
      'You Received an Invitation! 📧',
      `${brand?.companyName} has invited you${briefMessage}. Check your opportunities!`,
      'invitation'
    );

    // Notify brand about invitation sent
    await createNotification(
      req.user.id,
      'brand',
      'Invitation Sent Successfully ✉️',
      `Invitation sent to ${creator.fullName} (${creator.userName})${briefMessage}.`,
      'invitation'
    );

    res.json({
      message: 'Invitation sent successfully',
      creator: {
        id: creator.id,
        fullName: creator.fullName,
        userName: creator.userName
      },
      briefId: briefId || null
    });
  } catch (error) {
    console.error('Error inviting creator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a submission
app.put('/api/brands/submissions/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can reject submissions' });
    }

    const { id } = req.params;
    const { reason, rejectedAt, briefTitle } = req.body;

    // Check if submission exists and belongs to this brand
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            fullName: true,
            userName: true,
            email: true
          }
        },
        brief: {
          select: {
            title: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Update submission status to rejected
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: 'rejected',
        // Store rejection details in a JSON field or create a separate table
        // For now, we'll use the content field to store rejection info
        content: JSON.stringify({
          originalContent: submission.content,
          rejectionReason: reason,
          rejectedAt: rejectedAt || new Date().toISOString(),
          briefTitle: briefTitle || submission.brief.title
        })
      }
    });

    // Notify the creator about the rejection
    const rejectionMessage = reason 
      ? `Your application for "${submission.brief.title}" was not selected. Reason: ${reason}`
      : `Your application for "${submission.brief.title}" was not selected at this time.`;

    await createNotification(
      submission.creatorId,
      'creator',
      'Application Update',
      rejectionMessage,
      'application'
    );

    console.log(`Submission ${id} rejected by brand ${req.user.id}. Creator: ${submission.creator.fullName}, Reason: ${reason}`);

    res.json({
      message: 'Submission rejected successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a submission (add to shortlist)
app.put('/api/brands/submissions/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can approve submissions' });
    }

    const { id } = req.params;
    const { approvedAt, briefTitle } = req.body;

    // Check if submission exists and belongs to this brand
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            fullName: true,
            userName: true,
            email: true
          }
        },
        brief: {
          select: {
            title: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Update submission status to approved
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: 'approved',
        // Store approval details
        content: JSON.stringify({
          originalContent: submission.content,
          approvedAt: approvedAt || new Date().toISOString(),
          briefTitle: briefTitle || submission.brief.title
        })
      }
    });

    // Notify the creator about the approval
    await createNotification(
      submission.creatorId,
      'creator',
      'Application Approved! 🎉',
      `Your application for "${submission.brief.title}" has been approved and added to the shortlist!`,
      'application'
    );

    console.log(`Submission ${id} approved by brand ${req.user.id}. Creator: ${submission.creator.fullName}`);

    res.json({
      message: 'Submission approved and added to shortlist successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create uploads directory if it doesn't exist (only in non-serverless environments)
const fs = require('fs');
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !fs.existsSync('uploads')) {
  try {
    fs.mkdirSync('uploads');
    console.log('✅ Uploads directory created');
  } catch (error) {
    console.warn('⚠️ Could not create uploads directory:', error.message);
  }
}

// ===== PAYMENT AND WALLET SYSTEM =====

// Get creator wallet
app.get('/api/creators/wallet', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      let wallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: req.user.id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await prisma.creatorWallet.create({
          data: {
            creatorId: req.user.id,
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0
          },
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        });
      }

      res.json(wallet);
    } catch (tableError) {
      // If table doesn't exist, return a default wallet structure
      console.log('CreatorWallet table not available, returning default structure');
      res.json({
        id: 'temp-wallet',
        creatorId: req.user.id,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        transactions: []
      });
    }
  } catch (error) {
    console.error('Error fetching creator wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator withdraw funds
app.post('/api/creators/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
      let wallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: req.user.id }
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (wallet.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Process withdrawal in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update wallet balance
        const updatedWallet = await tx.creatorWallet.update({
          where: { creatorId: req.user.id },
          data: {
            balance: { decrement: amount },
            totalWithdrawn: { increment: amount }
          }
        });

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'withdrawal',
            amount: amount,
            description: `Withdrawal via ${paymentMethod}`,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance
          }
        });

        return { wallet: updatedWallet };
      });

      // Notify creator about withdrawal
      await createNotification(
        req.user.id,
        'creator',
        'Withdrawal Processed 💸',
        `Your withdrawal of $${amount} has been processed successfully.`,
        'wallet'
      );

      res.json({ message: 'Withdrawal processed successfully', data: result });
    } catch (tableError) {
      // If tables don't exist, simulate successful withdrawal
      console.log('Wallet tables not available, simulating withdrawal');
      res.json({ 
        message: 'Withdrawal processed successfully (simulated)', 
        data: { wallet: { balance: 0, totalWithdrawn: amount } }
      });
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brand wallet
app.get('/api/brands/wallet', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if BrandWallet table exists
    try {
      let wallet = await prisma.brandWallet.findUnique({
        where: { brandId: req.user.id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await prisma.brandWallet.create({
          data: {
            brandId: req.user.id,
            balance: 0,
            totalSpent: 0,
            totalDeposited: 0
          },
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        });
      }

      res.json(wallet);
    } catch (tableError) {
      // If table doesn't exist, return a default wallet structure
      console.log('BrandWallet table not available, returning default structure');
      res.json({
        id: 'temp-wallet',
        brandId: req.user.id,
        balance: 0,
        totalSpent: 0,
        totalDeposited: 0,
        transactions: []
      });
    }
  } catch (error) {
    console.error('Error fetching brand wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Brand wallet top-up with Stripe
app.post('/api/brands/wallet/top-up', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create pending transaction record first
    let wallet = await prisma.brandWallet.findUnique({
      where: { brandId: req.user.id }
    });

    if (!wallet) {
      wallet = await prisma.brandWallet.create({
        data: {
          brandId: req.user.id,
          balance: 0,
          totalSpent: 0,
          totalDeposited: 0
        }
      });
    }

    // Check if Stripe is configured and available
    if (!stripe) {
      // Fallback: Direct wallet top-up without Stripe
      const result = await prisma.$transaction(async (tx) => {
        // Update wallet balance directly
        const updatedWallet = await tx.brandWallet.update({
          where: { brandId: req.user.id },
          data: {
            balance: { increment: amount },
            totalDeposited: { increment: amount }
          }
        });

        // Create completed transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'deposit',
            amount: amount,
            description: `Wallet top-up (direct)`,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            referenceId: `direct-${Date.now()}`
          }
        });

        return updatedWallet;
      });

      // Notify brand about successful top-up
      await createNotification(
        req.user.id,
        'brand',
        'Wallet Top-Up Successful! 💰',
        `Your wallet has been topped up with $${amount}. New balance: $${wallet.balance + amount}`,
        'wallet'
      );

      return res.json({
        message: 'Wallet topped up successfully (direct)',
        data: result
      });
    }

    try {
      // Create Stripe payment intent for wallet top-up
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          type: 'wallet_top_up',
          brandId: req.user.id,
          amount: amount.toString()
        }
      });

      // Create pending transaction
      await prisma.brandWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'deposit',
          amount: amount,
          description: `Wallet top-up via Stripe`,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          referenceId: paymentIntent.id
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (stripeError) {
      console.error('Stripe error, falling back to direct top-up:', stripeError);
      
      // Fallback: Direct wallet top-up if Stripe fails
      const result = await prisma.$transaction(async (tx) => {
        // Update wallet balance directly
        const updatedWallet = await tx.brandWallet.update({
          where: { brandId: req.user.id },
          data: {
            balance: { increment: amount },
            totalDeposited: { increment: amount }
          }
        });

        // Create completed transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'deposit',
            amount: amount,
            description: `Wallet top-up (Stripe fallback)`,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            referenceId: `fallback-${Date.now()}`
          }
        });

        return updatedWallet;
      });

      // Notify brand about successful top-up
      await createNotification(
        req.user.id,
        'brand',
        'Wallet Top-Up Successful! 💰',
        `Your wallet has been topped up with $${amount}. New balance: $${wallet.balance + amount}`,
        'wallet'
      );

      res.json({
        message: 'Wallet topped up successfully (fallback)',
        data: result
      });
    }
  } catch (error) {
    console.error('Error creating wallet top-up:', error);
    res.status(500).json({ error: 'Failed to create wallet top-up' });
  }
});

// Brand deposit funds (legacy endpoint)
app.post('/api/brands/wallet/deposit', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
      let wallet = await prisma.brandWallet.findUnique({
        where: { brandId: req.user.id }
      });

      if (!wallet) {
        wallet = await prisma.brandWallet.create({
          data: {
            brandId: req.user.id,
            balance: 0,
            totalSpent: 0,
            totalDeposited: 0
          }
        });
      }

      // Process deposit in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update wallet balance
        const updatedWallet = await tx.brandWallet.update({
          where: { brandId: req.user.id },
          data: {
            balance: { increment: amount },
            totalDeposited: { increment: amount }
          }
        });

        // Create transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'deposit',
            amount: amount,
            description: `Deposit via ${paymentMethod}`,
            status: 'completed',
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance
          }
        });

        return updatedWallet;
      });

      // Notify brand about deposit
      await createNotification(
        req.user.id,
        'brand',
        'Deposit Successful 💰',
        `Your deposit of $${amount} has been added to your wallet balance.`,
        'wallet'
      );

      res.json({ message: 'Deposit processed successfully', data: result });
    } catch (tableError) {
      // If tables don't exist, simulate successful deposit
      console.log('Wallet tables not available, simulating deposit');
      res.json({ 
        message: 'Deposit processed successfully (simulated)', 
        data: { balance: amount, totalDeposited: amount }
      });
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brand winners for payment management
app.get('/api/brands/winners', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const winners = await prisma.winner.findMany({
        where: {
          brief: { brandId: req.user.id }
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              userName: true,
              email: true
            }
          },
          reward: true,
          brief: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { selectedAt: 'desc' }
      });

      res.json(winners);
    } catch (tableError) {
      // If Payment table doesn't exist, return winners without payment info
      console.log('Payment table not available, returning winners without payment data');
      const winners = await prisma.winner.findMany({
        where: {
          brief: { brandId: req.user.id }
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              userName: true,
              email: true
            }
          },
          reward: true,
          brief: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { selectedAt: 'desc' }
      });

      res.json(winners);
    }
  } catch (error) {
    console.error('Error fetching brand winners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process payment to winner
app.post('/api/brands/payments/process', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { winnerId, paymentMethod, amount } = req.body;

    const winner = await prisma.winner.findFirst({
      where: {
        id: winnerId,
        brief: { brandId: req.user.id }
      },
      include: {
        creator: true,
        reward: true
      }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    try {
      // Check if payment already exists
      const existingPayment = await prisma.payment.findUnique({
        where: { winnerId: winner.id }
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'Payment already processed for this winner' });
      }

      // Process payment in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            winnerId: winner.id,
            amount: amount,
            paymentMethod: paymentMethod,
            status: 'processing'
          }
        });

        // If payment method is credits, credit the creator's wallet
        if (paymentMethod === 'credits') {
          let creatorWallet = await tx.creatorWallet.findUnique({
            where: { creatorId: winner.creatorId }
          });

          if (!creatorWallet) {
            creatorWallet = await tx.creatorWallet.create({
              data: {
                creatorId: winner.creatorId,
                balance: 0,
                totalEarned: 0,
                totalWithdrawn: 0
              }
            });
          }

          // Update creator wallet
          const updatedCreatorWallet = await tx.creatorWallet.update({
            where: { creatorId: winner.creatorId },
            data: {
              balance: { increment: amount },
              totalEarned: { increment: amount }
            }
          });

          // Create transaction record
          await tx.walletTransaction.create({
            data: {
              walletId: creatorWallet.id,
              type: 'credit',
              amount: amount,
              description: `Payment for winning ${winner.brief.title}`,
              referenceId: payment.id,
              balanceBefore: creatorWallet.balance,
              balanceAfter: updatedCreatorWallet.balance
            }
          });

          // Update payment status
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'completed', paidAt: new Date() }
          });
        }

        return payment;
      });

      res.json({ message: 'Payment processed successfully', data: result });
    } catch (tableError) {
      // If payment tables don't exist, simulate successful payment
      console.log('Payment tables not available, simulating payment');
      res.json({ 
        message: 'Payment processed successfully (simulated)', 
        data: { 
          id: 'temp-payment',
          winnerId: winner.id,
          amount: amount,
          paymentMethod: paymentMethod,
          status: 'completed'
        }
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== STRIPE PAYMENT ROUTES ====================

// Create payment intent for brand to pay creator
app.post('/api/payments/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { winnerId, amount, rewardType } = req.body;
    
    // Verify the winner exists and belongs to the authenticated brand
    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        brief: {
          include: { brand: true }
        },
        creator: true
      }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    // Verify the authenticated user is the brand owner
    if (winner.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { winnerId }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this winner' });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(400).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        winnerId,
        briefId: winner.briefId,
        creatorId: winner.creatorId,
        rewardType
      }
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        winnerId,
        amount,
        paymentMethod: 'stripe',
        rewardType,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Process payment from wallet balance
app.post('/api/payments/process-wallet-payment', authenticateToken, async (req, res) => {
  try {
    const { winnerId, amount } = req.body;
    
    // Verify the winner exists and belongs to the authenticated brand
    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        brief: {
          include: { brand: true }
        },
        creator: true
      }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    // Verify the authenticated user is the brand owner
    if (winner.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { winnerId }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this winner' });
    }

    // Check brand wallet balance
    const brandWallet = await prisma.brandWallet.findUnique({
      where: { brandId: req.user.id }
    });

    if (!brandWallet || brandWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Process the payment from wallet
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          winnerId,
          amount: amount,
          paymentMethod: 'wallet',
          rewardType: 'cash',
          status: 'completed',
          paidAt: new Date()
        }
      });

      // Update brand wallet balance
      const updatedBrandWallet = await tx.brandWallet.update({
        where: { brandId: req.user.id },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount }
        }
      });

              // Create wallet transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: brandWallet.id,
            type: 'payment',
            amount: amount,
            description: `Payment to ${winner.creator.fullName} for "${winner.brief.title}"`,
            balanceBefore: brandWallet.balance,
            balanceAfter: updatedBrandWallet.balance,
            referenceId: payment.id
          }
        });

      // Update creator wallet (if exists)
      let creatorWallet = await tx.creatorWallet.findUnique({
        where: { creatorId: winner.creatorId }
      });

      if (!creatorWallet) {
        creatorWallet = await tx.creatorWallet.create({
          data: {
            creatorId: winner.creatorId,
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0
          }
        });
      }

      // Update creator wallet
      const updatedCreatorWallet = await tx.creatorWallet.update({
        where: { creatorId: winner.creatorId },
        data: {
          balance: { increment: amount },
          totalEarned: { increment: amount }
        }
      });

              // Create creator wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: creatorWallet.id,
            type: 'credit',
            amount: amount,
            description: `Payment received for "${winner.brief.title}"`,
            balanceBefore: creatorWallet.balance,
            balanceAfter: updatedCreatorWallet.balance,
            referenceId: payment.id
          }
        });

      // Update winner reward
      if (winner.rewardId) {
        await tx.winnerReward.update({
          where: { id: winner.rewardId },
          data: {
            isPaid: true,
            paidAt: new Date()
          }
        });
      }

      // Update brief total rewards paid
      await tx.brief.update({
        where: { id: winner.briefId },
        data: {
          totalRewardsPaid: {
            increment: amount
          }
        }
      });

      return payment;
    });

    // Notify creator about payment received
    await createNotification(
      winner.creatorId,
      'creator',
      'Payment Received! 💰',
      `You received $${amount} for winning "${winner.brief.title}"`,
      'payment'
    );

    // Notify brand about payment sent
    await createNotification(
      winner.brief.brandId,
      'brand',
      'Payment Sent Successfully',
      `Payment of $${amount} sent to ${winner.creator.fullName} for "${winner.brief.title}"`,
      'payment'
    );

    res.json({ 
      message: 'Payment processed successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Process payment for credits or prizes (no Stripe needed)
app.post('/api/payments/process-reward', authenticateToken, async (req, res) => {
  try {
    const { winnerId, rewardType, amount } = req.body;
    
    // Verify the winner exists and belongs to the authenticated brand
    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        brief: {
          include: { brand: true }
        },
        creator: true
      }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    // Verify the authenticated user is the brand owner
    if (winner.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { winnerId }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this winner' });
    }

    // Process the reward based on type
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          winnerId,
          amount: amount || 0,
          paymentMethod: rewardType,
          rewardType,
          status: 'completed',
          paidAt: new Date()
        }
      });

      // Handle credits
      if (rewardType === 'credits' && amount > 0) {
        // Get or create creator wallet
        let creatorWallet = await tx.creatorWallet.findUnique({
          where: { creatorId: winner.creatorId }
        });

        if (!creatorWallet) {
          creatorWallet = await tx.creatorWallet.create({
            data: {
              creatorId: winner.creatorId,
              balance: 0,
              totalEarned: 0
            }
          });
        }

        // Update creator wallet
        const updatedCreatorWallet = await tx.creatorWallet.update({
          where: { id: creatorWallet.id },
          data: {
            balance: creatorWallet.balance + amount,
            totalEarned: creatorWallet.totalEarned + amount
          }
        });

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: creatorWallet.id,
            type: 'credit',
            amount: amount,
            description: `Credits earned for winning ${winner.brief.title}`,
            referenceId: payment.id,
            balanceBefore: creatorWallet.balance,
            balanceAfter: updatedCreatorWallet.balance
          }
        });
      }

      // Update winner reward
      await tx.winnerReward.update({
        where: { id: winner.rewardId },
        data: {
          isPaid: true,
          paidAt: new Date()
        }
      });

      // Update brief total rewards paid
      await tx.brief.update({
        where: { id: winner.briefId },
        data: {
          totalRewardsPaid: {
            increment: amount || 0
          }
        }
      });

      return payment;
    });

    // Notify creator about payment received
    await createNotification(
      winner.creatorId,
      'creator',
      'Payment Received! 💰',
      `You received ${rewardType === 'credits' ? `${amount} credits` : rewardType} for winning "${winner.brief.title}"`,
      'payment'
    );

    // Notify brand about payment sent
    await createNotification(
      winner.brief.brandId,
      'brand',
      'Payment Sent Successfully',
      `Payment of ${rewardType === 'credits' ? `${amount} credits` : rewardType} sent to ${winner.creator.fullName} for "${winner.brief.title}"`,
      'payment'
    );

    res.json({ 
      message: 'Reward processed successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error processing reward:', error);
    res.status(500).json({ error: 'Failed to process reward' });
  }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Check if this is a wallet top-up
        if (paymentIntent.metadata && paymentIntent.metadata.type === 'wallet_top_up') {
          const brandId = paymentIntent.metadata.brandId;
          const amount = parseFloat(paymentIntent.metadata.amount);

          // Update wallet balance
          const wallet = await prisma.brandWallet.findUnique({
            where: { brandId: brandId }
          });

          if (wallet) {
            await prisma.$transaction(async (tx) => {
              // Update wallet balance
              const updatedWallet = await tx.brandWallet.update({
                where: { brandId: brandId },
                data: {
                  balance: { increment: amount },
                  totalDeposited: { increment: amount }
                }
              });

              // Update transaction balance
              await tx.brandWalletTransaction.updateMany({
                where: { 
                  walletId: wallet.id,
                  referenceId: paymentIntent.id
                },
                data: {
                  balanceAfter: updatedWallet.balance
                }
              });
            });

            // Notify brand about successful top-up
            await createNotification(
              brandId,
              'brand',
              'Wallet Top-Up Successful! 💰',
              `Your wallet has been topped up with $${amount}. New balance: $${wallet.balance + amount}`,
              'wallet'
            );
          }
        } else {
          // Handle regular payment to winners
          const payment = await prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntent.id },
            include: { 
              winner: {
                include: {
                  brief: true,
                  creator: true
                }
              }
            }
          });

          if (payment) {
            await prisma.$transaction(async (tx) => {
              // Update payment status
              await tx.payment.update({
                where: { stripePaymentIntentId: paymentIntent.id },
                data: {
                  status: 'completed',
                  paidAt: new Date()
                }
              });

              // Update winner reward
              if (payment.winner.rewardId) {
                await tx.winnerReward.update({
                  where: { id: payment.winner.rewardId },
                  data: {
                    isPaid: true,
                    paidAt: new Date()
                  }
                });
              }

              // Update brief total rewards paid
              await tx.brief.update({
                where: { id: payment.winner.briefId },
                data: {
                  totalRewardsPaid: {
                    increment: payment.amount
                  }
                }
              });

              // Update brand wallet (deduct from balance)
              const brandWallet = await tx.brandWallet.findUnique({
                where: { brandId: payment.winner.brief.brandId }
              });

              if (brandWallet) {
                await tx.brandWallet.update({
                  where: { brandId: payment.winner.brief.brandId },
                  data: {
                    balance: { decrement: payment.amount },
                    totalSpent: { increment: payment.amount }
                  }
                });

                        // Create wallet transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: brandWallet.id,
            type: 'payment',
            amount: payment.amount,
            description: `Payment to ${payment.winner.creator.fullName} for "${payment.winner.brief.title}"`,
            balanceBefore: brandWallet.balance,
            balanceAfter: brandWallet.balance - payment.amount,
            referenceId: payment.id
          }
        });
              }
            });

            // Notify creator about successful payment
            await createNotification(
              payment.winner.creatorId,
              'creator',
              'Payment Received! 💰',
              `You received $${payment.amount} for winning "${payment.winner.brief.title}"`,
              'payment'
            );

            // Notify brand about successful payment
            await createNotification(
              payment.winner.brief.brandId,
              'brand',
              'Payment Completed Successfully',
              `Payment of $${payment.amount} sent to ${payment.winner.creator.fullName} for "${payment.winner.brief.title}"`,
              'payment'
            );
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object;
        
        const payment = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: failedPaymentIntent.id },
          include: { 
            winner: {
              include: {
                brief: { include: { brand: true } },
                creator: true
              }
            }
          }
        });

        await prisma.payment.update({
          where: { stripePaymentIntentId: failedPaymentIntent.id },
          data: { status: 'failed' }
        });

        if (payment) {
          // Notify brand about failed payment
          await createNotification(
            payment.winner.brief.brandId,
            'brand',
            'Payment Failed ❌',
            `Payment of $${payment.amount} to ${payment.winner.creator.fullName} for "${payment.winner.brief.title}" failed. Please try again.`,
            'payment'
          );

          // Notify creator about failed payment
          await createNotification(
            payment.winner.creatorId,
            'creator',
            'Payment Processing Issue',
            `Payment for "${payment.winner.brief.title}" encountered an issue. The brand will retry the payment.`,
            'payment'
          );
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment status
app.get('/api/payments/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        winner: {
          include: {
            brief: {
              include: { brand: true }
            },
            creator: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify the authenticated user is the brand owner
    if (payment.winner.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Get winners for brand
app.get('/api/brands/winners', authenticateToken, async (req, res) => {
  try {
    const winners = await prisma.winner.findMany({
      where: {
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            userName: true,
            email: true
          }
        },
        brief: {
          select: {
            id: true,
            title: true,
            totalRewardsPaid: true
          }
        },
        reward: {
          select: {
            id: true,
            cashAmount: true,
            creditAmount: true,
            prizeDescription: true,
            isPaid: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            rewardType: true
          }
        }
      },
      orderBy: {
        selectedAt: 'desc'
      }
    });

    res.json({ winners });
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
});



// ==================== NOTIFICATION ROUTES ====================

// Get notifications for user
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    console.log(`🔔 Fetching notifications for user: ${req.user.id}, type: ${req.user.type}`);
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        userType: req.user.type // 'brand' or 'creator'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 most recent notifications
    });

    console.log(`🔔 Found ${notifications.length} notifications for user ${req.user.id}`);
    console.log('🔔 Notifications:', notifications.map(n => ({ id: n.id, title: n.title, type: n.type, isRead: n.isRead })));

    res.json({ notifications: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
      where: {
        id: id,
        userId: req.user.id
      },
      data: {
        isRead: true
      }
    });

    res.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.post('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        userType: req.user.type,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create notification (internal use)
const createNotification = async (userId, userType, title, message, type) => {
  try {
    console.log(`🔔 Creating notification:`, { userId, userType, title, message, type });
    
    // Validate inputs
    if (!userId || !userType || !title || !message || !type) {
      console.error('🔔 Missing required fields for notification:', { userId, userType, title, message, type });
      throw new Error('Missing required fields for notification');
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        userType,
        title,
        message,
        type
      }
    });
    
    console.log(`🔔 Notification created successfully:`, notification.id);
    return notification;
  } catch (error) {
    console.error('🔔 Error creating notification:', error);
    console.error('🔔 Error details:', { userId, userType, title, message, type });
    throw error;
  }
};

// Test endpoint to create a notification (for debugging)
app.post('/api/test-notification', authenticateToken, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    
    console.log('🔔 Test notification request received:', { userId: req.user.id, userType: req.user.type, title, message, type });
    
    const notification = await createNotification(
      req.user.id,
      req.user.type,
      title || 'Test Notification',
      message || 'This is a test notification',
      type || 'application'
    );
    
    console.log('🔔 Test notification created successfully:', notification.id);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Failed to create test notification', details: error.message });
  }
});

// Test endpoint to check notification count
app.get('/api/test-notifications-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        userType: req.user.type
      }
    });
    
    console.log(`🔔 User ${req.user.id} has ${count} notifications`);
    res.json({ count, userId: req.user.id, userType: req.user.type });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ error: 'Failed to count notifications', details: error.message });
  }
});

// Test endpoint to verify proxy is working
app.get('/api/test-proxy', (req, res) => {
  console.log('🔔 Proxy test endpoint hit!');
  res.json({ 
    message: 'Proxy is working!', 
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });
});

// ==================== END NOTIFICATION ROUTES ====================

// ==================== PUBLIC ROUTES ====================

// Get public brand briefs (no authentication required)
app.get('/api/public/brands/:brandId/briefs', async (req, res) => {
  try {
    const { brandId } = req.params;

    // Find the brand first to get company name
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        companyName: true,
        logo: true,
        socialInstagram: true,
        socialTwitter: true,
        socialLinkedIn: true,
        socialWebsite: true
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Get active briefs for this brand
    const briefs = await prisma.brief.findMany({
      where: { 
        brandId: brandId,
        status: 'active',
        isPrivate: false
      },
      include: {
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true
          }
        },
        publishedAwards: {
          select: {
            rewardTiers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform briefs to include calculated values
    const transformedBriefs = briefs.map(brief => {
      // Parse reward tiers and calculate total value
      let totalRewardValue = 0;
      let rewardTiers = [];
      
      if (brief.publishedAwards && brief.publishedAwards.length > 0) {
        try {
          rewardTiers = JSON.parse(brief.publishedAwards[0].rewardTiers);
          totalRewardValue = rewardTiers.reduce((total, tier) => {
            return total + (tier.cashAmount || 0) + (tier.creditAmount || 0);
          }, 0);
        } catch (error) {
          console.error('Error parsing reward tiers:', error);
        }
      }

      return {
        id: brief.id,
        title: brief.title,
        description: brief.description,
        requirements: brief.requirements,
        reward: brief.reward,
        amountOfWinners: brief.amountOfWinners,
        deadline: brief.deadline,
        status: brief.status,
        totalRewardValue,
        rewardTiers,
        submissionsCount: brief.submissions.length,
        createdAt: brief.createdAt
      };
    });

    res.json({
      brand: {
        id: brand.id,
        companyName: brand.companyName,
        logo: brand.logo,
        socialInstagram: brand.socialInstagram,
        socialTwitter: brand.socialTwitter,
        socialLinkedIn: brand.socialLinkedIn,
        socialWebsite: brand.socialWebsite
      },
      briefs: transformedBriefs
    });
  } catch (error) {
    console.error('Error fetching public brand briefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== END PUBLIC ROUTES ====================

// ==================== TEST ENDPOINTS ====================

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    stripeConfigured: !!stripe
  });
});

// Test endpoint for Stripe configuration
app.get('/api/stripe-status', (req, res) => {
  res.json({ 
    stripeConfigured: !!stripe,
    message: stripe ? 'Stripe is ready for payments' : 'Stripe needs to be configured'
  });
});

// ==================== END TEST ENDPOINTS ====================

// ==================== END STRIPE PAYMENT ROUTES ====================

// Global error handler
app.use((error, req, res, _next) => {
  console.error('❌ Server error:', error);
  console.error('🔍 Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    url: req.url,
    method: req.method,
    stack: error.stack?.split('\n').slice(0, 5).join('\n')
  });
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Serve static files from the dist directory (for production only)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 SERVER STARTED SUCCESSFULLY!`);
    console.log(`🌐 LOCALHOST URL: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n✅ Ready to use! Open http://localhost:${PORT} in your browser\n`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
      console.log('✅ HTTP server closed');
      
      try {
        await prisma.$disconnect();
        console.log('✅ Prisma client disconnected');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Export the app for serverless deployment
module.exports = app; 