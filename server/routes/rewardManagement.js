const express = require('express');
const router = express.Router();

// Import shared Prisma client
const { prisma } = require('../prisma');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

/**
 * POST /api/briefs/:id/assign-reward
 * Assign a creator to a reward tier
 */
router.post('/briefs/:id/assign-reward', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can assign rewards' });
    }

    const { id: briefId } = req.params;
    const { rewardTierId, submissionId, creatorId } = req.body;

    if (!rewardTierId || !submissionId || !creatorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      },
      include: {
        rewardTiers: true,
        rewardAssignments: true
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    if (!brief.isFunded) {
      return res.status(400).json({ error: 'Brief must be funded before assigning rewards' });
    }

    // Check if reward tier exists and belongs to this brief
    const rewardTier = brief.rewardTiers.find(rt => rt.id === rewardTierId);
    if (!rewardTier) {
      return res.status(404).json({ error: 'Reward tier not found' });
    }

    // Check if tier is already assigned
    const existingAssignment = brief.rewardAssignments.find(ra => ra.rewardTierId === rewardTierId);
    if (existingAssignment) {
      return res.status(400).json({ error: 'This reward tier is already assigned' });
    }

    // Check if submission exists and belongs to this brief
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        briefId: briefId,
        creatorId: creatorId
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if submission is already assigned to another tier
    const existingSubmissionAssignment = brief.rewardAssignments.find(ra => ra.submissionId === submissionId);
    if (existingSubmissionAssignment) {
      return res.status(400).json({ error: 'This submission is already assigned to a reward tier' });
    }

    // Create reward assignment
    const assignment = await prisma.rewardAssignment.create({
      data: {
        briefId: briefId,
        rewardTierId: rewardTierId,
        creatorId: creatorId,
        submissionId: submissionId,
        assignedBy: req.user.id,
        status: 'assigned',
        payoutStatus: 'pending'
      },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
            fullName: true
          }
        },
        submission: {
          select: {
            id: true,
            content: true,
            submittedAt: true
          }
        },
        rewardTier: true
      }
    });

    // Update brief status if this is the first assignment
    if (brief.rewardAssignments.length === 0) {
      await prisma.briefStatus.create({
        data: {
          briefId: briefId,
          status: 'winners_selected',
          updatedBy: req.user.id,
          notes: 'First reward assignment made'
        }
      });
    }

    res.json({
      success: true,
      message: 'Reward assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/reward-assignments/:id
 * Remove a reward assignment
 */
router.delete('/reward-assignments/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can remove reward assignments' });
    }

    const { id: assignmentId } = req.params;

    // Find the assignment and verify ownership
    const assignment = await prisma.rewardAssignment.findFirst({
      where: { id: assignmentId },
      include: {
        brief: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if payout has already been processed
    if (assignment.payoutStatus === 'paid') {
      return res.status(400).json({ error: 'Cannot remove assignment that has already been paid' });
    }

    // Delete the assignment
    await prisma.rewardAssignment.delete({
      where: { id: assignmentId }
    });

    res.json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/briefs/:id/process-payouts
 * Process payouts for all assigned rewards
 */
router.post('/briefs/:id/process-payouts', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can process payouts' });
    }

    const { id: briefId } = req.params;

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      },
      include: {
        rewardAssignments: {
          include: {
            creator: {
              include: {
                stripeAccount: true
              }
            },
            rewardTier: true
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    if (!brief.isFunded) {
      return res.status(400).json({ error: 'Brief must be funded before processing payouts' });
    }

    const assignments = brief.rewardAssignments.filter(ra => ra.payoutStatus === 'pending');
    
    if (assignments.length === 0) {
      return res.status(400).json({ error: 'No pending assignments to process' });
    }

    // Process each assignment
    const results = [];
    for (const assignment of assignments) {
      try {
        // Check if creator has Stripe account
        if (!assignment.creator.stripeAccount || !assignment.creator.stripeAccount.chargesEnabled) {
          results.push({
            assignmentId: assignment.id,
            success: false,
            error: 'Creator does not have a valid Stripe account'
          });
          continue;
        }

        // Create Stripe transfer
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
        
        const transfer = await stripe.transfers.create({
          amount: Math.round(assignment.rewardTier.amount * 100), // Convert to cents
          currency: 'usd',
          destination: assignment.creator.stripeAccount.stripeAccountId,
          transfer_group: `brief_${briefId}`
        });

        // Update assignment with transfer details
        await prisma.rewardAssignment.update({
          where: { id: assignment.id },
          data: {
            payoutStatus: 'processing',
            stripeTransferId: transfer.id
          }
        });

        results.push({
          assignmentId: assignment.id,
          success: true,
          transferId: transfer.id
        });

      } catch (error) {
        console.error(`Error processing payout for assignment ${assignment.id}:`, error);
        results.push({
          assignmentId: assignment.id,
          success: false,
          error: error.message
        });
      }
    }

    // Update brief status
    await prisma.briefStatus.create({
      data: {
        briefId: briefId,
        status: 'payouts_processing',
        updatedBy: req.user.id,
        notes: `Processing ${results.length} payouts`
      }
    });

    res.json({
      success: true,
      message: 'Payout processing initiated',
      data: results
    });
  } catch (error) {
    console.error('Error processing payouts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/briefs/:id/reward-assignments
 * Get all reward assignments for a brief
 */
router.get('/briefs/:id/reward-assignments', authenticateToken, async (req, res) => {
  try {
    const { id: briefId } = req.params;

    // Verify brief exists and user has access
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        ...(req.user.type === 'brand' ? { brandId: req.user.id } : {})
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    const assignments = await prisma.rewardAssignment.findMany({
      where: { briefId: briefId },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
            fullName: true
          }
        },
        submission: {
          select: {
            id: true,
            content: true,
            submittedAt: true
          }
        },
        rewardTier: true
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching reward assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/rewards/distribute-with-stripe
 * Distribute rewards to winners using Stripe
 */
router.post('/distribute-with-stripe', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can distribute rewards' });
    }

    const { briefId, winners } = req.body;

    if (!briefId || !winners || winners.length === 0) {
      return res.status(400).json({ error: 'Brief ID and winners are required' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      },
      include: {
        briefFunding: true,
        submissions: {
          include: {
            creator: true
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    if (!brief.isFunded) {
      return res.status(400).json({ error: 'Brief must be funded before distributing rewards' });
    }

    // Check if brief has sufficient funding
    const totalRewardAmount = winners.reduce((sum, winner) => sum + winner.amount, 0);
    if (brief.briefFunding && brief.briefFunding.netAmount < totalRewardAmount) {
      return res.status(400).json({ 
        error: `Insufficient funding. Available: $${brief.briefFunding.netAmount}, Required: $${totalRewardAmount}` 
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each winner
    for (const winner of winners) {
      try {
        // Get creator's Stripe account
        const creator = await prisma.creator.findUnique({
          where: { id: winner.creatorId },
          include: { stripeAccount: true }
        });

        if (!creator) {
          results.failed++;
          results.errors.push(`Creator ${winner.creatorId} not found`);
          continue;
        }

        if (!creator.stripeAccount || !creator.stripeAccount.accountId) {
          results.failed++;
          results.errors.push(`Creator ${creator.fullName} has no Stripe account connected`);
          continue;
        }

        // Create Stripe transfer to creator
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const transfer = await stripe.transfers.create({
          amount: Math.round(winner.amount * 100), // Convert to cents
          currency: 'usd',
          destination: creator.stripeAccount.accountId,
          metadata: {
            briefId: briefId,
            creatorId: winner.creatorId,
            submissionId: winner.submissionId,
            type: 'reward_payment'
          }
        });

        // Update creator wallet balance
        await prisma.creatorWallet.upsert({
          where: { creatorId: winner.creatorId },
          update: {
            balance: { increment: winner.amount },
            updatedAt: new Date()
          },
          create: {
            creatorId: winner.creatorId,
            balance: winner.amount
          }
        });

        // Record transaction
        await prisma.transaction.create({
          data: {
            userId: winner.creatorId,
            userType: 'creator',
            type: 'reward',
            amount: winner.amount,
            stripeTransferId: transfer.id,
            status: 'completed',
            description: `Reward for winning brief: ${brief.title}`
          }
        });

        // Update submission status
        await prisma.submission.update({
          where: { id: winner.submissionId },
          data: { 
            status: 'approved',
            rewardAmount: winner.amount,
            rewardedAt: new Date()
          }
        });

        // Create notification for creator
        await prisma.notification.create({
          data: {
            userId: winner.creatorId,
            userType: 'creator',
            title: 'Congratulations! You Won!',
            message: `You won $${winner.amount} for your submission to "${brief.title}". The reward has been added to your wallet.`,
            type: 'reward'
          }
        });

        results.successful++;

      } catch (error) {
        console.error(`Error processing winner ${winner.creatorId}:`, error);
        results.failed++;
        results.errors.push(`Failed to process ${winner.creatorId}: ${error.message}`);
      }
    }

    // Update brief status if all rewards distributed
    if (results.failed === 0) {
      await prisma.brief.update({
        where: { id: briefId },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: `Rewards distributed: ${results.successful} successful, ${results.failed} failed`,
      results
    });

  } catch (error) {
    console.error('Error distributing rewards:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

module.exports = router;

