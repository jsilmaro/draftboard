const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply token verification to all search routes
router.use(verifyToken);

// Universal search endpoint
router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = query.trim();
    const userType = req.user.type; // 'creator' or 'brand'
    const userId = req.user.id;

    let results = [];

    if (userType === 'creator') {
      // Creator search: find briefs and their own submissions
      results = await searchForCreator(userId, searchTerm, limit);
    } else if (userType === 'brand') {
      // Brand search: find their briefs and submissions to their briefs
      results = await searchForBrand(userId, searchTerm, limit);
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search function for creators
async function searchForCreator(creatorId, searchTerm, limit) {
  const results = [];

  try {
    // Search available briefs (active briefs from all brands)
    const briefs = await prisma.brief.findMany({
      where: {
        status: 'active',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { requirements: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } },
          {
            brand: {
              OR: [
                { companyName: { contains: searchTerm, mode: 'insensitive' } },
                { contactName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }
        ]
      },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            logo: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      take: Math.floor(limit / 2)
    });

    // Add briefs to results
    briefs.forEach(brief => {
      results.push({
        type: 'brief',
        id: brief.id,
        title: brief.title,
        description: brief.description,
        brandName: brief.brand.companyName,
        brandContact: brief.brand.contactName,
        category: 'Brief',
        reward: brief.reward,
        deadline: brief.deadline,
        location: brief.location,
        submissionsCount: brief._count.submissions,
        isPrivate: brief.isPrivate,
        data: {
          ...brief,
          brandName: brief.brand.companyName,
          brandContact: brief.brand.contactName
        }
      });
    });

    // Search creator's own submissions
    const submissions = await prisma.submission.findMany({
      where: {
        creatorId: creatorId,
        OR: [
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { status: { contains: searchTerm, mode: 'insensitive' } },
          {
            brief: {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          },
          {
            brief: {
              brand: {
                OR: [
                  { companyName: { contains: searchTerm, mode: 'insensitive' } },
                  { contactName: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      },
      include: {
        brief: {
          include: {
            brand: {
              select: {
                id: true,
                companyName: true,
                contactName: true
              }
            }
          }
        }
      },
      take: Math.floor(limit / 2),
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Add submissions to results
    submissions.forEach(submission => {
      results.push({
        type: 'submission',
        id: submission.id,
        title: submission.brief.title,
        description: `Status: ${submission.status} - ${submission.content.substring(0, 100)}...`,
        brandName: submission.brief.brand.companyName,
        brandContact: submission.brief.brand.contactName,
        category: 'Submission',
        reward: submission.amount,
        deadline: submission.submittedAt,
        status: submission.status,
        data: {
          ...submission,
          briefTitle: submission.brief.title,
          brandName: submission.brief.brand.companyName,
          brandContact: submission.brief.brand.contactName
        }
      });
    });

  } catch (error) {
    console.error('Creator search error:', error);
  }

  return results;
}

// Search function for brands
async function searchForBrand(brandId, searchTerm, limit) {
  const results = [];

  try {
    // Search brand's own briefs
    const briefs = await prisma.brief.findMany({
      where: {
        brandId: brandId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { requirements: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } },
          { status: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            contactName: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      take: Math.floor(limit / 2),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add briefs to results
    briefs.forEach(brief => {
      results.push({
        type: 'brief',
        id: brief.id,
        title: brief.title,
        description: brief.description,
        brandName: brief.brand.companyName,
        brandContact: brief.brand.contactName,
        category: 'Brief',
        reward: brief.reward,
        deadline: brief.deadline,
        location: brief.location,
        status: brief.status,
        submissionsCount: brief._count.submissions,
        isPrivate: brief.isPrivate,
        data: {
          ...brief,
          brandName: brief.brand.companyName,
          brandContact: brief.brand.contactName
        }
      });
    });

    // Search submissions to brand's briefs
    const submissions = await prisma.submission.findMany({
      where: {
        brief: {
          brandId: brandId
        },
        OR: [
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { status: { contains: searchTerm, mode: 'insensitive' } },
          {
            creator: {
              OR: [
                { fullName: { contains: searchTerm, mode: 'insensitive' } },
                { userName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          },
          {
            brief: {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }
        ]
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            userName: true,
            email: true
          }
        }
      },
      take: Math.floor(limit / 2),
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Add submissions to results
    submissions.forEach(submission => {
      results.push({
        type: 'submission',
        id: submission.id,
        title: submission.brief.title,
        description: `Creator: ${submission.creator.fullName} (${submission.creator.userName}) - Status: ${submission.status}`,
        brandName: submission.creator.fullName,
        brandContact: submission.creator.userName,
        category: 'Submission',
        reward: submission.amount,
        deadline: submission.submittedAt,
        status: submission.status,
        creatorEmail: submission.creator.email,
        data: {
          ...submission,
          briefTitle: submission.brief.title,
          creatorName: submission.creator.fullName,
          creatorUserName: submission.creator.userName,
          creatorEmail: submission.creator.email
        }
      });
    });

  } catch (error) {
    console.error('Brand search error:', error);
  }

  return results;
}

// Specific search endpoints for different types
router.get('/briefs', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    const userType = req.user.type;
    const userId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = query.trim();
    let briefs = [];

    if (userType === 'creator') {
      // Search available briefs for creators
      briefs = await prisma.brief.findMany({
        where: {
          status: 'active',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { requirements: { contains: searchTerm, mode: 'insensitive' } },
            {
              brand: {
                companyName: { contains: searchTerm, mode: 'insensitive' }
              }
            }
          ]
        },
        include: {
          brand: {
            select: {
              companyName: true,
              contactName: true,
              logo: true
            }
          }
        },
        take: parseInt(limit)
      });
    } else if (userType === 'brand') {
      // Search brand's own briefs
      briefs = await prisma.brief.findMany({
        where: {
          brandId: userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { requirements: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          brand: {
            select: {
              companyName: true,
              contactName: true
            }
          }
        },
        take: parseInt(limit)
      });
    }

    res.json(briefs);
  } catch (error) {
    console.error('Brief search error:', error);
    res.status(500).json({ error: 'Brief search failed' });
  }
});

router.get('/submissions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    const userType = req.user.type;
    const userId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = query.trim();
    let submissions = [];

    if (userType === 'creator') {
      // Search creator's own submissions
      submissions = await prisma.submission.findMany({
        where: {
          creatorId: userId,
          OR: [
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { status: { contains: searchTerm, mode: 'insensitive' } },
            {
              brief: {
                title: { contains: searchTerm, mode: 'insensitive' }
              }
            }
          ]
        },
        include: {
          brief: {
            include: {
              brand: {
                select: {
                  companyName: true
                }
              }
            }
          }
        },
        take: parseInt(limit),
        orderBy: {
          submittedAt: 'desc'
        }
      });
    } else if (userType === 'brand') {
      // Search submissions to brand's briefs
      submissions = await prisma.submission.findMany({
        where: {
          brief: {
            brandId: userId
          },
          OR: [
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { status: { contains: searchTerm, mode: 'insensitive' } },
            {
              creator: {
                OR: [
                  { fullName: { contains: searchTerm, mode: 'insensitive' } },
                  { userName: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          ]
        },
        include: {
          brief: {
            select: {
              title: true
            }
          },
          creator: {
            select: {
              fullName: true,
              userName: true,
              email: true
            }
          }
        },
        take: parseInt(limit),
        orderBy: {
          submittedAt: 'desc'
        }
      });
    }

    res.json(submissions);
  } catch (error) {
    console.error('Submission search error:', error);
    res.status(500).json({ error: 'Submission search failed' });
  }
});

module.exports = router;
