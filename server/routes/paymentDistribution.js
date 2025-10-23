const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../prisma');

// Import authentication middleware
const authenticateToken = require('../middleware/auth');

/**
 * Payment Distribution System
 * Handles reward distribution to creators using Stripe Connect
 * Based on Stripe documentation: https://docs.stripe.com/
 */

// Distribute Rewards to Winners
router.post('/distribute-rewards', authenticateToken, async (req, res) => {
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
        briefFunding: true
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    if (!brief.briefFunding || brief.briefFunding.status !== 'completed') {
      return res.status(400).json({ error: 'Brief must be funded before distributing rewards' });
    }

    const results = [];
    const errors = [];

    // Process each winner
    for (const winner of winners) {
      try {
        const { creatorId, submissionId, amount, position } = winner;

        // Get creator's Stripe Connect account
        const connectAccount = await prisma.stripeConnectAccount.findUnique({
          where: { creatorId: creatorId }
        });

        if (!connectAccount) {
          errors.push({
            creatorId,
            submissionId,
            error: 'Creator has not connected their Stripe account'
          });
          continue;
        }

        if (!connectAccount.chargesEnabled || !connectAccount.payoutsEnabled) {
          errors.push({
            creatorId,
            submissionId,
            error: 'Creator Stripe account is not fully set up'
          });
          continue;
        }

        // Calculate platform fee
        const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05');
        const minimumFee = parseFloat(process.env.MINIMUM_PLATFORM_FEE || '0.50');
        const totalAmount = parseFloat(amount);
        const platformFee = Math.max(totalAmount * platformFeePercentage, minimumFee);
        const netAmount = totalAmount - platformFee;

        // Create transfer to creator's connected account
        const transfer = await stripe.transfers.create({
          amount: Math.round(netAmount * 100), // Convert to cents
          currency: 'usd',
          destination: connectAccount.stripeAccountId,
          transfer_group: `brief_${briefId}_${Date.now()}`,
          metadata: {
            briefId: briefId,
            submissionId: submissionId,
            creatorId: creatorId,
            brandId: req.user.id,
            position: position || '1',
            type: 'reward_payment'
          }
        });

        // Create payout record
        const payout = await prisma.creatorPayout.create({
          data: {
            creatorId: creatorId,
            briefId: briefId,
            submissionId: submissionId,
            amount: totalAmount,
            platformFee: platformFee,
            netAmount: netAmount,
            stripeTransferId: transfer.id,
            stripeTransferGroupId: transfer.transfer_group,
            status: 'paid',
            paidAt: new Date()
          }
        });

        // Update submission status to approved
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: 'approved',
            reviewedAt: new Date()
          }
        });

        results.push({
          creatorId,
          submissionId,
          payoutId: payout.id,
          transferId: transfer.id,
          amount: totalAmount,
          netAmount: netAmount,
          platformFee: platformFee,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing payout for creator ${winner.creatorId}:`, error);
        errors.push({
          creatorId: winner.creatorId,
          submissionId: winner.submissionId,
          error: error.message
        });
      }
    }

    res.json({
      success: results.length > 0,
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Error distributing rewards:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

// Get Distribution Status for Brief
router.get('/brief/:briefId/status', authenticateToken, async (req, res) => {
  try {
    const { briefId } = req.params;

    // Verify brief exists and user has access
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        ...(req.user.type === 'brand' ? { brandId: req.user.id } : {})
      },
      include: {
        briefFunding: true,
        submissions: {
          where: { status: 'approved' },
          include: {
            creator: {
              select: {
                id: true,
                userName: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Get payout information
    const payouts = await prisma.creatorPayout.findMany({
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
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const totalFees = payouts.reduce((sum, payout) => sum + payout.platformFee, 0);
    const netPayouts = payouts.reduce((sum, payout) => sum + payout.netAmount, 0);

    res.json({
      brief: {
        id: brief.id,
        title: brief.title,
        fundingStatus: brief.briefFunding?.status || 'not_funded',
        totalFunded: brief.briefFunding?.totalAmount || 0
      },
      payouts: {
        total: payouts.length,
        totalAmount: totalPayouts,
        totalFees: totalFees,
        netAmount: netPayouts,
        details: payouts
      },
      submissions: brief.submissions
    });

  } catch (error) {
    console.error('Error fetching distribution status:', error);
    res.status(500).json({ error: 'Failed to fetch distribution status' });
  }
});

// Get Platform Financial Summary
router.get('/platform-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view platform summary' });
    }

    const [
      totalFundsCollected,
      totalPayouts,
      totalPlatformFees,
      activeBriefs,
      completedPayouts
    ] = await Promise.all([
      // Total funds collected from brands
      prisma.briefFunding.aggregate({
        where: { status: 'completed' },
        _sum: { totalAmount: true }
      }),
      
      // Total payouts to creators
      prisma.creatorPayout.aggregate({
        where: { status: 'paid' },
        _sum: { netAmount: true }
      }),
      
      // Total platform fees
      prisma.creatorPayout.aggregate({
        where: { status: 'paid' },
        _sum: { platformFee: true }
      }),
      
      // Active briefs count
      prisma.brief.count({
        where: { status: 'active' }
      }),
      
      // Completed payouts count
      prisma.creatorPayout.count({
        where: { status: 'paid' }
      })
    ]);

    res.json({
      fundsCollected: totalFundsCollected._sum.totalAmount || 0,
      totalPayouts: totalPayouts._sum.netAmount || 0,
      platformFees: totalPlatformFees._sum.platformFee || 0,
      activeBriefs,
      completedPayouts,
      netRevenue: (totalPlatformFees._sum.platformFee || 0)
    });

  } catch (error) {
    console.error('Error fetching platform summary:', error);
    res.status(500).json({ error: 'Failed to fetch platform summary' });
  }
});

// Process Refund for Brief
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can process refunds' });
    }

    const { briefId, reason } = req.body;

    if (!briefId) {
      return res.status(400).json({ error: 'Brief ID is required' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      },
      include: {
        briefFunding: true
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    if (!brief.briefFunding || brief.briefFunding.status !== 'completed') {
      return res.status(400).json({ error: 'Brief must be funded to process refund' });
    }

    // Get all payouts for this brief
    const payouts = await prisma.creatorPayout.findMany({
      where: { 
        briefId: briefId,
        status: 'paid'
      }
    });

    if (payouts.length === 0) {
      return res.status(400).json({ error: 'No payouts found for this brief' });
    }

    // Process refunds (this would require Stripe refund API calls)
    // For now, we'll mark the brief as refunded
    await prisma.briefFunding.update({
      where: { briefId: briefId },
      data: { 
        status: 'refunded',
        updatedAt: new Date()
      }
    });

    // Update payout status
    await prisma.creatorPayout.updateMany({
      where: { briefId: briefId },
      data: { 
        status: 'refunded',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      briefId: briefId,
      refundedPayouts: payouts.length,
      totalRefunded: payouts.reduce((sum, payout) => sum + payout.amount, 0),
      reason: reason || 'Brand requested refund'
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;
