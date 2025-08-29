const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Payment Intent for funding wallet
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        userId: userId,
        userType: userType,
        purpose: 'wallet_funding'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and fund wallet
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const amount = paymentIntent.amount / 100; // Convert from cents

    // Update wallet balance
    if (userType === 'brand') {
      await prisma.brandWallet.upsert({
        where: { brandId: userId },
        update: {
          balance: { increment: amount },
          updatedAt: new Date()
        },
        create: {
          brandId: userId,
          balance: amount
        }
      });
    } else if (userType === 'creator') {
      await prisma.creatorWallet.upsert({
        where: { creatorId: userId },
        update: {
          balance: { increment: amount },
          updatedAt: new Date()
        },
        create: {
          creatorId: userId,
          balance: amount
        }
      });
    }

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId: userId,
        userType: userType,
        type: 'deposit',
        amount: amount,
        stripePaymentIntentId: paymentIntentId,
        status: 'completed'
      }
    });

    res.json({ 
      success: true, 
      message: 'Wallet funded successfully',
      amount: amount
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
    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    let totalEarned = 0;
    let totalWithdrawn = 0;
    let totalDeposited = 0;
    let totalSpent = 0;

    if (userType === 'creator') {
      totalEarned = await prisma.transaction.aggregate({
        where: { 
          userId: userId, 
          type: 'reward',
          status: 'completed'
        },
        _sum: { amount: true }
      });
      
      totalWithdrawn = await prisma.transaction.aggregate({
        where: { 
          userId: userId, 
          type: 'withdrawal',
          status: 'completed'
        },
        _sum: { amount: true }
      });
    } else {
      totalDeposited = await prisma.transaction.aggregate({
        where: { 
          userId: userId, 
          type: 'deposit',
          status: 'completed'
        },
        _sum: { amount: true }
      });
      
      totalSpent = await prisma.transaction.aggregate({
        where: { 
          userId: userId, 
          type: 'reward_creation',
          status: 'completed'
        },
        _sum: { amount: true }
      });
    }

    res.json({
      balance: balance,
      totalEarned: totalEarned._sum.amount || 0,
      totalWithdrawn: totalWithdrawn._sum.amount || 0,
      totalDeposited: totalDeposited._sum.amount || 0,
      totalSpent: totalSpent._sum.amount || 0,
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
