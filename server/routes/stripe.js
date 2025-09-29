const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../prisma');

// Import authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create Payment Intent for test payments (no auth required for testing)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least 50 cents' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      metadata: {
        ...metadata,
        test: 'true',
        created_at: new Date().toISOString()
      }
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Test checkout session creation (no auth required for testing)
router.post('/test-checkout-session', async (req, res) => {
  try {
    const { briefId, amount, briefTitle, brandId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: briefTitle || 'Test Brief Payment',
              description: `Payment for brief: ${briefId}`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/brand/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/brand/dashboard?payment=canceled`,
      metadata: {
        type: 'brief_funding',
        briefId: briefId || 'test_brief_123',
        brandId: brandId || 'test_brand_123',
        totalAmount: (amount / 100).toString(), // Convert from cents to dollars
        platformFee: '0.00',
        netAmount: (amount / 100).toString()
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      briefId: briefId,
      amount: amount
    });

  } catch (error) {
    console.error('Error creating test checkout session:', error);
    res.status(500).json({ error: 'Failed to create test checkout session' });
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
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/brand/dashboard?funding=success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/brand/dashboard?funding=cancelled`,
      metadata: {
        type: 'brief_funding',
        briefId: briefId,
        brandId: req.user.id,
        amount: amount.toString()
      }
    });

    // Calculate platform fee and net amount
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05');
    const minimumPlatformFee = parseFloat(process.env.MINIMUM_PLATFORM_FEE || '0.50');
    const totalAmount = parseFloat(amount.toFixed(2));
    const calculatedFee = Math.max(totalAmount * platformFeePercentage, minimumPlatformFee);
    const netAmount = totalAmount - calculatedFee;

    // Check if funding record already exists
    const existingFunding = await prisma.briefFunding.findUnique({
      where: { briefId: briefId }
    });

    if (existingFunding) {
      // Update existing funding record
      await prisma.briefFunding.update({
        where: { briefId: briefId },
        data: {
          totalAmount: totalAmount,
          platformFee: calculatedFee,
          netAmount: netAmount,
          status: 'pending',
          stripeCheckoutSessionId: session.id
        }
      });
    } else {
      // Create new funding record
      await prisma.briefFunding.create({
        data: {
          briefId: briefId,
          brandId: req.user.id,
          totalAmount: totalAmount,
          platformFee: calculatedFee,
          netAmount: netAmount,
          status: 'pending',
          stripeCheckoutSessionId: session.id
        }
      });
    }

    res.json({ 
      sessionId: session.id, 
      url: session.url,
      briefId: briefId,
      amount: amount
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Transfer funds to Creator's connected account
router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can initiate transfers' });
    }

    const { submissionId, amount } = req.body;

    if (!submissionId || !amount) {
      return res.status(400).json({ error: 'Submission ID and amount are required' });
    }

    // Get submission and verify it belongs to this brand
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        brief: {
          brandId: req.user.id
        }
      },
      include: {
        creator: true,
        brief: true
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Get creator's Stripe Connect account
    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: submission.creatorId }
    });

    if (!connectAccount) {
      return res.status(400).json({ error: 'Creator has not connected their Stripe account' });
    }

    // Calculate transfer amount (convert to cents)
    const transferAmount = Math.round(amount * 100); // Convert to cents

    // Create transfer to creator's connected account
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: connectAccount.stripeAccountId,
      transfer_group: `brief_${submission.briefId}_${Date.now()}`,
      metadata: {
        briefId: submission.briefId,
        submissionId: submissionId,
        creatorId: submission.creatorId,
        brandId: req.user.id,
        type: 'reward_payment'
      }
    });

    // Create payout record
    const payout = await prisma.creatorPayout.create({
      data: {
        creatorId: submission.creatorId,
        briefId: submission.briefId,
        submissionId: submissionId,
        amount: amount,
        platformFee: amount * 0.05,
        netAmount: amount - (amount * 0.05),
        stripeTransferId: transfer.id,
        stripeTransferGroupId: transfer.transfer_group,
        status: 'pending'
      }
    });

    // Update submission status to winner
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'winner' }
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: submission.creatorId,
        userType: 'creator',
        title: 'You Won! 🎉',
        message: `Congratulations! You won the brief "${submission.brief.title}" and your reward is being processed.`,
        type: 'reward',
        category: 'brief',
        metadata: {
          briefId: submission.briefId,
          submissionId: submissionId,
          amount: amount,
          payoutId: payout.id
        }
      }
    });

    res.json({
      success: true,
      transferId: transfer.id,
      payoutId: payout.id,
      amount: amount,
      message: 'Funds transferred successfully'
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Get Creator's Stripe Connect account details
router.get('/account/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Verify user has permission to view this account
    if (req.user.type !== 'brand' && req.user.type !== 'admin' && req.user.id !== creatorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!connectAccount) {
      return res.status(404).json({ error: 'No Stripe account connected' });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(connectAccount.stripeAccountId);

    res.json({
      accountId: connectAccount.stripeAccountId,
      status: account.details_submitted ? 'active' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
      country: account.country,
      default_currency: account.default_currency,
      created: account.created,
      type: account.type
    });

  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ error: 'Failed to fetch account details' });
  }
});

