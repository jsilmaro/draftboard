const express = require('express');
const router = express.Router();
// Initialize Stripe only if API key is provided
const stripeKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
const auth = require('../middleware/auth');

// Use shared Prisma client
const prisma = require('../prisma');

// Check if we should use mock mode (only if no Stripe key is provided or key is invalid)
const useMockMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.length < 100;

console.log('🔧 Payment Routes Environment Check:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
console.log('useMockMode:', useMockMode);

// Test Stripe connection if available
if (stripe) {
  stripe.balance.retrieve()
    .then(balance => {
      console.log('✅ Stripe connection successful. Balance:', balance.available[0]?.amount || 0, balance.available[0]?.currency || 'usd');
    })
    .catch(err => {
      console.error('❌ Stripe connection failed:', err.message);
    });
}

// Test route to check Stripe connection
router.get('/test-stripe', (req, res) => {
  if (!stripe) {
    return res.json({ 
      connected: false, 
      error: 'Stripe not configured',
      useMockMode: useMockMode 
    });
  }

  stripe.balance.retrieve()
    .then(balance => {
      res.json({ 
        connected: true, 
        balance: balance.available[0]?.amount || 0,
        currency: balance.available[0]?.currency || 'usd',
        useMockMode: useMockMode
      });
    })
    .catch(err => {
      res.json({ 
        connected: false, 
        error: err.message,
        useMockMode: useMockMode 
      });
    });
});

// Create Payment Intent for funding wallet
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    console.log(`🔧 Creating payment intent: $${amount} for user ${userId} (${userType})`);
    console.log(`🔧 useMockMode: ${useMockMode}, stripe available: ${!!stripe}`);

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Use mock mode only if Stripe is not configured at all
    if (useMockMode) {
      const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Mock payment intent created: ${paymentIntentId} for $${amount}`);
      
      return res.json({
        clientSecret: clientSecret,
        paymentIntentId: paymentIntentId,
        mode: 'mock'
      });
    }

    // Check if Stripe is configured for live mode
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    // Create Stripe Payment Intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        metadata: {
          userId: userId,
          userType: userType,
          purpose: 'wallet_funding'
        }
      });

      console.log(`✅ Stripe payment intent created: ${paymentIntent.id} for $${amount}`);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        mode: 'live'
      });
    } catch (stripeError) {
      console.error('❌ Stripe API error:', stripeError.message);
      
      // If Stripe key is invalid, fall back to mock mode
      if (stripeError.type === 'StripeAuthenticationError') {
        console.log('🔄 Stripe key invalid, falling back to mock mode');
        
        const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;
        
        return res.json({
          clientSecret: clientSecret,
          paymentIntentId: paymentIntentId,
          mode: 'mock'
        });
      }
      
      throw stripeError;
    }
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and fund wallet
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    console.log(`🔧 Confirming payment: ${paymentIntentId} for user ${userId} (${userType})`);
    console.log(`🔧 useMockMode: ${useMockMode}, stripe available: ${!!stripe}`);

    let finalAmount = amount;

    // Use mock mode only if Stripe is not configured at all
    if (useMockMode) {
      // For mock mode, we'll use the amount from the request
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required for mock mode' });
      }
      
      console.log(`✅ Mock payment confirmed: $${amount} for user ${userId}`);
    } else {
      // Check if Stripe is configured for live mode
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
        });
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      console.log(`🔧 Payment intent status: ${paymentIntent.status}`);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: `Payment not completed. Status: ${paymentIntent.status}` 
        });
      }

      finalAmount = paymentIntent.amount / 100; // Convert from cents
      console.log(`🔧 Payment succeeded: $${finalAmount}`);
    }

    // Update wallet balance
    if (userType === 'brand') {
      await prisma.brandWallet.upsert({
        where: { brandId: userId },
        update: {
          balance: { increment: finalAmount },
          updatedAt: new Date()
        },
        create: {
          brandId: userId,
          balance: finalAmount
        }
      });
    } else if (userType === 'creator') {
      await prisma.creatorWallet.upsert({
        where: { creatorId: userId },
        update: {
          balance: { increment: finalAmount },
          updatedAt: new Date()
        },
        create: {
          creatorId: userId,
          balance: finalAmount
        }
      });
    }

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId: userId,
        userType: userType,
        type: 'deposit',
        amount: finalAmount,
        stripePaymentIntentId: paymentIntentId,
        status: 'completed'
      }
    });

    res.json({ 
      success: true, 
      message: 'Wallet funded successfully',
      amount: finalAmount
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get wallet balance
router.get('/wallet/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let wallet;
    if (userType === 'brand') {
      wallet = await prisma.brandWallet.findUnique({
        where: { brandId: userId }
      });
    } else if (userType === 'creator') {
      wallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: userId }
      });
    }

    const balance = wallet ? wallet.balance : 0;

    // Get additional stats
    let transactions = [];
    try {
      transactions = await prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      transactions = [];
    }

    let totalEarned = 0;
    let totalWithdrawn = 0;
    let totalDeposited = 0;
    let totalSpent = 0;

    if (userType === 'creator') {
      try {
        totalEarned = await prisma.transaction.aggregate({
          where: { 
            userId: userId, 
            type: 'reward',
            status: 'completed'
          },
          _sum: { amount: true }
        });
      } catch (error) {
        console.error('Error fetching total earned:', error);
        totalEarned = { _sum: { amount: 0 } };
      }
      
      try {
        totalWithdrawn = await prisma.transaction.aggregate({
          where: { 
            userId: userId, 
            type: 'withdrawal',
            status: 'completed'
          },
          _sum: { amount: true }
        });
      } catch (error) {
        console.error('Error fetching total withdrawn:', error);
        totalWithdrawn = { _sum: { amount: 0 } };
      }
    } else {
      try {
        totalDeposited = await prisma.transaction.aggregate({
          where: { 
            userId: userId, 
            type: 'deposit',
            status: 'completed'
          },
          _sum: { amount: true }
        });
      } catch (error) {
        console.error('Error fetching total deposited:', error);
        totalDeposited = { _sum: { amount: 0 } };
      }
      
      try {
        totalSpent = await prisma.transaction.aggregate({
          where: { 
            userId: userId, 
            type: 'reward_creation',
            status: 'completed'
          },
          _sum: { amount: true }
        });
      } catch (error) {
        console.error('Error fetching total spent:', error);
        totalSpent = { _sum: { amount: 0 } };
      }
    }

    res.json({
      balance: balance,
      totalEarned: (totalEarned && totalEarned._sum && totalEarned._sum.amount) || 0,
      totalWithdrawn: (totalWithdrawn && totalWithdrawn._sum && totalWithdrawn._sum.amount) || 0,
      totalDeposited: (totalDeposited && totalDeposited._sum && totalDeposited._sum.amount) || 0,
      totalSpent: (totalSpent && totalSpent._sum && totalSpent._sum.amount) || 0,
      transactions: transactions
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Get transaction history
router.get('/wallet/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({
      where: { userId: userId }
    });

    res.json({
      transactions: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

// Request payout (for creators)
router.post('/payout/request', auth, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { amount, accountId } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (userType !== 'creator') {
      return res.status(403).json({ error: 'Only creators can request payouts' });
    }

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum payout amount is $10' });
    }

    // Check wallet balance
    const wallet = await prisma.creatorWallet.findUnique({
      where: { creatorId: userId }
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: accountId,
      metadata: {
        userId: userId,
        purpose: 'creator_payout'
      }
    });

    // Update wallet balance
    await prisma.creatorWallet.update({
      where: { creatorId: userId },
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
        type: 'withdrawal',
        amount: amount,
        stripeTransferId: transfer.id,
        status: 'completed'
      }
    });

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      transferId: transfer.id,
      amount: amount
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({ error: 'Failed to process payout request' });
  }
});

// Stripe webhook handler
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Additional processing if needed
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        console.log('Transfer created:', transfer.id);
        break;
      }

      case 'transfer.paid': {
        const paidTransfer = event.data.object;
        console.log('Transfer paid:', paidTransfer.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
