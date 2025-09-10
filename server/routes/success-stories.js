const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const prisma = require('../prisma');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get all success stories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter, sort, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (filter && filter !== 'all') {
      if (filter === 'featured') {
        where.featured = true;
      } else {
        where.category = filter;
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'budget') {
      orderBy = { budget: 'desc' };
    } else if (sort === 'popularity') {
      orderBy = { views: 'desc' };
    }

    const stories = await prisma.successStory.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true
          }
        }
      },
      orderBy,
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.successStory.count({ where });

    res.json({
      stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching success stories:', error);
    res.status(500).json({ error: 'Failed to fetch success stories' });
  }
});

// Get a specific success story
router.get('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await prisma.successStory.findUnique({
      where: { id: storyId },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            socialWebsite: true,
            socialInstagram: true,
            socialTwitter: true,
            socialLinkedIn: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true,
            bio: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Success story not found' });
    }

    // Increment view count
    await prisma.successStory.update({
      where: { id: storyId },
      data: { views: { increment: 1 } }
    });

    res.json(story);
  } catch (error) {
    console.error('Error fetching success story:', error);
    res.status(500).json({ error: 'Failed to fetch success story' });
  }
});

// Submit a success story
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      briefTitle,
      brandId,
      creatorId,
      category,
      budget,
      duration,
      outcome,
      metrics,
      testimonial,
      images,
      tags
    } = req.body;

    const story = await prisma.successStory.create({
      data: {
        title,
        description,
        briefTitle,
        brandId,
        creatorId,
        category,
        budget,
        duration,
        outcome,
        metrics: metrics || {},
        testimonial: testimonial || {},
        images: images || [],
        tags: tags || []
      },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true
          }
        }
      }
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating success story:', error);
    res.status(500).json({ error: 'Failed to create success story' });
  }
});

// Update a success story (for story authors)
router.patch('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Check if user is the brand or creator associated with the story
    const story = await prisma.successStory.findFirst({
      where: {
        id: storyId,
        OR: [
          { brandId: userId },
          { creatorId: userId }
        ]
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Success story not found or you are not authorized to edit it' });
    }

    const updatedStory = await prisma.successStory.update({
      where: { id: storyId },
      data: req.body,
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true
          }
        }
      }
    });

    res.json(updatedStory);
  } catch (error) {
    console.error('Error updating success story:', error);
    res.status(500).json({ error: 'Failed to update success story' });
  }
});

// Delete a success story (for story authors)
router.delete('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Check if user is the brand or creator associated with the story
    const story = await prisma.successStory.findFirst({
      where: {
        id: storyId,
        OR: [
          { brandId: userId },
          { creatorId: userId }
        ]
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Success story not found or you are not authorized to delete it' });
    }

    await prisma.successStory.delete({
      where: { id: storyId }
    });

    res.json({ success: true, message: 'Success story deleted successfully' });
  } catch (error) {
    console.error('Error deleting success story:', error);
    res.status(500).json({ error: 'Failed to delete success story' });
  }
});

// Get user's success stories
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // 'brand' or 'creator'

    const where = {};
    if (type === 'brand') {
      where.brandId = userId;
    } else if (type === 'creator') {
      where.creatorId = userId;
    } else {
      where.OR = [
        { brandId: userId },
        { creatorId: userId }
      ];
    }

    const stories = await prisma.successStory.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(stories);
  } catch (error) {
    console.error('Error fetching user success stories:', error);
    res.status(500).json({ error: 'Failed to fetch user success stories' });
  }
});

module.exports = router;
