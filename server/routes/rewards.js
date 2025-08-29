const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Create reward pool
router.post('/create-pool', auth, async (req, res) => {
  try {
    const { briefId, amount, paymentMethod = 'wallet' } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create reward pools' });
    }

    if (!briefId || !amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid brief ID or amount' });
    }

    // Check if brief exists and belongs to the brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: userId
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Check if reward pool already exists for this brief
    const existingPool = await prisma.rewardPool.findUnique({
      where: { briefId: briefId }
    });

    if (existingPool) {
      return res.status(400).json({ error: 'Reward pool already exists for this brief' });
    }

    // Handle payment method
    if (paymentMethod === 'wallet') {
      // Check wallet balance
      const wallet = await prisma.brandWallet.findUnique({
        where: { brandId: userId }
      });

      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      // Deduct from wallet
      await prisma.brandWallet.update({
        where: { brandId: userId },
        data: {
          balance: { decrement: amount },
          updatedAt: new Date()
        }
      });

      // Record transaction
      await prisma.transaction.create({
        data: {
          userId: userId,
          userType: userType,
          type: 'reward_creation',
          amount: amount,
          status: 'completed'
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

    res.json({
      success: true,
      message: 'Reward pool created successfully',
      pool: rewardPool
    });
  } catch (error) {
    console.error('Create reward pool error:', error);
    res.status(500).json({ error: 'Failed to create reward pool' });
  }
});

// Distribute rewards
router.post('/distribute/:poolId', auth, async (req, res) => {
  try {
    const { poolId } = req.params;
    const { distributions } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can distribute rewards' });
    }

    // Get reward pool
    const rewardPool = await prisma.rewardPool.findUnique({
      where: { id: poolId },
      include: {
        brief: true
      }
    });

    if (!rewardPool) {
      return res.status(404).json({ error: 'Reward pool not found' });
    }

    // Check if brief belongs to the brand
    if (rewardPool.brief.brandId !== userId) {
      return res.status(403).json({ error: 'Not authorized to distribute this reward pool' });
    }

    if (rewardPool.status !== 'active') {
      return res.status(400).json({ error: 'Reward pool is not active' });
    }

    // Calculate total distribution amount
    const totalDistributed = Object.values(distributions).reduce((sum, amount) => sum + amount, 0);

    if (totalDistributed > rewardPool.remainingAmount) {
      return res.status(400).json({ error: 'Total distribution exceeds remaining amount' });
    }

    // Distribute rewards to creators
    const distributionResults = [];
    for (const [creatorId, amount] of Object.entries(distributions)) {
      if (amount > 0) {
        // Update creator wallet
        await prisma.creatorWallet.upsert({
          where: { creatorId: creatorId },
          update: {
            balance: { increment: amount },
            updatedAt: new Date()
          },
          create: {
            creatorId: creatorId,
            balance: amount
          }
        });

        // Record transaction
        await prisma.transaction.create({
          data: {
            userId: creatorId,
            userType: 'creator',
            type: 'reward',
            amount: amount,
            status: 'completed'
          }
        });

        distributionResults.push({
          creatorId: creatorId,
          amount: amount
        });
      }
    }

    // Update reward pool
    await prisma.rewardPool.update({
      where: { id: poolId },
      data: {
        remainingAmount: { decrement: totalDistributed },
        status: rewardPool.remainingAmount - totalDistributed === 0 ? 'distributed' : 'active'
      }
    });

    res.json({
      success: true,
      message: 'Rewards distributed successfully',
      totalDistributed: totalDistributed,
      results: distributionResults
    });
  } catch (error) {
    console.error('Distribute rewards error:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

// Get reward pool status
router.get('/pool/:briefId', auth, async (req, res) => {
  try {
    const { briefId } = req.params;

    const rewardPool = await prisma.rewardPool.findUnique({
      where: { briefId: briefId },
      include: {
        brief: {
          select: {
            title: true,
            brandId: true
          }
        }
      }
    });

    if (!rewardPool) {
      return res.status(404).json({ error: 'Reward pool not found' });
    }

    res.json({
      pool: rewardPool
    });
  } catch (error) {
    console.error('Get reward pool error:', error);
    res.status(500).json({ error: 'Failed to get reward pool' });
  }
});

// Get brand's reward pools
router.get('/brand/pools', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can access this endpoint' });
    }

    const rewardPools = await prisma.rewardPool.findMany({
      where: {
        brief: {
          brandId: userId
        }
      },
      include: {
        brief: {
          select: {
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rewardPools);
  } catch (error) {
    console.error('Get brand pools error:', error);
    res.status(500).json({ error: 'Failed to get reward pools' });
  }
});

// Get creator earnings
router.get('/creator/earnings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'creator') {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    // Get total earnings
    const totalEarnings = await prisma.transaction.aggregate({
      where: {
        userId: userId,
        type: 'reward',
        status: 'completed'
      },
      _sum: { amount: true }
    });

    // Get recent rewards
    const recentRewards = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'reward',
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      totalEarnings: totalEarnings._sum.amount || 0,
      recentRewards: recentRewards
    });
  } catch (error) {
    console.error('Get creator earnings error:', error);
    res.status(500).json({ error: 'Failed to get creator earnings' });
  }
});

// Get brand analytics
router.get('/analytics/brand', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can access this endpoint' });
    }

    // Get total pools created
    const totalPools = await prisma.rewardPool.count({
      where: {
        brief: {
          brandId: userId
        }
      }
    });

    // Get total amount distributed
    const totalDistributed = await prisma.transaction.aggregate({
      where: {
        userId: userId,
        type: 'reward_creation',
        status: 'completed'
      },
      _sum: { amount: true }
    });

    // Get active pools
    const activePools = await prisma.rewardPool.count({
      where: {
        brief: {
          brandId: userId
        },
        status: 'active'
      }
    });

    // Calculate average pool size
    const pools = await prisma.rewardPool.findMany({
      where: {
        brief: {
          brandId: userId
        }
      },
      select: {
        totalAmount: true
      }
    });

    const averagePoolSize = pools.length > 0 
      ? pools.reduce((sum, pool) => sum + pool.totalAmount, 0) / pools.length 
      : 0;

    res.json({
      totalPools: totalPools,
      totalDistributed: totalDistributed._sum.amount || 0,
      activePools: activePools,
      averagePoolSize: averagePoolSize
    });
  } catch (error) {
    console.error('Get brand analytics error:', error);
    res.status(500).json({ error: 'Failed to get brand analytics' });
  }
});

module.exports = router;