// Get all funded briefs for brand
router.get('/funded-briefs', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can view funded briefs' });
    }

    const fundedBriefs = await prisma.brief.findMany({
      where: {
        brandId: req.user.id,
        isFunded: true
      },
      include: {
        submissions: {
          where: {
            status: { in: ['pending', 'approved'] }
          },
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                userName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        fundedAt: 'desc'
      }
    });

    res.json(fundedBriefs);

  } catch (error) {
    console.error('Error fetching funded briefs:', error);
    res.status(500).json({ error: 'Failed to fetch funded briefs' });
  }
});

// Get creator payout history
router.get('/payouts/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Verify user has permission to view this data
    if (req.user.type !== 'admin' && req.user.id !== creatorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payouts = await prisma.creatorPayout.findMany({
      where: { creatorId: creatorId },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            brand: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        submission: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payouts);

  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Create setup intent for saving payment methods
router.post('/create-setup-intent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get or create Stripe customer
    let customer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer if none exists
        customer = await stripe.customers.create({
          email: userEmail,
          name: req.user.fullName || req.user.userName,
          metadata: {
            userId: userId,
            userType: req.user.type
          }
        });
      }
    } catch (stripeError) {
      console.error('Error with Stripe customer:', stripeError);
      return res.status(500).json({ error: 'Failed to create or retrieve customer' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({ client_secret: setupIntent.client_secret });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Get payment methods for a customer
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get or create Stripe customer
    let customer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer if none exists
        customer = await stripe.customers.create({
          email: userEmail,
          name: req.user.fullName || req.user.userName,
          metadata: {
            userId: userId,
            userType: req.user.type
          }
        });
      }
    } catch (stripeError) {
      console.error('Error with Stripe customer:', stripeError);
      return res.status(500).json({ error: 'Failed to create or retrieve customer' });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    res.json(paymentMethods.data);

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Delete a payment method
router.delete('/payment-methods/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await stripe.paymentMethods.detach(id);
    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Set default payment method
router.post('/payment-methods/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get or create Stripe customer
    let customer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer if none exists
        customer = await stripe.customers.create({
          email: userEmail,
          name: req.user.fullName || req.user.userName,
          metadata: {
            userId: userId,
            userType: req.user.type
          }
        });
      }
    } catch (stripeError) {
      console.error('Error with Stripe customer:', stripeError);
      return res.status(500).json({ error: 'Failed to create or retrieve customer' });
    }
    
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: id,
      },
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

// Create reward payment for winners
router.post('/create-reward-payment', authenticateToken, async (req, res) => {
  try {
    const { briefId, winners } = req.body;

    if (!winners || winners.length === 0) {
      return res.status(400).json({ error: 'No winners specified' });
    }

    const totalAmount = winners.reduce((sum, winner) => sum + winner.amount, 0);

    // Create payment intent for the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        briefId,
        type: 'reward_payment',
        winner_count: winners.length,
        test: 'true'
      }
    });

    res.json({ client_secret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating reward payment:', error);
    res.status(500).json({ error: 'Failed to create reward payment' });
  }
});

module.exports = router;
