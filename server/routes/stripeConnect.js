const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
 * POST /api/stripe-connect/create-account
 * Create a Stripe Connect Express account for a creator
 */
router.post('/create-account', authenticateToken, async (req, res) => {
  try {
    const { creatorId, email, fullName } = req.body;

    if (!creatorId || !email || !fullName) {
      return res.status(400).json({ error: 'creatorId, email, and fullName are required' });
    }

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // You can make this dynamic based on user location
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: email,
        first_name: fullName.split(' ')[0] || '',
        last_name: fullName.split(' ').slice(1).join(' ') || '',
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily'
          }
        }
      }
    });

    console.log(`✅ Created Stripe Express account for creator ${creatorId}:`, account.id);

    // Save account to database
    const { prisma } = require('../prisma');
    await prisma.stripeAccount.create({
      data: {
        creatorId: creatorId,
        accountId: account.id,
        isActive: false, // Will be true after onboarding completion
        accountType: 'express'
      }
    });

    console.log(`💾 Saved Stripe account to database for creator ${creatorId}`);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/creator/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/creator/onboarding/success`,
      type: 'account_onboarding',
    });

    console.log(`🔗 Created onboarding link for account ${account.id}`);

    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Stripe Connect account created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating Stripe Connect account:', error);
    res.status(500).json({ 
      error: 'Failed to create Stripe Connect account',
      message: error.message 
    });
  }
});

/**
 * GET /api/stripe-connect/account/:accountId
 * Get account details and status
 */
router.get('/account/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      success: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        email: account.email,
        country: account.country,
        created: account.created
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving Stripe Connect account:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve account',
      message: error.message 
    });
  }
});

/**
 * POST /api/stripe-connect/create-account-link
 * Create a new account link for onboarding
 */
router.post('/create-account-link', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/creator/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/creator/onboarding/success`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      onboardingUrl: accountLink.url,
      expires_at: accountLink.expires_at
    });

  } catch (error) {
    console.error('❌ Error creating account link:', error);
    res.status(500).json({ 
      error: 'Failed to create account link',
      message: error.message 
    });
  }
});

/**
 * POST /api/stripe-connect/create-payment-intent
 * Create a payment intent with destination charge for marketplace
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'usd', 
      connectedAccountId, 
      applicationFeeAmount,
      briefId,
      submissionId,
      creatorId,
      metadata = {}
    } = req.body;

    if (!amount || !connectedAccountId) {
      return res.status(400).json({ 
        error: 'amount and connectedAccountId are required' 
      });
    }

    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      application_fee_amount: applicationFeeAmount ? Math.round(applicationFeeAmount * 100) : undefined,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        briefId: briefId || '',
        submissionId: submissionId || '',
        creatorId: creatorId || '',
        type: 'reward_payment',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ Created payment intent for reward payment:`, {
      paymentIntentId: paymentIntent.id,
      amount: amount,
      connectedAccountId: connectedAccountId,
      applicationFeeAmount: applicationFeeAmount
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      message: 'Payment intent created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
});

/**
 * POST /api/stripe-connect/create-transfer
 * Create a direct transfer to connected account (alternative to destination charges)
 */
router.post('/create-transfer', authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'usd', 
      connectedAccountId, 
      briefId,
      submissionId,
      creatorId,
      metadata = {}
    } = req.body;

    if (!amount || !connectedAccountId) {
      return res.status(400).json({ 
        error: 'amount and connectedAccountId are required' 
      });
    }

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      destination: connectedAccountId,
      metadata: {
        briefId: briefId || '',
        submissionId: submissionId || '',
        creatorId: creatorId || '',
        type: 'reward_payment',
        ...metadata
      }
    });

    console.log(`✅ Created transfer for reward payment:`, {
      transferId: transfer.id,
      amount: amount,
      connectedAccountId: connectedAccountId
    });

    res.json({
      success: true,
      transferId: transfer.id,
      amount: amount,
      currency: currency,
      message: 'Transfer created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating transfer:', error);
    res.status(500).json({ 
      error: 'Failed to create transfer',
      message: error.message 
    });
  }
});

/**
 * GET /api/stripe-connect/balance
 * Get platform balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();

    res.json({
      success: true,
      balance: {
        available: balance.available,
        pending: balance.pending,
        instant_available: balance.instant_available
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving balance:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve balance',
      message: error.message 
    });
  }
});

/**
 * GET /api/stripe-connect/connected-accounts
 * List all connected accounts
 */
router.get('/connected-accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await stripe.accounts.list({
      limit: 100
    });

    res.json({
      success: true,
      accounts: accounts.data.map(account => ({
        id: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country,
        created: account.created
      }))
    });

  } catch (error) {
    console.error('❌ Error listing connected accounts:', error);
    res.status(500).json({ 
      error: 'Failed to list connected accounts',
      message: error.message 
    });
  }
});

module.exports = router;