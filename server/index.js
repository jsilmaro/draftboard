const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Database connection test
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log('🔍 Environment Variables:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  - PORT:', process.env.PORT || 'not set');
    console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING!');
    console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING!');
    if (process.env.DATABASE_URL) {
      console.log('  - DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 20) + '...');
    }
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.log('🔍 Environment Variables:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  - PORT:', process.env.PORT || 'not set');
    console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING!');
    console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING!');
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Healthcheck endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  });
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Brand-Creator Platform API' });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try a simple query
    const brandCount = await prisma.brand.count();
    console.log('✅ Database query successful, brand count:', brandCount);
    
    res.json({ 
      status: 'success', 
      message: 'Database connection working',
      brandCount,
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
});



// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

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
                logo: req.file ? `/uploads/${req.file.filename}` : null
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

// Brand login
app.post('/api/brands/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const brand = await prisma.brand.findUnique({
      where: { email }
    });

    if (!brand) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    console.error('Brand login error:', error);
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
      portfolio,
      // Banking Information
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
        portfolio,
        // Banking Information
        paymentMethod,
        cardNumber,
        cardType,
        bankName,
        bankAccountType,
        bankRouting,
        bankAccount,
        paypalEmail,
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
    const { email, password } = req.body;

    const creator = await prisma.creator.findUnique({
      where: { email }
    });

    if (!creator) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
          portfolio: true,
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

// Admin endpoints (no authentication required for demo)
// Get all brands
app.get('/api/admin/brands', async (req, res) => {
  try {
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
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all creators
app.get('/api/admin/creators', async (req, res) => {
  try {
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
    res.json(creators);
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all briefs
app.get('/api/admin/briefs', async (req, res) => {
  try {
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
    res.json(briefs);
  } catch (error) {
    console.error('Error fetching briefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all submissions
app.get('/api/admin/submissions', async (req, res) => {
  try {
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
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
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
      budget,
      deadline,
      isPrivate,
      additionalFields
    } = req.body;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create briefs' });
    }

    const brief = await prisma.brief.create({
      data: {
        title,
        description,
        requirements,
        budget: parseFloat(budget),
        deadline: new Date(deadline),
        isPrivate: isPrivate || false,
        additionalFields: additionalFields ? JSON.stringify(additionalFields) : null,
        brandId: req.user.id
      }
    });

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
      budget,
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
        budget: budget !== undefined ? parseFloat(budget) : brief.budget,
        deadline: deadline !== undefined ? new Date(deadline) : brief.deadline,
        isPrivate: isPrivate !== undefined ? isPrivate : brief.isPrivate,
        additionalFields: additionalFields !== undefined ? JSON.stringify(additionalFields) : brief.additionalFields,
        status: status !== undefined ? status : brief.status
      }
    });

    res.json({
      message: 'Brief updated successfully',
      brief: updatedBrief
    });
  } catch (error) {
    console.error('Error updating brief:', error);
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
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(briefs);
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
            socialYouTube: true,
            portfolio: true
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

    // Parse files if they exist
    let files = [];
    if (submission.files) {
      try {
        files = JSON.parse(submission.files);
      } catch (e) {
        console.error('Error parsing submission files:', e);
      }
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
      files: files,
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
        socialYouTube: submission.creator.socialYouTube,
        portfolio: submission.creator.portfolio
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
        portfolio: true,
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
    const rewards = [];

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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedBriefs = briefs.map(brief => ({
      id: brief.id,
      title: brief.title,
      brandName: brief.brand.companyName,
      budget: brief.budget,
      deadline: brief.deadline,
      status: brief.status
    }));

    res.json(transformedBriefs);
  } catch (error) {
    console.error('Error fetching available briefs:', error);
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

// Get portfolio for a creator
app.get('/api/creators/portfolio', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const portfolioItems = await prisma.portfolioItem.findMany({
      where: { creatorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(portfolioItems);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add portfolio item
app.post('/api/creators/portfolio', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can add portfolio items' });
    }

    const { title, description, category } = req.body;

    // Handle file uploads
    const fileUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        title,
        description,
        category,
        imageUrl: fileUrls.length > 0 ? fileUrls[0] : null, // Use first file as main image
        files: fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
        creatorId: req.user.id
      }
    });

    res.status(201).json({
      message: 'Portfolio item added successfully',
      portfolioItem
    });
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update portfolio item
app.put('/api/creators/portfolio/:id', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can update portfolio items' });
    }

    const { id } = req.params;
    const { title, description, category } = req.body;

    // Check ownership
    const existingItem = await prisma.portfolioItem.findFirst({
      where: { 
        id,
        creatorId: req.user.id 
      }
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Portfolio item not found or access denied' });
    }

    // Handle file uploads
    const fileUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const updatedItem = await prisma.portfolioItem.update({
      where: { id },
      data: {
        title,
        description,
        category,
        imageUrl: fileUrls.length > 0 ? fileUrls[0] : existingItem.imageUrl,
        files: fileUrls.length > 0 ? JSON.stringify(fileUrls) : existingItem.files
      }
    });

    res.json({
      message: 'Portfolio item updated successfully',
      portfolioItem: updatedItem
    });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete portfolio item
app.delete('/api/creators/portfolio/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can delete portfolio items' });
    }

    const { id } = req.params;

    // Check ownership
    const existingItem = await prisma.portfolioItem.findFirst({
      where: { 
        id,
        creatorId: req.user.id 
      }
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Portfolio item not found or access denied' });
    }

    await prisma.portfolioItem.delete({
      where: { id }
    });

    res.json({
      message: 'Portfolio item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
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
        portfolio: true
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
app.post('/api/briefs/:id/apply', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can apply to briefs' });
    }

    const { id } = req.params;
    const { content, amount } = req.body;

    // Check if brief exists and is active
    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief || brief.status !== 'active') {
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
      return res.status(400).json({ error: 'You have already applied to this brief' });
    }

    // Handle file uploads
    const fileUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        briefId: id,
        creatorId: req.user.id,
        content,
        files: fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
        amount: parseFloat(amount),
        status: 'pending'
      }
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite creator to brief
app.post('/api/brands/invite-creator', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can invite creators' });
    }

    const { creatorId, message, briefId } = req.body;

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if brief exists (if briefId is provided)
    if (briefId) {
      const brief = await prisma.brief.findFirst({
        where: { 
          id: briefId,
          brandId: req.user.id 
        }
      });

      if (!brief) {
        return res.status(404).json({ error: 'Brief not found or access denied' });
      }
    }

    // For now, we'll just return success
    // In a real app, you might send an email notification or create an invitation record
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

    // In a real app, you would send an email notification to the creator
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

    // In a real app, you would send an email notification to the creator
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

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 