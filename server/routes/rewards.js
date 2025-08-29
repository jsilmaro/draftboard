const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== REWARD POOL CREATION ====================

// Create reward pool for a brief
router.post('/create-pool', auth, async (req, res) => {
  try {
    const { briefId, amount, paymentMethod = 'wallet' } = req.body;
    const brandId = req.user.id;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create reward pools' });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid reward amount' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: brandId
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Check if reward pool already exists
    const existingPool = await prisma.rewardPool.findFirst({
      where: { briefId: briefId }
    });

    if (existingPool) {
      return res.status(400).json({ error: 'Reward pool already exists for this brief' });
    }

    // Handle payment method
    if (paymentMethod === 'wallet') {
      // Check brand wallet balance
      const brandWallet = await prisma.brandWallet.findUnique({
        where: { brandId: brandId }
      });

      if (!brandWallet || brandWallet.balance < amount) {
        return res.status(400).json({ 
          error: 'Insufficient wallet balance',
          required: amount,
          available: brandWallet?.balance || 0
        });
      }

      // Deduct from wallet
      await prisma.brandWallet.update({
        where: { brandId: brandId },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount }
        }
      });

      // Record transaction
      await prisma.brandWalletTransaction.create({
        data: {
          walletId: brandId,
          type: 'reward_pool_creation',
          amount: -amount,
          description: `Reward pool creation for brief: ${brief.title}`,
          referenceId: briefId,
          balanceBefore: brandWallet.balance,
          balanceAfter: brandWallet.balance - amount
        }
      });
    }

    // Create reward pool
    const rewardPool = await prisma.rewardPool.create({
      data: {
        briefId: briefId,
        totalAmount: amount,
        remainingAmount: amount,
        status: 'active'
      }
    });

    // Update brief status
    await prisma.brief.update({
      where: { id: briefId },
      data: { status: 'active' }
    });

    res.json({
      success: true,
      rewardPool: rewardPool,
      message: `Reward pool created with $${amount}`
    });

  } catch (error) {
    console.error('Reward pool creation error:', error);
    res.status(500).json({ error: 'Failed to create reward pool' });
  }
});

// ==================== REWARD DISTRIBUTION ====================

