const express = require('express');
const router = express.Router();

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Use shared Prisma client
const prisma = require('./prisma');

/**
 * Reward Distribution System
 * Handles cash, credit, and prize reward distribution
 */

// Distribute Multiple Rewards (Cash, Credit, Prize)
router.post('/distribute', async (req, res) => {
  try {
    // Check if Stripe is configured (needed for cash rewards)
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { briefId, winners } = req.body;

    if (!briefId || !winners || !Array.isArray(winners)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const results = [];
    const errors = [];

    for (const winner of winners) {
      try {
        const result = await distributeReward({
          briefId,
          creatorId: winner.creatorId,
          rewardType: winner.rewardType,
          amount: winner.amount,
          description: winner.description,
          prizeDetails: winner.prizeDetails
        });

        results.push(result);
      } catch (error) {
        console.error(`Error distributing reward to creator ${winner.creatorId}:`, error);
        errors.push({
          creatorId: winner.creatorId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      errors,
      totalProcessed: winners.length,
      successful: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Error in reward distribution:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

// Distribute Single Reward
async function distributeReward({ briefId, creatorId, rewardType, amount, description, prizeDetails }) {
  switch (rewardType) {
    case 'cash':
      return await distributeCashReward(briefId, creatorId, amount, description);
    case 'credit':
      return await distributeCreditReward(briefId, creatorId, amount, description);
    case 'prize':
      return await distributePrizeReward(briefId, creatorId, prizeDetails, description);
    default:
      throw new Error(`Invalid reward type: ${rewardType}`);
  }
}

// Distribute Cash Reward via Stripe Connect
async function distributeCashReward(briefId, creatorId, amount, description) {
  try {
    // Get creator's Stripe account ID from database
    const creator = await getCreatorById(creatorId);
    
    if (!creator || !creator.stripe_account_id) {
      throw new Error('Creator not found or Stripe account not connected');
    }

    // Verify account is ready for transfers
    const account = await stripe.accounts.retrieve(creator.stripe_account_id);
    
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error('Creator account not ready for transfers');
    }

    // Create transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: creator.stripe_account_id,
      description: description || `Cash reward for brief ${briefId}`,
      metadata: {
        briefId: briefId.toString(),
        creatorId: creatorId.toString(),
        type: 'cash_reward'
      }
    });

    // Log reward in database
    const reward = await logReward({
      briefId,
      creatorId,
      rewardType: 'cash',
      amount,
      description,
      stripeTransferId: transfer.id,
      status: 'completed'
    });

    return {
      type: 'cash',
      creatorId,
      amount,
      transferId: transfer.id,
      rewardId: reward.id,
      status: 'success'
    };

  } catch (error) {
    console.error('Error distributing cash reward:', error);
    throw error;
  }
}

// Distribute Credit Reward (In-app Credits)
async function distributeCreditReward(briefId, creatorId, amount, description) {
  try {
    // Update creator's credit balance in database
    const updatedCreator = await updateCreatorCredits(creatorId, amount);

    // Log reward in database
    const reward = await logReward({
      briefId,
      creatorId,
      rewardType: 'credit',
      amount,
      description,
      status: 'completed'
    });

    return {
      type: 'credit',
      creatorId,
      amount,
      newBalance: updatedCreator.credit_balance,
      rewardId: reward.id,
      status: 'success'
    };

  } catch (error) {
    console.error('Error distributing credit reward:', error);
    throw error;
  }
}

// Distribute Prize Reward (Non-cash)
async function distributePrizeReward(briefId, creatorId, prizeDetails, description) {
  try {
    // Log prize reward in database
    const reward = await logReward({
      briefId,
      creatorId,
      rewardType: 'prize',
      amount: 0, // Prizes don't have monetary value
      description,
      prizeDetails: JSON.stringify(prizeDetails),
      status: 'completed'
    });

    return {
      type: 'prize',
      creatorId,
      prizeDetails,
      rewardId: reward.id,
      status: 'success'
    };

  } catch (error) {
    console.error('Error distributing prize reward:', error);
    throw error;
  }
}

// Get Creator's Reward History
router.get('/creator/:creatorId/history', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const rewards = await getCreatorRewards(creatorId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    res.json(rewards);
  } catch (error) {
    console.error('Error fetching creator rewards:', error);
    res.status(500).json({ error: 'Failed to fetch reward history' });
  }
});

// Get Creator's Credit Balance
router.get('/creator/:creatorId/credits', async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await getCreatorById(creatorId);
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({
      creatorId,
      creditBalance: creator.credit_balance || 0,
      lastUpdated: creator.updated_at
    });
  } catch (error) {
    console.error('Error fetching creator credits:', error);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
});

// Redeem Credits (Convert to Cash)
router.post('/redeem-credits', async (req, res) => {
  try {
    const { creatorId, amount, description } = req.body;

    if (!creatorId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid redemption request' });
    }

    // Check if creator has sufficient credits
    const creator = await getCreatorById(creatorId);
    
    if (!creator || (creator.credit_balance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Check if creator has Stripe account
    if (!creator.stripe_account_id) {
      return res.status(400).json({ error: 'Stripe account not connected' });
    }

    // Deduct credits from balance
    await updateCreatorCredits(creatorId, -amount);

    // Transfer cash via Stripe
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: creator.stripe_account_id,
      description: description || 'Credit redemption',
      metadata: {
        creatorId: creatorId.toString(),
        type: 'credit_redemption'
      }
    });

    // Log the redemption
    await logReward({
      briefId: null,
      creatorId,
      rewardType: 'credit_redemption',
      amount: -amount,
      description: `Credit redemption: ${description || 'Credits converted to cash'}`,
      stripeTransferId: transfer.id,
      status: 'completed'
    });

    res.json({
      success: true,
      amount,
      transferId: transfer.id,
      newCreditBalance: (creator.credit_balance || 0) - amount
    });

  } catch (error) {
    console.error('Error redeeming credits:', error);
    res.status(500).json({ error: 'Failed to redeem credits' });
  }
});

// Database Helper Functions using Prisma
async function getCreatorById(creatorId) {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: { wallet: true }
  });
  
  return creator ? {
    id: creator.id,
    stripe_account_id: creator.stripeAccountId,
    credit_balance: creator.wallet?.balance || 0
  } : null;
}

async function updateCreatorCredits(creatorId, amount) {
  // Get or create wallet
  let wallet = await prisma.creatorWallet.findUnique({
    where: { creatorId }
  });

  if (!wallet) {
    wallet = await prisma.creatorWallet.create({
      data: {
        creatorId,
        balance: amount
      }
    });
  } else {
    wallet = await prisma.creatorWallet.update({
      where: { creatorId },
      data: {
        balance: wallet.balance + amount
      }
    });
  }

  return {
    id: creatorId,
    credit_balance: wallet.balance
  };
}

async function logReward(rewardData) {
  // Create WinnerReward record
  const reward = await prisma.winnerReward.create({
    data: {
      briefId: rewardData.briefId,
      position: 1, // Default position
      cashAmount: rewardData.rewardType === 'cash' ? rewardData.amount : 0,
      creditAmount: rewardData.rewardType === 'credit' ? rewardData.amount : 0,
      prizeDescription: rewardData.rewardType === 'prize' ? rewardData.description : null,
      isPaid: rewardData.status === 'completed'
    }
  });

  return {
    id: reward.id,
    ...rewardData,
    created_at: reward.createdAt
  };
}

async function getCreatorRewards(creatorId, options) {
  const rewards = await prisma.winnerReward.findMany({
    where: {
      winner: {
        creatorId: creatorId
      }
    },
    include: {
      winner: {
        include: {
          brief: true
        }
      }
    },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.winnerReward.count({
    where: {
      winner: {
        creatorId: creatorId
      }
    }
  });

  return {
    rewards: rewards.map(reward => ({
      id: reward.id,
      briefId: reward.briefId,
      rewardType: reward.cashAmount > 0 ? 'cash' : reward.creditAmount > 0 ? 'credit' : 'prize',
      amount: reward.cashAmount || reward.creditAmount || 0,
      description: reward.prizeDescription || `Reward for brief ${reward.briefId}`,
      status: reward.isPaid ? 'completed' : 'pending',
      createdAt: reward.createdAt.toISOString()
    })),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit)
    }
  };
}

module.exports = router;
