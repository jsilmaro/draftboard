const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Mock Stripe Implementation
 * Simulates Stripe functionality for development and testing
 * Handles brand funding, creator onboarding, and reward distribution
 */

// Mock data storage
const mockAccounts = new Map();
const mockTransfers = new Map();
const mockPaymentIntents = new Map();
const mockCheckoutSessions = new Map();

// Generate mock IDs
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create Mock Stripe Checkout Session for Brand Funding
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { briefId, amount, brandId } = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For wallet funding, we need to get the brandId from the token
    let actualBrandId = brandId;
    if (brandId === 'current-user' && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        actualBrandId = decoded.id;
      } catch (tokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const sessionId = generateId('cs');
    const paymentIntentId = generateId('pi');

    // Create mock checkout session
    const session = {
      id: sessionId,
      payment_intent: paymentIntentId,
      amount_total: Math.round(amount * 100),
      currency: 'usd',
      status: 'open',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment?session_id=${sessionId}`,
      metadata: {
        briefId: briefId ? briefId.toString() : 'wallet-funding',
        brandId: actualBrandId.toString(),
        type: briefId === 'wallet-funding' ? 'wallet_funding' : 'brief_funding'
      },
      created: Date.now()
    };

    // Store session
    mockCheckoutSessions.set(sessionId, session);

    // Create mock payment intent
    const paymentIntent = {
      id: paymentIntentId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        briefId: briefId ? briefId.toString() : 'wallet-funding',
        brandId: actualBrandId.toString(),
        type: briefId === 'wallet-funding' ? 'wallet_funding' : 'brief_funding'
      }
    };

    mockPaymentIntents.set(paymentIntentId, paymentIntent);

    console.log(`✅ Mock checkout session created: ${sessionId} for $${amount}`);

    res.json({ 
      sessionId: session.id, 
      url: session.url,
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('Error creating mock checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Mock Stripe Connect Account for Creator Onboarding
router.post('/create-connect-account', async (req, res) => {
  try {
    const { creatorId, email, name } = req.body;

    if (!creatorId || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountId = generateId('acct');

    // Create mock connect account
    const account = {
      id: accountId,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      requirements: {
        currently_due: ['legal_entity.type', 'legal_entity.first_name', 'legal_entity.last_name'],
        eventually_due: ['external_account'],
        past_due: [],
        pending_verification: []
      },
      metadata: {
        creatorId: creatorId.toString(),
        name: name
      }
    };

    // Store account
    mockAccounts.set(accountId, account);

    // Create mock onboarding URL
    const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/onboarding?account_id=${accountId}`;

    console.log(`✅ Mock connect account created: ${accountId} for ${name}`);

    res.json({ 
      accountId: account.id, 
      onboardingUrl: onboardingUrl,
      account: account 
    });
  } catch (error) {
    console.error('Error creating mock connect account:', error);
    res.status(500).json({ error: 'Failed to create connect account' });
  }
});

// Get Creator's Mock Connect Account Status
router.get('/connect-account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = mockAccounts.get(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Error retrieving mock connect account:', error);
    res.status(500).json({ error: 'Failed to retrieve account' });
  }
});

