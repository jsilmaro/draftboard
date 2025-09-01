const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Stripe Integration for Reward + Payment System
 * Handles brand funding, creator onboarding, and reward distribution
 */

// Create Stripe Checkout Session for Brand Funding
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { briefId, amount, brandId, briefTitle } = req.body;

    // Validate required fields
    if (!briefId || !amount || !brandId || !briefTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Brief Funding: ${briefTitle}`,
              description: `Fund for brief ID: ${briefId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/briefs/${briefId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/briefs/${briefId}/cancel`,
      metadata: {
        briefId: briefId.toString(),
        brandId: brandId.toString(),
        type: 'brief_funding'
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Stripe Connect Account for Creator Onboarding
router.post('/create-connect-account', async (req, res) => {
  try {
    const { creatorId, email, name } = req.body;

    if (!creatorId || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe Connect Account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        creatorId: creatorId.toString(),
        name: name
      }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/creator/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/creator/onboarding/success`,
      type: 'account_onboarding',
    });

    res.json({ 
      accountId: account.id, 
      onboardingUrl: accountLink.url,
      account: account 
    });
  } catch (error) {
    console.error('Error creating connect account:', error);
    res.status(500).json({ error: 'Failed to create connect account' });
  }
});

// Get Creator's Connect Account Status
router.get('/connect-account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Error retrieving connect account:', error);
    res.status(500).json({ error: 'Failed to retrieve account' });
  }
});

// Create Login Link for Existing Connect Account
router.post('/create-login-link', async (req, res) => {
  try {
    const { accountId } = req.body;

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    res.json({ url: loginLink.url });
  } catch (error) {
    console.error('Error creating login link:', error);
    res.status(500).json({ error: 'Failed to create login link' });
  }
});

// Distribute Cash Rewards via Stripe Connect
router.post('/distribute-cash-reward', async (req, res) => {
  try {
    const { creatorAccountId, amount, briefId, creatorId, description } = req.body;

    if (!creatorAccountId || !amount || !briefId || !creatorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transfer to creator's account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: creatorAccountId,
      description: description || `Reward for brief ${briefId}`,
      metadata: {
        briefId: briefId.toString(),
        creatorId: creatorId.toString(),
        type: 'cash_reward'
      }
    });

    res.json({ 
      transferId: transfer.id,
      amount: amount,
      status: 'success'
    });
  } catch (error) {
    console.error('Error distributing cash reward:', error);
    res.status(500).json({ error: 'Failed to distribute cash reward' });
  }
});

// Create Payment Intent for Platform Fee
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, briefId, brandId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        briefId: briefId.toString(),
        brandId: brandId.toString(),
        type: 'platform_fee'
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Handle Stripe Webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'account.updated':
      await handleAccountUpdated(event.data.object);
      break;
    case 'transfer.created':
      await handleTransferCreated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Webhook Handlers
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Checkout session completed:', session.id);
    
    // Update brief funding status in database
    const briefId = session.metadata.briefId;
    const brandId = session.metadata.brandId;
    const amount = session.amount_total / 100; // Convert from cents

    // Update brief funding status
    await prisma.brief.update({
      where: { id: briefId },
      data: {
        fundedAmount: amount,
        fundedStatus: 'funded',
        stripeSessionId: session.id
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: brandId,
        userType: 'brand',
        type: 'deposit',
        amount: amount,
        stripePaymentIntentId: session.payment_intent,
        status: 'completed'
      }
    });
    
    console.log(`Brief ${briefId} funded with $${amount} by brand ${brandId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleAccountUpdated(account) {
  try {
    console.log('Account updated:', account.id);
    
    // Update creator's Stripe account ID in database
    if (account.metadata.creatorId) {
      await prisma.creator.update({
        where: { id: account.metadata.creatorId },
        data: {
          stripeAccountId: account.id
        }
      });
    }
    
    console.log(`Creator account ${account.id} status updated`);
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

async function handleTransferCreated(transfer) {
  try {
    console.log('Transfer created:', transfer.id);
    
    // Log successful cash reward distribution
    const briefId = transfer.metadata.briefId;
    const creatorId = transfer.metadata.creatorId;
    const amount = transfer.amount / 100;
    
    // await logRewardDistribution(creatorId, briefId, 'cash', amount, transfer.id);
    
    console.log(`Cash reward of $${amount} distributed to creator ${creatorId} for brief ${briefId}`);
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

module.exports = router;
