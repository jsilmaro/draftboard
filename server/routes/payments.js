const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== PAYMENT INTENT CREATION ====================

// Create payment intent for brand wallet funding
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const brandId = req.user.id;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount. Minimum $1 required.' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        brandId: brandId,
        type: 'wallet_funding'
      }
    });

    // Create transaction record
    await prisma.brandWalletTransaction.create({
      data: {
        walletId: brandId,
        type: 'pending_deposit',
        amount: amount,
        description: `Wallet funding - $${amount}`,
        referenceId: paymentIntent.id,
        balanceBefore: 0, // Will be updated after payment
        balanceAfter: 0
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

// ==================== PAYMENT CONFIRMATION ====================

// Confirm payment and fund wallet
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const brandId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const amount = paymentIntent.amount / 100; // Convert from cents

    // Get or create brand wallet
    let brandWallet = await prisma.brandWallet.findUnique({
      where: { brandId: brandId }
    });

    if (!brandWallet) {
      brandWallet = await prisma.brandWallet.create({
        data: {
          brandId: brandId,
          balance: amount,
          totalDeposited: amount
        }
      });
    } else {
      // Update wallet balance
      brandWallet = await prisma.brandWallet.update({
        where: { brandId: brandId },
        data: {
          balance: { increment: amount },
          totalDeposited: { increment: amount }
        }
      });
    }

    // Update transaction status
    await prisma.brandWalletTransaction.updateMany({
      where: {
        walletId: brandId,
        referenceId: paymentIntentId,
        type: 'pending_deposit'
      },
      data: {
        type: 'deposit',
        balanceBefore: brandWallet.balance - amount,
        balanceAfter: brandWallet.balance
      }
    });

    res.json({
      success: true,
      walletBalance: brandWallet.balance,
      message: `Successfully funded wallet with $${amount}`
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// ==================== WALLET MANAGEMENT ====================

// Get wallet balance
router.get('/wallet/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let wallet;
    if (userType === 'brand') {
      wallet = await prisma.brandWallet.findUnique({
        where: { brandId: userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } else if (userType === 'creator') {
      wallet = await prisma.creatorWallet.findUnique({
        where: { creatorId: userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!wallet) {
      return res.json({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        transactions: []
      });
    }

    res.json(wallet);

  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Get wallet transactions
router.get('/wallet/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    let transactions;
    if (userType === 'brand') {
      transactions = await prisma.brandWalletTransaction.findMany({
        where: { walletId: userId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      });
    } else if (userType === 'creator') {
      transactions = await prisma.walletTransaction.findMany({
        where: { walletId: userId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      });
    }

    res.json(transactions);

  } catch (error) {
    console.error('Wallet transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// ==================== CREATOR PAYOUTS ====================

// Request payout
router.post('/payout/request', auth, async (req, res) => {
  try {
    const { amount, accountId } = req.body;
    const creatorId = req.user.id;

    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can request payouts' });
    }

    // Validate minimum payout amount
    const minPayout = process.env.MINIMUM_PAYOUT_AMOUNT || 10;
    if (amount < minPayout) {
      return res.status(400).json({ 
        error: `Minimum payout amount is $${minPayout}` 
      });
    }

    // Get creator wallet
    const creatorWallet = await prisma.creatorWallet.findUnique({
      where: { creatorId: creatorId }
    });

    if (!creatorWallet || creatorWallet.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance for payout' 
      });
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: accountId,
      metadata: {
        creatorId: creatorId,
        type: 'creator_payout'
      }
    });

    // Update wallet balance
    await prisma.creatorWallet.update({
      where: { creatorId: creatorId },
      data: {
        balance: { decrement: amount },
        totalWithdrawn: { increment: amount }
      }
    });

    // Record transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: creatorId,
        type: 'payout',
        amount: -amount, // Negative for withdrawals
        description: `Payout to bank account - $${amount}`,
        referenceId: transfer.id,
        balanceBefore: creatorWallet.balance,
        balanceAfter: creatorWallet.balance - amount
      }
    });

    res.json({
      success: true,
      transferId: transfer.id,
      amount: amount,
      newBalance: creatorWallet.balance - amount
    });

  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({ error: 'Failed to process payout request' });
  }
});

// ==================== STRIPE WEBHOOKS ====================

// Handle Stripe webhooks
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'transfer.created':
      await handleTransferCreated(event.data.object);
      break;
    case 'transfer.failed':
      await handleTransferFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Webhook handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional logic for payment success
}

async function handleTransferCreated(transfer) {
  console.log('Transfer created:', transfer.id);
  // Additional logic for transfer creation
}

async function handleTransferFailed(transfer) {
  console.log('Transfer failed:', transfer.id);
  // Handle failed transfers
}

module.exports = router;

