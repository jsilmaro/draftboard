const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// GET /api/brands/briefs - Get all briefs for the authenticated brand
router.get('/briefs', authenticateToken, async (req, res) => {
  try {
    const brandId = req.user.id; // Fixed: JWT stores id, not userId

    const briefs = await prisma.brief.findMany({
      where: { brandId },
      include: {
        submissions: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                userName: true,
                email: true,
                isVerified: true,
                stripeAccount: {
                  select: {
                    id: true,
                    status: true,
                    chargesEnabled: true,
                    payoutsEnabled: true
                  }
                }
              }
            },
            winner: {
              select: {
                id: true,
                position: true,
                selectedAt: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        },
        rewardTiers: true,
        winners: {
          select: {
            id: true,
            position: true,
            submissionId: true,
            creatorId: true,
            selectedAt: true
          }
        },
        rewardAssignments: {
          select: {
            id: true,
            creatorId: true,
            submissionId: true,
            status: true,
            payoutStatus: true,
            rewardTier: {
              select: {
                position: true
              }
            }
          }
        },
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
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log winner data for debugging
    console.log('📊 Briefs fetched for brand:', brandId);
    briefs.forEach(brief => {
      const submissionsWithWinners = brief.submissions.filter(s => s.winner).length;
      if (brief.winners && brief.winners.length > 0) {
        console.log(`  📋 Brief: ${brief.title}`, {
          totalSubmissions: brief.submissions.length,
          winnersInTable: brief.winners.length,
          submissionsWithWinnerRelation: submissionsWithWinners,
          winnerSubmissionIds: brief.winners.map(w => w.submissionId.substring(0, 8))
        });
      }
    });

    res.json(briefs);
  } catch (error) {
    console.error('Error fetching brand briefs:', error);
    res.status(500).json({ error: 'Failed to fetch briefs' });
  }
});

// GET /api/brands/submissions - Get all submissions for the authenticated brand's briefs
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const brandId = req.user.id; // Fixed: JWT stores id, not userId

    const submissions = await prisma.submission.findMany({
      where: {
        brief: {
          brandId
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            userName: true
          }
        },
        brief: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching brand submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// POST /api/brands/submissions/:id/approve - Approve a submission
router.post('/submissions/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const brandId = req.user.id;

    // Verify this submission belongs to one of the brand's briefs
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        brief: {
          brandId
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Update submission status to approved
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'approved',
        reviewedAt: new Date()
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
            title: true
          }
        }
      }
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// POST /api/brands/submissions/:id/reject - Reject a submission
router.post('/submissions/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const brandId = req.user.id;

    // Verify this submission belongs to one of the brand's briefs
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        brief: {
          brandId
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Update submission status to rejected
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'rejected',
        reviewedAt: new Date()
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
            title: true
          }
        }
      }
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// GET /api/brands/creators - Get all creators who have submitted to the brand's briefs
router.get('/creators', authenticateToken, async (req, res) => {
  try {
    const brandId = req.user.id; // Fixed: JWT stores id, not userId

    // Get all submissions for this brand to calculate stats per creator
    const submissions = await prisma.submission.findMany({
      where: {
        brief: {
          brandId
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            userName: true,
            email: true,
            socialInstagram: true,
            socialTwitter: true,
            socialLinkedIn: true,
            socialTikTok: true,
            socialYouTube: true,
            isVerified: true,
            createdAt: true
          }
        },
        brief: {
          select: {
            id: true,
            title: true
          }
        },
        winner: {
          select: {
            id: true,
            position: true
          }
        }
      }
    });

    // Group submissions by creator and calculate stats
    const creatorMap = new Map();
    
    submissions.forEach(submission => {
      const creatorId = submission.creator.id;
      
      if (!creatorMap.has(creatorId)) {
        creatorMap.set(creatorId, {
          id: submission.creator.id,
          name: submission.creator.fullName,
          userName: submission.creator.userName,
          email: submission.creator.email,
          userType: 'creator', // Required by frontend
          socialInstagram: submission.creator.socialInstagram,
          socialTwitter: submission.creator.socialTwitter,
          socialLinkedIn: submission.creator.socialLinkedIn,
          socialTikTok: submission.creator.socialTikTok,
          socialYouTube: submission.creator.socialYouTube,
          isVerified: submission.creator.isVerified,
          totalSubmissions: 0,
          wins: 0,
          totalEarnings: 0,
          lastInteraction: submission.submittedAt,
          submissions: []
        });
      }

      const creatorData = creatorMap.get(creatorId);
      creatorData.totalSubmissions++;
      
      if (submission.winner) {
        creatorData.wins++;
        creatorData.totalEarnings += submission.amount || 0;
      }

      // Update last interaction if this submission is more recent
      if (new Date(submission.submittedAt) > new Date(creatorData.lastInteraction)) {
        creatorData.lastInteraction = submission.submittedAt;
      }

      // Add submission to creator's submissions array
      creatorData.submissions.push({
        id: submission.id,
        briefId: submission.brief.id,
        briefTitle: submission.brief.title,
        submittedAt: submission.submittedAt,
        status: submission.status,
        isWinner: !!submission.winner
      });
    });

    // Convert map to array
    const creators = Array.from(creatorMap.values());

    res.json(creators);
  } catch (error) {
    console.error('Error fetching brand creators:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// GET /api/brands/:id - Get public brand details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        logo: true,
        email: true,
        phoneCountry: true,
        phoneNumber: true,
        addressStreet: true,
        addressCity: true,
        addressState: true,
        addressZip: true,
        addressCountry: true,
        socialInstagram: true,
        socialTwitter: true,
        socialLinkedIn: true,
        socialWebsite: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand details:', error);
    res.status(500).json({ error: 'Failed to fetch brand details' });
  }
});

module.exports = router;
