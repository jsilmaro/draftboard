const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// Get user ID from JWT token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded.userId; // Support both formats
  } catch (error) {
    return null;
  }
};

// Get all users (creators and brands) - Public endpoint
router.get('/all', async (req, res) => {
  try {
    console.log('🔍 Fetching all users from database...');

    // Get all brands and creators
    const [brands, creators] = await Promise.all([
      prisma.brand.findMany({
        select: {
          id: true,
          companyName: true,
          email: true
        },
        orderBy: {
          companyName: 'asc'
        }
      }),
      prisma.creator.findMany({
        select: {
          id: true,
          fullName: true,
          userName: true,
          email: true
        },
        orderBy: {
          fullName: 'asc'
        }
      })
    ]);

    console.log(`📊 Found ${brands.length} brands and ${creators.length} creators`);

    const allUsers = [
      ...brands.map(brand => ({
        id: brand.id,
        name: brand.companyName,
        handle: `@${brand.email.split('@')[0]}`,
        avatar: brand.companyName?.charAt(0).toUpperCase() || 'B',
        type: 'brand'
      })),
      ...creators.map(creator => ({
        id: creator.id,
        name: creator.fullName,
        handle: `@${creator.userName}`,
        avatar: creator.fullName?.charAt(0).toUpperCase() || 'C',
        type: 'creator'
      }))
    ];

    console.log(`✅ Returning ${allUsers.length} total users`);
    res.json({ users: allUsers });
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get suggested users (general - authenticated)
router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get 5 brands and 5 creators for general suggestions
    const [brands, creators] = await Promise.all([
      prisma.brand.findMany({
        where: {
          id: { not: userId }
        },
        select: {
          id: true,
          companyName: true,
          email: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.creator.findMany({
        where: {
          id: { not: userId }
        },
        select: {
          id: true,
          fullName: true,
          userName: true,
          email: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    const formattedUsers = [
      ...brands.map(brand => ({
        id: brand.id,
        name: brand.companyName,
        handle: `@${brand.email.split('@')[0]}`,
        avatar: brand.companyName?.charAt(0).toUpperCase() || 'B',
        type: 'brand'
      })),
      ...creators.map(creator => ({
        id: creator.id,
        name: creator.fullName,
        handle: `@${creator.userName}`,
        avatar: creator.fullName?.charAt(0).toUpperCase() || 'C',
        type: 'creator'
      }))
    ];

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get suggested users based on interactions
router.get('/suggested-interactions', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current user to determine type
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { type: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let suggestedUsers = [];

    if (currentUser.type === 'creator') {
      // For creators, find brands they've submitted to
      const submissions = await prisma.submission.findMany({
        where: { creatorId: userId },
        include: {
          brief: {
            include: {
              brand: {
                select: {
                  id: true,
                  companyName: true,
                  email: true
                }
              }
            }
          }
        },
        distinct: ['briefId'],
        take: 10
      });

      suggestedUsers = submissions.map(submission => ({
        id: submission.brief.brand.id,
        name: submission.brief.brand.companyName,
        handle: `@${submission.brief.brand.email.split('@')[0]}`,
        avatar: submission.brief.brand.companyName?.charAt(0).toUpperCase() || 'B',
        type: 'brand',
        interactionType: 'Submitted to brief'
      }));
    } else {
      // For brands, find creators who submitted to their briefs
      const briefs = await prisma.brief.findMany({
        where: { brandId: userId },
        include: {
          submissions: {
            include: {
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  userName: true
                }
              }
            },
            distinct: ['creatorId'],
            take: 5
          }
        },
        take: 5
      });

      const creators = [];
      briefs.forEach(brief => {
        brief.submissions.forEach(submission => {
          if (!creators.find(c => c.id === submission.creator.id)) {
            creators.push({
              id: submission.creator.id,
              name: submission.creator.fullName,
              handle: `@${submission.creator.userName}`,
              avatar: submission.creator.fullName?.charAt(0).toUpperCase() || 'C',
              type: 'creator',
              interactionType: 'Submitted to your brief'
            });
          }
        });
      });

      suggestedUsers = creators.slice(0, 10);
    }

    res.json({ users: suggestedUsers });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users - Public endpoint
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    // Search in both brands and creators
    const [brands, creators] = await Promise.all([
      prisma.brand.findMany({
        where: {
          OR: [
            { companyName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          companyName: true,
          email: true
        },
        take: 10
      }),
      prisma.creator.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { userName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          userName: true,
          email: true
        },
        take: 10
      })
    ]);

    const formattedUsers = [
      ...brands.map(brand => ({
        id: brand.id,
        name: brand.companyName,
        handle: `@${brand.email.split('@')[0]}`,
        avatar: brand.companyName?.charAt(0).toUpperCase() || 'B',
        type: 'brand'
      })),
      ...creators.map(creator => ({
        id: creator.id,
        name: creator.fullName,
        handle: `@${creator.userName}`,
        avatar: creator.fullName?.charAt(0).toUpperCase() || 'C',
        type: 'creator'
      }))
    ];

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
