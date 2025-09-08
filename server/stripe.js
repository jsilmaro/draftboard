const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const prisma = new PrismaClient();

/**
 * Live Stripe Implementation
 * Handles real Stripe Connect operations for production
 */

// Create Stripe Connect Account for Creator
router.post('/create-connect-account', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { creatorId, email, name, country = 'US' } = req.body;

    if (!creatorId || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        creatorId: creatorId,
        platform: 'draftboard'
      }
    });

    // Store account reference in database
    await prisma.creatorStripeAccount.upsert({
      where: { creatorId: creatorId },
      update: { 
        stripeAccountId: account.id,
        status: 'pending',
        updatedAt: new Date()
      },
      create: {
        creatorId: creatorId,
        stripeAccountId: account.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Live Stripe Connect account created: ${account.id} for creator ${creatorId}`);

    res.json({ 
      accountId: account.id,
      accountLink: null // Will be created separately
    });
  } catch (error) {
    console.error('Error creating live Stripe Connect account:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

// Get Connect Account Status
router.get('/connect-account/:accountId', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      country: account.country,
      default_currency: account.default_currency,
      email: account.email,
      business_type: account.business_type,
      capabilities: account.capabilities
    });
  } catch (error) {
    console.error('Error retrieving Stripe account:', error);
    res.status(500).json({ error: 'Failed to retrieve account' });
  }
});

// Create Account Link for Onboarding
router.post('/create-account-link', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { accountId, refreshUrl, returnUrl } = req.body;

    if (!accountId || !refreshUrl || !returnUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(500).json({ error: 'Failed to create account link' });
  }
});

// Create Transfer to Creator
router.post('/create-transfer', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { amount, currency, destination, description, metadata } = req.body;

    if (!amount || !currency || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: currency,
      destination: destination,
      description: description || 'Creator payment',
      metadata: metadata || {}
    });

    // Store transfer record in database
    await prisma.stripeTransfer.create({
      data: {
        stripeTransferId: transfer.id,
        amount: amount,
        currency: currency,
        destination: destination,
        status: transfer.status,
        metadata: metadata || {},
        createdAt: new Date()
      }
    });

    console.log(`✅ Live Stripe transfer created: ${transfer.id} for $${amount}`);

    res.json({
      id: transfer.id,
      amount: amount,
      currency: currency,
      destination: destination,
      status: transfer.status,
      created: transfer.created,
      metadata: transfer.metadata
    });
  } catch (error) {
    console.error('Error creating live Stripe transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { briefId, amount, brandId, briefTitle } = req.body;

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

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: briefId === 'wallet-funding' ? 'Wallet Funding' : `Brief: ${briefTitle}`,
            description: briefId === 'wallet-funding' ? 'Add funds to your wallet' : `Funding for brief ${briefId}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://draftboard-b44q.vercel.app'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://draftboard-b44q.vercel.app'}/payment/cancel`,
      metadata: {
        briefId: briefId ? briefId.toString() : 'wallet-funding',
        brandId: actualBrandId.toString(),
        type: briefId === 'wallet-funding' ? 'wallet_funding' : 'brief_funding'
      }
    });

    console.log(`✅ Live Stripe checkout session created: ${session.id} for $${amount}`);

    res.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.status,
      url: session.url,
      payment_intent: session.payment_intent
    });
  } catch (error) {
    console.error('Error creating live Stripe checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get Payment Intent
router.get('/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
});

// Confirm Payment
router.post('/confirm-payment', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    res.json({ status: paymentIntent.status });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Webhook Handler
router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
    });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook Event Handlers
async function handleAccountUpdated(account) {
  try {
    // Update creator's Stripe account status
    await prisma.creatorStripeAccount.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        status: account.charges_enabled && account.payouts_enabled ? 'active' : 'pending',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated Stripe account status for ${account.id}`);
  } catch (error) {
    console.error('Error updating account status:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { briefId, brandId } = paymentIntent.metadata;
    
    if (briefId && brandId) {
      // Update brief funding status
      await prisma.brief.update({
        where: { id: briefId },
        data: {
          isFunded: true,
          fundedAt: new Date(),
          fundedAmount: paymentIntent.amount / 100
        }
      });

      console.log(`✅ Brief ${briefId} marked as funded`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handleTransferCreated(transfer) {
  try {
    // Update transfer status in database
    await prisma.stripeTransfer.updateMany({
      where: { stripeTransferId: transfer.id },
      data: {
        status: transfer.status,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated transfer status for ${transfer.id}`);
  } catch (error) {
    console.error('Error updating transfer status:', error);
  }
}

module.exports = router;
