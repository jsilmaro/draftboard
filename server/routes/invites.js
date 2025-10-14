const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');

// Authentication middleware for creators
const authenticateCreator = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.type !== 'creator') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.creator = user;
    next();
  });
};

// GET /api/invites - Get all invites for the logged-in creator
router.get('/', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { status } = req.query;

    // Build where clause based on status filter
    const where = { creatorId: creatorId };
    if (status) {
      where.status = status.toUpperCase();
    } else {
      // Default to pending invites if no status specified
      where.status = 'PENDING';
    }

    const invites = await prisma.invite.findMany({
      where: where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch brand and brief details for each invite
    const invitesWithDetails = await Promise.all(
      invites.map(async (invite) => {
        const brand = await prisma.brand.findUnique({
          where: { id: invite.brandId },
          select: { 
            id: true,
            companyName: true, 
            logo: true,
            socialWebsite: true
          }
        });

        let brief = null;
        if (invite.briefId) {
          brief = await prisma.brief.findUnique({
            where: { id: invite.briefId },
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              deadline: true
            }
          });
        }

        return {
          ...invite,
          brand,
          brief
        };
      })
    );

    res.json(invitesWithDetails);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// POST /api/invites/:id/accept - Accept an invitation
router.post('/:id/accept', authenticateCreator, async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.creator.id;

    // Verify the invite belongs to this creator
    const invite = await prisma.invite.findFirst({
      where: {
        id: id,
        creatorId: creatorId,
        status: 'PENDING'
      }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already responded to' });
    }

    // Update invite status
    const updatedInvite = await prisma.invite.update({
      where: { id: id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create notification for the brand
    await prisma.notification.create({
      data: {
        userId: invite.brandId,
        userType: 'brand',
        type: 'INVITE_ACCEPTED',
        category: 'invitation',
        title: 'Invitation Accepted',
        message: `A creator has accepted your invitation!`,
        actionUrl: `/creator/${creatorId}`,
        actionText: 'View Creator',
        priority: 'normal',
        isRead: false
      }
    });

    console.log(`✅ Creator ${creatorId} accepted invitation ${id} from brand ${invite.brandId}`);

    res.json({ 
      success: true, 
      message: 'Invitation accepted successfully',
      invite: updatedInvite 
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// POST /api/invites/:id/decline - Decline an invitation
router.post('/:id/decline', authenticateCreator, async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.creator.id;

    // Verify the invite belongs to this creator
    const invite = await prisma.invite.findFirst({
      where: {
        id: id,
        creatorId: creatorId,
        status: 'PENDING'
      }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already responded to' });
    }

    // Update invite status
    const updatedInvite = await prisma.invite.update({
      where: { id: id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create notification for the brand
    await prisma.notification.create({
      data: {
        userId: invite.brandId,
        userType: 'brand',
        type: 'INVITE_DECLINED',
        category: 'invitation',
        title: 'Invitation Declined',
        message: `A creator has declined your invitation.`,
        actionUrl: '/brand/creators',
        actionText: 'Find Creators',
        priority: 'low',
        isRead: false
      }
    });

    console.log(`❌ Creator ${creatorId} declined invitation ${id} from brand ${invite.brandId}`);

    res.json({ 
      success: true, 
      message: 'Invitation declined',
      invite: updatedInvite 
    });
  } catch (error) {
    console.error('Error declining invite:', error);
    res.status(500).json({ error: 'Failed to decline invitation' });
  }
});

// GET /api/invites/stats - Get invitation statistics for the creator
router.get('/stats', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;

    const [pending, accepted, declined, total] = await Promise.all([
      prisma.invite.count({ where: { creatorId, status: 'PENDING' } }),
      prisma.invite.count({ where: { creatorId, status: 'ACCEPTED' } }),
      prisma.invite.count({ where: { creatorId, status: 'DECLINED' } }),
      prisma.invite.count({ where: { creatorId } })
    ]);

    res.json({
      pending,
      accepted,
      declined,
      total
    });
  } catch (error) {
    console.error('Error fetching invite stats:', error);
    res.status(500).json({ error: 'Failed to fetch invite statistics' });
  }
});

module.exports = router;


