const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Payment Intent for brief funding
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, briefId, currency = 'usd' } = req.body;
    
    if (!amount || !briefId) {
      return res.status(400).json({ error: 'Amount and briefId are required' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId, 
        brandId: req.user.id 
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Check if brief is already funded
    if (brief.isFunded) {
      return res.status(400).json({ error: 'Brief is already funded' });
    }

    // Create Payment Intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        briefId,
        brandId: req.user.id,
        brandEmail: req.user.email,
        type: 'brief_funding',
        briefTitle: brief.title
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Funding for brief: ${brief.title}`,
    });

    console.log(`Payment Intent created for brief ${briefId}: ${paymentIntent.id}`);

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Enhanced webhook handling for Payment Intents
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`Received webhook: ${event.type}`);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error);
  }

  res.json({received: true});
});

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const { briefId, brandId, briefTitle } = paymentIntent.metadata;
    
    if (briefId && brandId) {
      // Update brief funding status
      await prisma.briefFunding.upsert({
        where: { briefId },
        update: {
          amount: paymentIntent.amount / 100,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
          fundedAt: new Date()
        },
        create: {
          briefId,
          brandId,
          amount: paymentIntent.amount / 100,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
          fundedAt: new Date()
        }
      });

      // Update brief status
      await prisma.brief.update({
        where: { id: briefId },
        data: { 
          isFunded: true,
          fundedAt: new Date()
        }
      });

      // Create notification for brand
      await prisma.notification.create({
        data: {
          userId: brandId,
          userType: 'brand',
          title: 'Brief Successfully Funded! 💰',
          message: `Your brief "${briefTitle}" has been funded with $${(paymentIntent.amount / 100).toFixed(2)}. You can now start accepting submissions.`,
          type: 'funding_success'
        }
      });

      console.log(`✅ Brief ${briefId} successfully funded with $${(paymentIntent.amount / 100).toFixed(2)}`);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const { briefId, brandId, briefTitle } = paymentIntent.metadata;
    
    if (briefId) {
      // Update brief funding status to failed
      await prisma.briefFunding.update({
        where: { briefId },
        data: {
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
        }
      });

      // Create notification for brand
      await prisma.notification.create({
        data: {
          userId: brandId,
          userType: 'brand',
          title: 'Payment Failed ❌',
          message: `Payment for brief "${briefTitle}" failed. Please try again or contact support.`,
          type: 'funding_failed'
        }
      });

      console.log(`❌ Payment failed for brief ${briefId}: ${paymentIntent.last_payment_error?.message}`);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent) {
  try {
    const { briefId, brandId } = paymentIntent.metadata;
    
    if (briefId && brandId) {
      // Update brief funding status to requires action
      await prisma.briefFunding.update({
        where: { briefId },
        data: {
          status: 'requires_action',
          nextAction: paymentIntent.next_action
        }
      });

      console.log(`⚠️ Payment requires action for brief ${briefId}`);
    }
  } catch (error) {
    console.error('Error handling payment intent requires action:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    const { briefId, brandId } = paymentIntent.metadata;
    
    if (briefId && brandId) {
      // Update brief funding status to canceled
      await prisma.briefFunding.update({
        where: { briefId },
        data: {
          status: 'canceled',
          canceledAt: new Date()
        }
      });

      console.log(`🚫 Payment canceled for brief ${briefId}`);
    }
  } catch (error) {
    console.error('Error handling payment intent canceled:', error);
  }
}

// Get payment status for a brief
router.get('/payment-status/:briefId', authenticateToken, async (req, res) => {
  try {
    const { briefId } = req.params;

    const briefFunding = await prisma.briefFunding.findUnique({
      where: { briefId },
      include: {
        brief: {
          select: {
            title: true,
            isFunded: true
          }
        }
      }
    });

    if (!briefFunding) {
      return res.status(404).json({ error: 'Funding record not found' });
    }

    res.json({
      status: briefFunding.status,
      amount: briefFunding.amount,
      fundedAt: briefFunding.fundedAt,
      isFunded: briefFunding.brief.isFunded,
      failureReason: briefFunding.failureReason
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

module.exports = router;
