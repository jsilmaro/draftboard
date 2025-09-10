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

// Get all forum posts
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.forumPost.count({ where });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ error: 'Failed to fetch forum posts' });
  }
});

// Get a specific forum post with replies
router.get('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                type: true,
                avatar: true
              }
            },
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            views: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    });

    res.json(post);
  } catch (error) {
    console.error('Error fetching forum post:', error);
    res.status(500).json({ error: 'Failed to fetch forum post' });
  }
});

// Create a new forum post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const userId = req.user.id;

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        category,
        tags: tags || [],
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ error: 'Failed to create forum post' });
  }
});

// Reply to a forum post
router.post('/posts/:postId/replies', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Verify post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ error: 'This post is locked' });
    }

    const reply = await prisma.forumReply.create({
      data: {
        postId,
        content,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        }
      }
    });

    // Update post's reply count and last activity
    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        replies: { increment: 1 },
        updatedAt: new Date()
      }
    });

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Like a forum post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if user already liked this post
    const existingLike = await prisma.forumPostLike.findFirst({
      where: {
        postId,
        userId
      }
    });

    if (existingLike) {
      // Unlike the post
      await prisma.forumPostLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Like the post
      await prisma.forumPostLike.create({
        data: {
          postId,
          userId
        }
      });
    }

    // Get updated like count
    const likeCount = await prisma.forumPostLike.count({
      where: { postId }
    });

    res.json({ likeCount, isLiked: !existingLike });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Like a forum reply
router.post('/replies/:replyId/like', authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    // Check if user already liked this reply
    const existingLike = await prisma.forumReplyLike.findFirst({
      where: {
        replyId,
        userId
      }
    });

    if (existingLike) {
      // Unlike the reply
      await prisma.forumReplyLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Like the reply
      await prisma.forumReplyLike.create({
        data: {
          replyId,
          userId
        }
      });
    }

    // Get updated like count
    const likeCount = await prisma.forumReplyLike.count({
      where: { replyId }
    });

    res.json({ likeCount, isLiked: !existingLike });
  } catch (error) {
    console.error('Error liking reply:', error);
    res.status(500).json({ error: 'Failed to like reply' });
  }
});

// Mark a reply as solution
router.post('/replies/:replyId/solution', authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    // Get the reply and its post
    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      include: {
        post: true
      }
    });

    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Check if user is the post author
    if (reply.post.authorId !== userId) {
      return res.status(403).json({ error: 'Only the post author can mark solutions' });
    }

    // Remove solution status from other replies in this post
    await prisma.forumReply.updateMany({
      where: {
        postId: reply.postId,
        id: { not: replyId }
      },
      data: { isSolution: false }
    });

    // Mark this reply as solution
    await prisma.forumReply.update({
      where: { id: replyId },
      data: { isSolution: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking reply as solution:', error);
    res.status(500).json({ error: 'Failed to mark reply as solution' });
  }
});

// Get success stories
router.get('/success-stories', authenticateToken, async (req, res) => {
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
            name: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
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
router.get('/success-stories/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await prisma.successStory.findUnique({
      where: { id: storyId },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            socialInstagram: true,
            socialTwitter: true,
            socialLinkedIn: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
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
router.post('/success-stories', authenticateToken, async (req, res) => {
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
            name: true,
            logo: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
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

module.exports = router;
