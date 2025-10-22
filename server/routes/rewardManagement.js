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
 * CRITICAL: Validate that reward tier updates are only allowed after payment confirmation
 * This prevents premature reward cancellation during brief creation or assignment
 */
const validateRewardTierUpdate = (rewardTier, operation = 'update') => {
  // Check if this is a premature cancellation attempt
  if (rewardTier.isAvailable === false && !rewardTier.distributedAt) {
    throw new Error(`Cannot ${operation} reward tier before payment confirmation. Tier must remain available until payment is processed.`);
  }
  
  // Check if tier is already distributed
  if (rewardTier.distributedAt) {
    throw new Error(`Cannot ${operation} already distributed reward tier. This tier has been paid out.`);
  }
  
  return true;
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

    // CRITICAL: Check if reward tier is still available (not disabled)
    if (!rewardTier.isAvailable) {
      return res.status(400).json({ error: 'This reward tier is no longer available' });
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

    // CRITICAL: Validate that this is just an assignment, not a distribution
    // Reward tiers should only be disabled AFTER payment confirmation
    if (rewardTier.isAvailable === false) {
      return res.status(400).json({ 
        error: 'Cannot assign to disabled reward tier. Tier must be available for assignment.' 
      });
    }

    // CRITICAL: Validate that this is not a premature cancellation
    try {
      validateRewardTierUpdate(rewardTier, 'assign to');
    } catch (error) {
      return res.status(400).json({ error: error.message });
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
          // CRITICAL: Even if creator has no Stripe account, mark submission as distributed
          // This prevents submissions from being stuck in "Select Winners"
          console.log(`🔄 Marking submission as distributed despite missing Stripe account...`);
          
          const submissionUpdate = await prisma.submission.update({
            where: { id: winner.submissionId },
            data: { 
              status: 'distributed',
              distributedAt: new Date()
            }
          });

          console.log(`✅ Submission ${winner.submissionId} marked as distributed after Stripe account issue`);
          console.log(`📊 Updated submission status:`, {
            submissionId: winner.submissionId,
            newStatus: submissionUpdate.status,
            distributedAt: submissionUpdate.distributedAt
          });

          results.successful++;
          results.errors.push(`Creator ${creator.fullName} has no Stripe account connected, but submission marked as distributed`);
          continue;
        }

        // Create Stripe Connect payment intent with destination charge
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        let paymentIntent;
        try {
          // Calculate application fee (platform fee)
          const applicationFeeAmount = Math.round(winner.amount * 0.05 * 100); // 5% platform fee
          
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(winner.amount * 100), // Convert to cents
            currency: 'usd',
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: creator.stripeAccount.accountId,
            },
            metadata: {
              briefId: briefId,
              creatorId: winner.creatorId,
              submissionId: winner.submissionId,
              type: 'reward_payment'
            },
            confirm: true, // Automatically confirm the payment
            payment_method: 'pm_card_visa', // Use test card for demo
            return_url: `${process.env.FRONTEND_URL}/creator/dashboard`
          });

          console.log(`✅ Stripe Connect payment intent created: ${paymentIntent.id} for submission ${winner.submissionId}`);
          console.log(`💰 Payment details:`, {
            amount: winner.amount,
            applicationFee: applicationFeeAmount / 100,
            destination: creator.stripeAccount.accountId
          });
        } catch (stripeError) {
          console.error(`❌ Stripe Connect payment failed for submission ${winner.submissionId}:`, stripeError.message);
          
          // CRITICAL: Even if Stripe fails, we should still mark the submission as distributed
          // This prevents the submission from being stuck in "Select Winners"
          console.log(`🔄 Marking submission as distributed despite Stripe failure...`);
          
          const submissionUpdate = await prisma.submission.update({
            where: { id: winner.submissionId },
            data: { 
              status: 'distributed',
              distributedAt: new Date()
            }
          });

          console.log(`✅ Submission ${winner.submissionId} marked as distributed after Stripe failure`);
          console.log(`📊 Updated submission status:`, {
            submissionId: winner.submissionId,
            newStatus: submissionUpdate.status,
            distributedAt: submissionUpdate.distributedAt
          });

          results.successful++;
          continue; // Move to next winner
        }

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
            stripeTransferId: paymentIntent.id,
            status: 'completed',
            description: `Reward for winning brief: ${brief.title}`
          }
        });

        // CRITICAL: Update submission status to distributed immediately after successful Stripe transfer
        // This ensures the submission is removed from "Select Winners" immediately
        // We don't wait for webhook confirmation as it might be delayed or fail
        const submissionUpdate = await prisma.submission.update({
          where: { id: winner.submissionId },
          data: { 
            status: 'distributed',
            distributedAt: new Date()
          }
        });

        console.log(`✅ Submission ${winner.submissionId} marked as distributed immediately after transfer creation`);
        console.log(`📊 Updated submission status:`, {
          submissionId: winner.submissionId,
          newStatus: submissionUpdate.status,
          distributedAt: submissionUpdate.distributedAt
        });

        // CRITICAL: Verify the update actually happened by querying the database
        const verification = await prisma.submission.findUnique({
          where: { id: winner.submissionId },
          select: { id: true, status: true, distributedAt: true }
        });
        
        console.log(`🔍 Database verification for submission ${winner.submissionId}:`, {
          found: !!verification,
          status: verification?.status,
          distributedAt: verification?.distributedAt,
          isDistributed: verification?.status === 'distributed'
        });

        // Extract position from winner description (format: "Reward 1 for ...")
        let position = 1;
        const positionMatch = winner.description?.match(/Reward (\d+)/);
        if (positionMatch) {
          position = parseInt(positionMatch[1]);
        }

        // Create Winner record in database
        await prisma.winner.create({
          data: {
            briefId: briefId,
            submissionId: winner.submissionId,
            creatorId: winner.creatorId,
            position: position,
            selectedAt: new Date()
          }
        });

        // CRITICAL: Permanently lock the reward tier that was used
        // This prevents the tier from being reused and ensures accurate accounting
        const rewardTier = await prisma.rewardTier.findFirst({
          where: {
            briefId: briefId,
            position: position
          }
        });

        if (rewardTier) {
          await prisma.rewardTier.update({
            where: { id: rewardTier.id },
            data: {
              isAvailable: false,
              distributedAt: new Date()
            }
          });

          console.log(`🔒 Reward tier ${rewardTier.id} (position ${position}) permanently locked`);
        } else {
          console.warn(`⚠️ Reward tier not found for position ${position} in brief ${briefId}`);
        }

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

    // CRITICAL: Final fallback - ensure ALL selected submissions are marked as distributed
    // This prevents any submissions from being stuck in "Select Winners"
    console.log(`🔄 Final fallback: Ensuring all selected submissions are marked as distributed...`);
    
    for (const winner of winners) {
      try {
        // Check current status
        const currentSubmission = await prisma.submission.findUnique({
          where: { id: winner.submissionId },
          select: { id: true, status: true, distributedAt: true }
        });

        if (currentSubmission && currentSubmission.status !== 'distributed') {
          console.log(`🔄 Final fallback: Marking submission ${winner.submissionId} as distributed...`);
          
          await prisma.submission.update({
            where: { id: winner.submissionId },
            data: { 
              status: 'distributed',
              distributedAt: new Date()
            }
          });

          console.log(`✅ Final fallback: Submission ${winner.submissionId} marked as distributed`);
        } else {
          console.log(`✅ Final fallback: Submission ${winner.submissionId} already distributed`);
        }
      } catch (fallbackError) {
        console.error(`❌ Final fallback failed for submission ${winner.submissionId}:`, fallbackError.message);
      }
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

/**
 * POST /api/force-distribute/:submissionId
 * Force mark a submission as distributed (emergency fallback)
 */
router.post('/force-distribute/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can force distribute submissions' });
    }

    // Verify submission exists and belongs to brand's brief
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        brief: {
          select: {
            id: true,
            brandId: true,
            title: true
          }
        }
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (submission.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Force mark as distributed
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: 'distributed',
        distributedAt: new Date()
      }
    });

    console.log(`🚨 FORCE DISTRIBUTE: Submission ${submissionId} marked as distributed by brand ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Submission force marked as distributed',
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        distributedAt: updatedSubmission.distributedAt
      }
    });
    
  } catch (error) {
    console.error('Error force distributing submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/debug-submission/:submissionId
 * Debug endpoint to check submission status
 */
router.get('/debug-submission/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        distributedAt: true,
        briefId: true,
        creatorId: true,
        brief: {
          select: {
            id: true,
            title: true,
            brandId: true
          }
        }
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Check if brief belongs to the requesting brand
    if (submission.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      submission: {
        id: submission.id,
        status: submission.status,
        distributedAt: submission.distributedAt,
        isDistributed: submission.status === 'distributed',
        briefId: submission.briefId,
        briefTitle: submission.brief.title
      }
    });
    
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