// Distribute rewards to winners
router.post('/distribute', auth, async (req, res) => {
  try {
    const { briefId, winners } = req.body;
    const brandId = req.user.id;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can distribute rewards' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: brandId
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Get reward pool
    const rewardPool = await prisma.rewardPool.findFirst({
      where: { briefId: briefId }
    });

    if (!rewardPool || rewardPool.status !== 'active') {
      return res.status(400).json({ error: 'No active reward pool found' });
    }

    // Validate winners array
    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: 'Invalid winners data' });
    }

    // Calculate total reward amount
    const totalRewardAmount = winners.reduce((sum, winner) => sum + winner.amount, 0);

    if (totalRewardAmount > rewardPool.remainingAmount) {
      return res.status(400).json({ 
        error: 'Total reward amount exceeds remaining pool balance',
        requested: totalRewardAmount,
        available: rewardPool.remainingAmount
      });
    }

    const distributionResults = [];

    // Distribute rewards to each winner
    for (const winnerData of winners) {
      const { creatorId, amount, position } = winnerData;

      // Verify creator exists
      const creator = await prisma.creator.findUnique({
        where: { id: creatorId }
      });

      if (!creator) {
        distributionResults.push({
          creatorId,
          success: false,
          error: 'Creator not found'
        });
        continue;
      }

      // Get or create creator wallet
      let creatorWallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: creatorId }
      });

      if (!creatorWallet) {
        creatorWallet = await prisma.creatorWallet.create({
          data: {
            creatorId: creatorId,
            balance: amount,
            totalEarned: amount
          }
        });
      } else {
        // Update wallet balance
        creatorWallet = await prisma.creatorWallet.update({
          where: { creatorId: creatorId },
          data: {
            balance: { increment: amount },
            totalEarned: { increment: amount }
          }
        });
      }

      // Record transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: creatorId,
          type: 'reward_earned',
          amount: amount,
          description: `Reward for ${brief.title} - Position ${position}`,
          referenceId: briefId,
          balanceBefore: creatorWallet.balance - amount,
          balanceAfter: creatorWallet.balance
        }
      });

      // Create winner record
      await prisma.winner.create({
        data: {
          briefId: briefId,
          creatorId: creatorId,
          position: position,
          amount: amount,
          isPaid: true,
          paidAt: new Date()
        }
      });

      distributionResults.push({
        creatorId,
        success: true,
        amount: amount,
        position: position
      });
    }

    // Update reward pool
    await prisma.rewardPool.update({
      where: { id: rewardPool.id },
      data: {
        remainingAmount: { decrement: totalRewardAmount },
        status: rewardPool.remainingAmount - totalRewardAmount === 0 ? 'distributed' : 'active'
      }
    });

    // Update brief status
    await prisma.brief.update({
      where: { id: briefId },
      data: { 
        status: 'completed',
        closedAt: new Date()
      }
    });

    res.json({
      success: true,
      totalDistributed: totalRewardAmount,
      results: distributionResults,
      message: `Successfully distributed $${totalRewardAmount} to ${winners.length} winners`
    });

  } catch (error) {
    console.error('Reward distribution error:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

// ==================== REWARD POOL MANAGEMENT ====================

// Get reward pool status
router.get('/pool/:briefId', auth, async (req, res) => {
  try {
    const { briefId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    // Get brief details
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Check access permissions
    if (userType === 'brand' && brief.brandId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get reward pool
    const rewardPool = await prisma.rewardPool.findFirst({
      where: { briefId: briefId }
    });

    // Get winners if any
    const winners = await prisma.winner.findMany({
      where: { briefId: briefId },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
            fullName: true
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    res.json({
      brief: brief,
      rewardPool: rewardPool,
      winners: winners,
      totalWinners: winners.length,
      totalDistributed: winners.reduce((sum, winner) => sum + winner.amount, 0)
    });

  } catch (error) {
    console.error('Reward pool status error:', error);
    res.status(500).json({ error: 'Failed to get reward pool status' });
  }
});

// Get all reward pools for a brand
router.get('/brand/pools', auth, async (req, res) => {
  try {
    const brandId = req.user.id;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can access this endpoint' });
    }

    const rewardPools = await prisma.rewardPool.findMany({
      where: {
        brief: {
          brandId: brandId
        }
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true
          }
        },
        winners: {
          include: {
            creator: {
              select: {
                userName: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rewardPools);

  } catch (error) {
    console.error('Brand reward pools error:', error);
    res.status(500).json({ error: 'Failed to get reward pools' });
  }
});

// Get creator's earned rewards
router.get('/creator/earnings', auth, async (req, res) => {
  try {
    const creatorId = req.user.id;

    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    const earnings = await prisma.winner.findMany({
      where: { creatorId: creatorId },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            brand: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalEarned = earnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      earnings: earnings,
      totalEarned: totalEarned,
      totalWins: earnings.length
    });

  } catch (error) {
    console.error('Creator earnings error:', error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

// ==================== REWARD ANALYTICS ====================

// Get reward analytics for brands
router.get('/analytics/brand', auth, async (req, res) => {
  try {
    const brandId = req.user.id;

    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can access analytics' });
    }

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get reward pools
    const rewardPools = await prisma.rewardPool.findMany({
      where: {
        brief: {
          brandId: brandId
        },
        ...dateFilter
      },
      include: {
        brief: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    // Calculate analytics
    const totalRewardsCreated = rewardPools.reduce((sum, pool) => sum + pool.totalAmount, 0);
    const totalRewardsDistributed = rewardPools.reduce((sum, pool) => sum + (pool.totalAmount - pool.remainingAmount), 0);
    const activePools = rewardPools.filter(pool => pool.status === 'active').length;
    const completedPools = rewardPools.filter(pool => pool.status === 'distributed').length;

    res.json({
      totalRewardsCreated,
      totalRewardsDistributed,
      activePools,
      completedPools,
      rewardPools
    });

  } catch (error) {
    console.error('Brand analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;