// Create Mock Login Link for Existing Connect Account
router.post('/create-login-link', async (req, res) => {
  try {
    const { accountId } = req.body;

    const account = mockAccounts.get(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/dashboard?account_id=${accountId}`;

    res.json({ url: loginUrl });
  } catch (error) {
    console.error('Error creating mock login link:', error);
    res.status(500).json({ error: 'Failed to create login link' });
  }
});

// Distribute Mock Cash Rewards via Stripe Connect
router.post('/distribute-cash-reward', async (req, res) => {
  try {
    const { creatorAccountId, amount, briefId, creatorId, description } = req.body;

    if (!creatorAccountId || !amount || !briefId || !creatorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transferId = generateId('tr');

    // Create mock transfer
    const transfer = {
      id: transferId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: creatorAccountId,
      description: description || `Reward for brief ${briefId}`,
      status: 'paid',
      metadata: {
        briefId: briefId.toString(),
        creatorId: creatorId.toString(),
        type: 'cash_reward'
      },
      created: Date.now()
    };

    // Store transfer
    mockTransfers.set(transferId, transfer);

    // Update creator wallet in database
    try {
      let creatorWallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: creatorId }
      });

      if (!creatorWallet) {
        creatorWallet = await prisma.creatorWallet.create({
          data: {
            creatorId: creatorId,
            balance: amount,
            totalEarned: amount,
            totalWithdrawn: 0
          }
        });
      } else {
        creatorWallet = await prisma.creatorWallet.update({
          where: { creatorId: creatorId },
          data: {
            balance: { increment: amount },
            totalEarned: { increment: amount }
          }
        });
      }

      // Create transaction record
      await prisma.walletTransaction.create({
        data: {
          walletId: creatorWallet.id,
          type: 'credit',
          amount: amount,
          description: `Cash reward for brief ${briefId}`,
          status: 'completed',
          balanceBefore: creatorWallet.balance - amount,
          balanceAfter: creatorWallet.balance,
          referenceId: transferId
        }
      });

      console.log(`✅ Mock cash reward distributed: $${amount} to creator ${creatorId} for brief ${briefId}`);
    } catch (dbError) {
      console.log('Database not available, simulating transfer:', dbError.message);
    }

    res.json({ 
      transferId: transfer.id,
      amount: amount,
      status: 'success'
    });
  } catch (error) {
    console.error('Error distributing mock cash reward:', error);
    res.status(500).json({ error: 'Failed to distribute cash reward' });
  }
});

// Create Mock Payment Intent for Platform Fee
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, briefId, brandId } = req.body;

    const paymentIntentId = generateId('pi');

    const paymentIntent = {
      id: paymentIntentId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        briefId: briefId.toString(),
        brandId: brandId.toString(),
        type: 'platform_fee'
      },
      created: Date.now()
    };

    mockPaymentIntents.set(paymentIntentId, paymentIntent);

    console.log(`✅ Mock payment intent created: ${paymentIntentId} for $${amount}`);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating mock payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm Mock Payment
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethod } = req.body;

    const paymentIntent = mockPaymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    // Simulate payment processing
    paymentIntent.status = 'succeeded';
    paymentIntent.payment_method = paymentMethod;

    // Update brand wallet
    try {
      const brandId = paymentIntent.metadata.brandId;
      const amount = paymentIntent.amount / 100;

      let brandWallet = await prisma.brandWallet.findUnique({
        where: { brandId: brandId }
      });

      if (!brandWallet) {
        brandWallet = await prisma.brandWallet.create({
          data: {
            brandId: brandId,
            balance: amount,
            totalSpent: 0,
            totalDeposited: amount
          }
        });
      } else {
        brandWallet = await prisma.brandWallet.update({
          where: { brandId: brandId },
          data: {
            balance: { increment: amount },
            totalDeposited: { increment: amount }
          }
        });
      }

      // Create transaction record
      await prisma.brandWalletTransaction.create({
        data: {
          walletId: brandWallet.id,
          type: 'deposit',
          amount: amount,
          description: `Wallet funding via Stripe`,
          status: 'completed',
          balanceBefore: brandWallet.balance - amount,
          balanceAfter: brandWallet.balance,
          referenceId: paymentIntentId
        }
      });

      console.log(`✅ Mock payment confirmed: $${amount} added to brand ${brandId} wallet`);
    } catch (dbError) {
      console.log('Database not available, simulating payment:', dbError.message);
    }

    res.json({ 
      status: 'succeeded',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });
  } catch (error) {
    console.error('Error confirming mock payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Mock Webhook Handler
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log(`🔔 Mock webhook received: ${type}`);

    // Handle the event
    switch (type) {
      case 'checkout.session.completed':
        await handleMockCheckoutSessionCompleted(data.object);
        break;
      case 'account.updated':
        await handleMockAccountUpdated(data.object);
        break;
      case 'transfer.created':
        await handleMockTransferCreated(data.object);
        break;
      case 'payment_intent.succeeded':
        await handleMockPaymentIntentSucceeded(data.object);
        break;
      default:
        console.log(`Unhandled mock event type ${type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling mock webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Mock Webhook Handlers
async function handleMockCheckoutSessionCompleted(session) {
  try {
    console.log('Mock checkout session completed:', session.id);
    
    const briefId = session.metadata.briefId;
    const brandId = session.metadata.brandId;
    const amount = session.amount_total / 100;

    // Update brief funding status
    try {
      await prisma.brief.update({
        where: { id: briefId },
        data: {
          fundedAmount: amount,
          fundedStatus: 'funded',
          stripeSessionId: session.id
        }
      });

      console.log(`✅ Brief ${briefId} funded with $${amount} by brand ${brandId}`);
    } catch (dbError) {
      console.log('Database not available, simulating brief funding:', dbError.message);
    }
  } catch (error) {
    console.error('Error handling mock checkout session completed:', error);
  }
}

async function handleMockAccountUpdated(account) {
  try {
    console.log('Mock account updated:', account.id);
    
    if (account.metadata.creatorId) {
      try {
        await prisma.creator.update({
          where: { id: account.metadata.creatorId },
          data: {
            stripeAccountId: account.id
          }
        });
      } catch (dbError) {
        console.log('Database not available, simulating account update:', dbError.message);
      }
    }
    
    console.log(`✅ Creator account ${account.id} status updated`);
  } catch (error) {
    console.error('Error handling mock account updated:', error);
  }
}

async function handleMockTransferCreated(transfer) {
  try {
    console.log('Mock transfer created:', transfer.id);
    
    const briefId = transfer.metadata.briefId;
    const creatorId = transfer.metadata.creatorId;
    const amount = transfer.amount / 100;
    
    console.log(`✅ Cash reward of $${amount} distributed to creator ${creatorId} for brief ${briefId}`);
  } catch (error) {
    console.error('Error handling mock transfer created:', error);
  }
}

async function handleMockPaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Mock payment intent succeeded:', paymentIntent.id);
    
    const briefId = paymentIntent.metadata.briefId;
    const brandId = paymentIntent.metadata.brandId;
    const amount = paymentIntent.amount / 100;
    
    console.log(`✅ Payment of $${amount} succeeded for brand ${brandId} for brief ${briefId}`);
  } catch (error) {
    console.error('Error handling mock payment intent succeeded:', error);
  }
}

// Get Mock Account Status
router.get('/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = mockAccounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Error getting mock account status:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});

// Update Mock Account Status (for testing)
router.post('/update-account-status', async (req, res) => {
  try {
    const { accountId, charges_enabled, payouts_enabled, details_submitted } = req.body;
    
    const account = mockAccounts.get(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    account.charges_enabled = charges_enabled || account.charges_enabled;
    account.payouts_enabled = payouts_enabled || account.payouts_enabled;
    account.details_submitted = details_submitted || account.details_submitted;

    mockAccounts.set(accountId, account);

    console.log(`✅ Mock account ${accountId} status updated`);

    res.json({ 
      message: 'Account status updated',
      account: account
    });
  } catch (error) {
    console.error('Error updating mock account status:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// Get Mock Transfer History
router.get('/transfers', async (req, res) => {
  try {
    const transfers = Array.from(mockTransfers.values());
    res.json({ transfers });
  } catch (error) {
    console.error('Error getting mock transfers:', error);
    res.status(500).json({ error: 'Failed to get transfers' });
  }
});

// Get Mock Payment Intents
router.get('/payment-intents', async (req, res) => {
  try {
    const paymentIntents = Array.from(mockPaymentIntents.values());
    res.json({ paymentIntents });
  } catch (error) {
    console.error('Error getting mock payment intents:', error);
    res.status(500).json({ error: 'Failed to get payment intents' });
  }
});

// Mock webhook handler for checkout.session.completed
router.post('/webhook', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    const session = mockCheckoutSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Simulate wallet funding for wallet_funding type
    if (session.metadata && session.metadata.type === 'wallet_funding') {
      const brandId = session.metadata.brandId;
      const amount = session.amount_total / 100; // Convert from cents

      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Find or create wallet
        let wallet = await prisma.brandWallet.findUnique({
          where: { brandId: brandId }
        });

        if (!wallet) {
          wallet = await prisma.brandWallet.create({
            data: {
              brandId: brandId,
              balance: 0,
              totalSpent: 0,
              totalDeposited: 0
            }
          });
        }

        await prisma.$transaction(async (tx) => {
          // Update wallet balance
          const updatedWallet = await tx.brandWallet.update({
            where: { brandId: brandId },
            data: {
              balance: { increment: amount },
              totalDeposited: { increment: amount }
            }
          });

          // Create transaction record
          await tx.brandWalletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'deposit',
              amount: amount,
              description: `Wallet funding via Mock Stripe Checkout`,
              balanceBefore: wallet.balance,
              balanceAfter: updatedWallet.balance,
              referenceId: session.id
            }
          });
        });

        console.log(`✅ Mock wallet funding successful: $${amount} added to brand ${brandId} wallet`);
      } catch (dbError) {
        console.log('Database not available, simulating wallet funding:', dbError.message);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing mock webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = {
  router,
  mockCheckoutSessions,
  mockPaymentIntents,
  mockAccounts,
  mockTransfers
};
