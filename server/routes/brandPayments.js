const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../prisma');

// Import authentication middleware
const authenticateToken = require('../middleware/auth');

/**
 * Brand Payment Integration Routes
 * Based on Stripe documentation: https://docs.stripe.com/
 */

// Create Payment Intent for Brief Funding
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create payment intents' });
    }

    const { briefId, amount, currency = 'usd' } = req.body;

    if (!briefId || !amount) {
      return res.status(400).json({ error: 'Brief ID and amount are required' });
    }

    // Verify brief belongs to this brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Calculate platform fee
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05');
    const minimumFee = parseFloat(process.env.MINIMUM_PLATFORM_FEE || '0.50');
    const totalAmount = parseFloat(amount);
    const platformFee = Math.max(totalAmount * platformFeePercentage, minimumFee);
    const netAmount = totalAmount - platformFee;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency,
      metadata: {
        type: 'brief_funding',
        briefId: briefId,
        brandId: req.user.id,
        totalAmount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        netAmount: netAmount.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database
    await prisma.briefFunding.upsert({
      where: { briefId: briefId },
      update: {
        totalAmount: totalAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      },
      create: {
        briefId: briefId,
        brandId: req.user.id,
        totalAmount: totalAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      platformFee: platformFee,
      netAmount: netAmount
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create Stripe Checkout Session for Brief Funding
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create checkout sessions' });
    }

    const { briefId, amount, successUrl, cancelUrl } = req.body;

    if (!briefId || !amount) {
      return res.status(400).json({ error: 'Brief ID and amount are required' });
    }

    // Verify brief belongs to this brand
    const brief = await prisma.brief.findFirst({
      where: {
        id: briefId,
        brandId: req.user.id
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Calculate platform fee
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05');
    const minimumFee = parseFloat(process.env.MINIMUM_PLATFORM_FEE || '0.50');
    const totalAmount = parseFloat(amount);
    const platformFee = Math.max(totalAmount * platformFeePercentage, minimumFee);
    const netAmount = totalAmount - platformFee;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fund Brief: ${brief.title}`,
              description: brief.description,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/brand/dashboard?funding=success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/brand/dashboard?funding=cancelled`,
      metadata: {
        type: 'brief_funding',
        briefId: briefId,
        brandId: req.user.id,
        totalAmount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        netAmount: netAmount.toString()
      }
    });

    // Store checkout session in database
    await prisma.briefFunding.upsert({
      where: { briefId: briefId },
      update: {
        totalAmount: totalAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        stripeCheckoutSessionId: session.id,
        status: 'pending'
      },
      create: {
        briefId: briefId,
        brandId: req.user.id,
        totalAmount: totalAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        stripeCheckoutSessionId: session.id,
        status: 'pending'
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      briefId: briefId,
      amount: totalAmount,
      platformFee: platformFee,
      netAmount: netAmount
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get Brand Payment History
router.get('/payment-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can view payment history' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.briefFunding.findMany({
        where: { brandId: req.user.id },
        include: {
          brief: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.briefFunding.count({
        where: { brandId: req.user.id }
      })
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get Brand Financial Summary
router.get('/financial-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can view financial summary' });
    }

    const brandId = req.user.id;

    // Get financial metrics
    const [
      totalFunded,
      totalFees,
      activeBriefs,
      completedPayouts
    ] = await Promise.all([
      // Total amount funded
      prisma.briefFunding.aggregate({
        where: { 
          brandId,
          status: 'completed'
        },
        _sum: { totalAmount: true }
      }),
      
      // Total platform fees paid
      prisma.briefFunding.aggregate({
        where: { 
          brandId,
          status: 'completed'
        },
        _sum: { platformFee: true }
      }),
      
      // Active briefs count
      prisma.brief.count({
        where: { 
          brandId,
          status: 'active'
        }
      }),
      
      // Completed payouts count
      prisma.creatorPayout.count({
        where: {
          brief: { brandId },
          status: 'paid'
        }
      })
    ]);

    res.json({
      totalFunded: totalFunded._sum.totalAmount || 0,
      totalFees: totalFees._sum.platformFee || 0,
      activeBriefs,
      completedPayouts,
      netSpent: (totalFunded._sum.totalAmount || 0) - (totalFees._sum.platformFee || 0)
    });

  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

module.exports = router;
