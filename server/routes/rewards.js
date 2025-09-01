const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Use shared Prisma client
const prisma = require('../prisma');

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
    console.log('🔍 GET /api/rewards/brand/pools - Request received');
    const userId = req.user.id;
    const userType = req.user.type;
    
    console.log('🔍 User info:', { userId, userType });

    if (userType !== 'brand') {
      console.log('❌ Access denied: User is not a brand');
      return res.status(403).json({ error: 'Only brands can access this endpoint' });
    }

    console.log('🔍 Querying reward pools for brand:', userId);
    
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

    console.log('✅ Found reward pools:', rewardPools.length);
    res.json(rewardPools);
  } catch (error) {
    console.error('❌ Get brand pools error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    res.status(500).json({ error: 'Failed to get reward pools', details: error.message });
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

// Distribute rewards to winners
router.post('/distribute', auth, async (req, res) => {
  try {
    console.log('🎯 Distribute rewards request:', {
      body: req.body,
      userId: req.user?.id,
      userType: req.user?.type
    });
    
    const { poolId, winners } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can distribute rewards' });
    }

    if (!poolId || !winners || !Array.isArray(winners)) {
      return res.status(400).json({ error: 'Invalid pool ID or winners data' });
    }

    // Get the reward pool
    const pool = await prisma.rewardPool.findFirst({
      where: {
        id: poolId,
        brief: {
          brandId: userId
        }
      },
      include: {
        brief: true
      }
    });

    if (!pool) {
      return res.status(404).json({ error: 'Reward pool not found' });
    }

    if (pool.status !== 'active') {
      return res.status(400).json({ error: 'Reward pool is not active' });
    }

    // Calculate total reward amount
    const totalRewardAmount = winners.reduce((sum, winner) => sum + winner.amount, 0);

    if (totalRewardAmount > pool.remainingAmount) {
      return res.status(400).json({ error: 'Total reward amount exceeds remaining pool amount' });
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create reward transactions for each winner
      const rewardTransactions = [];
      for (const winner of winners) {
        // Get the submission to find the creator
        const submission = await tx.submission.findUnique({
          where: { id: winner.submissionId },
          include: { creator: true }
        });

        if (!submission) {
          throw new Error(`Submission ${winner.submissionId} not found`);
        }

        // Create reward transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: submission.creatorId,
            userType: 'creator',
            type: 'reward',
            amount: winner.amount,
            status: 'completed'
          }
        });

        rewardTransactions.push(transaction);

        // Update creator wallet
        await tx.creatorWallet.upsert({
          where: { creatorId: submission.creatorId },
          update: {
            balance: { increment: winner.amount },
            totalEarned: { increment: winner.amount }
          },
          create: {
            creatorId: submission.creatorId,
            balance: winner.amount,
            totalEarned: winner.amount
          }
        });
      }

      // Update reward pool
      const updatedPool = await tx.rewardPool.update({
        where: { id: poolId },
        data: {
          remainingAmount: { decrement: totalRewardAmount },
          status: pool.remainingAmount - totalRewardAmount <= 0 ? 'distributed' : 'active'
        }
      });

      // Update brand wallet (deduct from balance)
      await tx.brandWallet.upsert({
        where: { brandId: userId },
        update: {
          balance: { decrement: totalRewardAmount },
          totalSpent: { increment: totalRewardAmount }
        },
        create: {
          brandId: userId,
          balance: -totalRewardAmount,
          totalSpent: totalRewardAmount
        }
      });

      return { rewardTransactions, updatedPool };
    });

    res.json({
      success: true,
      message: 'Rewards distributed successfully',
      distributedAmount: totalRewardAmount,
      winnersCount: winners.length,
      poolStatus: result.updatedPool.status
    });

  } catch (error) {
    console.error('❌ Distribute rewards error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

// Enhanced reward distribution with Stripe integration
router.post('/distribute-with-stripe', auth, async (req, res) => {
  try {
    const { briefId, winners } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'brand') {
      return res.status(403).json({ error: 'Only brands can distribute rewards' });
    }

    // Verify brief belongs to the brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: userId
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Get reward pool for this brief
    const rewardPool = await prisma.rewardPool.findUnique({
      where: { briefId: briefId }
    });

    if (!rewardPool) {
      return res.status(404).json({ error: 'Reward pool not found for this brief' });
    }

    if (rewardPool.status !== 'active') {
      return res.status(400).json({ error: 'Reward pool is not active' });
    }

    // Calculate total reward amount
    const totalRewardAmount = winners.reduce((sum, winner) => sum + winner.amount, 0);

    if (totalRewardAmount > rewardPool.remainingAmount) {
      return res.status(400).json({ error: 'Total reward amount exceeds remaining pool amount' });
    }

    const distributionResults = [];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Process each winner
    for (const winner of winners) {
      try {
        // Get submission and creator details
        const submission = await prisma.submission.findUnique({
          where: { id: winner.submissionId },
          include: { creator: true }
        });

        if (!submission) {
          distributionResults.push({
            submissionId: winner.submissionId,
            success: false,
            error: 'Submission not found'
          });
          continue;
        }

        const creator = submission.creator;

        // Handle different reward types
        if (winner.rewardType === 'cash') {
          // Check if creator has Stripe Connect account
          if (!creator.stripeAccountId) {
            distributionResults.push({
              submissionId: winner.submissionId,
              creatorId: creator.id,
              success: false,
              error: 'Creator does not have Stripe account connected'
            });
            continue;
          }

          // Distribute cash via Stripe Connect
          try {
            const transfer = await stripe.transfers.create({
              amount: Math.round(winner.amount * 100), // Convert to cents
              currency: 'usd',
              destination: creator.stripeAccountId,
              description: `Reward for brief: ${brief.title}`,
              metadata: {
                briefId: briefId,
                creatorId: creator.id,
                submissionId: winner.submissionId,
                type: 'cash_reward'
              }
            });

            // Update creator wallet
            await prisma.creatorWallet.upsert({
              where: { creatorId: creator.id },
              update: {
                balance: { increment: winner.amount },
                updatedAt: new Date()
              },
              create: {
                creatorId: creator.id,
                balance: winner.amount
              }
            });

            // Record transaction
            await prisma.transaction.create({
              data: {
                userId: creator.id,
                userType: 'creator',
                type: 'reward',
                amount: winner.amount,
                status: 'completed',
                stripeTransferId: transfer.id,
                metadata: {
                  briefId: briefId,
                  submissionId: winner.submissionId,
                  rewardType: 'cash'
                }
              }
            });

            distributionResults.push({
              submissionId: winner.submissionId,
              creatorId: creator.id,
              amount: winner.amount,
              rewardType: 'cash',
              stripeTransferId: transfer.id,
              success: true
            });

          } catch (stripeError) {
            console.error('Stripe transfer failed:', stripeError);
            distributionResults.push({
              submissionId: winner.submissionId,
              creatorId: creator.id,
              success: false,
              error: 'Stripe transfer failed: ' + stripeError.message
            });
          }

        } else if (winner.rewardType === 'credit') {
          // Handle credit rewards (internal wallet)
          await prisma.creatorWallet.upsert({
            where: { creatorId: creator.id },
            update: {
              balance: { increment: winner.amount },
              updatedAt: new Date()
            },
            create: {
              creatorId: creator.id,
              balance: winner.amount
            }
          });

          // Record transaction
          await prisma.transaction.create({
            data: {
              userId: creator.id,
              userType: 'creator',
              type: 'reward',
              amount: winner.amount,
              status: 'completed',
              metadata: {
                briefId: briefId,
                submissionId: winner.submissionId,
                rewardType: 'credit'
              }
            }
          });

          distributionResults.push({
            submissionId: winner.submissionId,
            creatorId: creator.id,
            amount: winner.amount,
            rewardType: 'credit',
            success: true
          });

        } else if (winner.rewardType === 'prize') {
          // Handle prize rewards
          await prisma.transaction.create({
            data: {
              userId: creator.id,
              userType: 'creator',
              type: 'reward',
              amount: 0, // Prizes don't have monetary value in wallet
              status: 'completed',
              metadata: {
                briefId: briefId,
                submissionId: winner.submissionId,
                rewardType: 'prize',
                prizeDetails: winner.prizeDetails
              }
            }
          });

          distributionResults.push({
            submissionId: winner.submissionId,
            creatorId: creator.id,
            rewardType: 'prize',
            prizeDetails: winner.prizeDetails,
            success: true
          });
        }

      } catch (error) {
        console.error('Error processing winner:', error);
        distributionResults.push({
          submissionId: winner.submissionId,
          success: false,
          error: 'Processing failed: ' + error.message
        });
      }
    }

    // Update reward pool
    const successfulAmount = distributionResults
      .filter(result => result.success && result.amount)
      .reduce((sum, result) => sum + result.amount, 0);

    await prisma.rewardPool.update({
      where: { id: rewardPool.id },
      data: {
        remainingAmount: { decrement: successfulAmount },
        status: rewardPool.remainingAmount - successfulAmount === 0 ? 'distributed' : 'active'
      }
    });

    // Create winner records
    for (const winner of winners) {
      const submission = await prisma.submission.findUnique({
        where: { id: winner.submissionId }
      });

      if (submission) {
        await prisma.winner.create({
          data: {
            briefId: briefId,
            submissionId: winner.submissionId,
            creatorId: submission.creatorId,
            position: winner.position || 1,
            rewardType: winner.rewardType,
            amount: winner.amount || 0,
            status: 'awarded'
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Rewards distributed successfully',
      results: distributionResults,
      totalDistributed: successfulAmount
    });

  } catch (error) {
    console.error('Enhanced reward distribution error:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

module.exports = router;
