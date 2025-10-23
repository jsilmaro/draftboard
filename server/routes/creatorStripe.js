const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../prisma');

// Import authentication middleware
const authenticateToken = require('../middleware/auth');

/**
 * Creator Stripe Connect Integration Routes
 * Based on Stripe documentation: https://docs.stripe.com/
 */

// Create Stripe Connect Express Account for Creator
router.post('/onboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can onboard with Stripe' });
    }

    const { country = 'US', email } = req.body;
    const creatorId = req.user.id;

    // Check if creator already has a Stripe account
    const existingAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (existingAccount) {
      return res.status(400).json({ 
        error: 'Creator already has a Stripe account',
        accountId: existingAccount.stripeAccountId
      });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email || req.user.email,
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

    // Store account in database
    const connectAccount = await prisma.stripeConnectAccount.create({
      data: {
        creatorId: creatorId,
        stripeAccountId: account.id,
        status: 'pending',
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false
      }
    });

    console.log(`✅ Stripe Connect account created: ${account.id} for creator ${creatorId}`);

    res.json({
      success: true,
      accountId: account.id,
      connectAccountId: connectAccount.id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ error: `Failed to create Connect account: ${error.message}` });
  }
});

// Create Account Link for Onboarding
router.post('/create-account-link', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can create account links' });
    }

    const { returnUrl, refreshUrl } = req.body;
    const creatorId = req.user.id;

    // Get creator's Stripe Connect account
    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!connectAccount) {
      return res.status(404).json({ error: 'Creator has not created a Stripe Connect account' });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.stripeAccountId,
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/dashboard?stripe=success`,
      refresh_url: refreshUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/dashboard?stripe=refresh`,
      type: 'account_onboarding',
    });

    res.json({
      url: accountLink.url,
      expires_at: accountLink.expires_at
    });

  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(500).json({ error: 'Failed to create account link' });
  }
});

// Get Creator Stripe Account Status
router.get('/account-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can view account status' });
    }

    const creatorId = req.user.id;

    // Get creator's Stripe Connect account from database
    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!connectAccount) {
      return res.json({
        connected: false,
        status: 'not_connected',
        message: 'No Stripe account connected'
      });
    }

    try {
      // Get fresh account details from Stripe
      const account = await stripe.accounts.retrieve(connectAccount.stripeAccountId);

      // Update database with current status
      await prisma.stripeConnectAccount.update({
        where: { creatorId: creatorId },
        data: {
          status: account.details_submitted ? 'active' : 'pending',
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements,
          updatedAt: new Date()
        }
      });

      res.json({
        connected: true,
        accountId: account.id,
        status: account.details_submitted ? 'active' : 'pending',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        country: account.country,
        default_currency: account.default_currency,
        business_type: account.business_type,
        email: account.email
      });

    } catch (stripeError) {
      console.error('Error fetching Stripe account:', stripeError);
      
      // Return database status if Stripe API fails
      res.json({
        connected: true,
        accountId: connectAccount.stripeAccountId,
        status: connectAccount.status,
        chargesEnabled: connectAccount.chargesEnabled,
        payoutsEnabled: connectAccount.payoutsEnabled,
        detailsSubmitted: connectAccount.detailsSubmitted,
        requirements: connectAccount.requirements,
        message: 'Using cached account status'
      });
    }

  } catch (error) {
    console.error('Error fetching account status:', error);
    res.status(500).json({ error: 'Failed to fetch account status' });
  }
});

// Get Creator Payout History
router.get('/payouts', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can view payouts' });
    }

    const creatorId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get creator's Stripe Connect account
    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!connectAccount) {
      return res.status(404).json({ error: 'Creator has not connected their Stripe account' });
    }

    // Get payouts from database
    const [payouts, total] = await Promise.all([
      prisma.creatorPayout.findMany({
        where: { creatorId: creatorId },
        include: {
          brief: {
            select: {
              id: true,
              title: true,
              brand: {
                select: {
                  companyName: true,
                  logo: true
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
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.creatorPayout.count({
        where: { creatorId: creatorId }
      })
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Get Creator Earnings Summary
router.get('/earnings-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can view earnings summary' });
    }

    const creatorId = req.user.id;

    // Get earnings metrics
    const [
      totalEarnings,
      thisMonthEarnings,
      pendingEarnings,
      paidEarnings
    ] = await Promise.all([
      // Total earnings
      prisma.creatorPayout.aggregate({
        where: { 
          creatorId,
          status: 'paid'
        },
        _sum: { netAmount: true }
      }),
      
      // This month earnings
      prisma.creatorPayout.aggregate({
        where: { 
          creatorId,
          status: 'paid',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { netAmount: true }
      }),
      
      // Pending earnings
      prisma.creatorPayout.aggregate({
        where: { 
          creatorId,
          status: 'pending'
        },
        _sum: { netAmount: true }
      }),
      
      // Paid earnings count
      prisma.creatorPayout.count({
        where: { 
          creatorId,
          status: 'paid'
        }
      })
    ]);

    res.json({
      totalEarnings: totalEarnings._sum.netAmount || 0,
      thisMonthEarnings: thisMonthEarnings._sum.netAmount || 0,
      pendingEarnings: pendingEarnings._sum.netAmount || 0,
      paidEarnings: paidEarnings,
      currency: 'USD'
    });

  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ error: 'Failed to fetch earnings summary' });
  }
});

// Create Login Link for Creator Dashboard
router.post('/create-login-link', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can create login links' });
    }

    const creatorId = req.user.id;

    // Get creator's Stripe Connect account
    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!connectAccount) {
      return res.status(404).json({ error: 'Creator has not connected their Stripe account' });
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(connectAccount.stripeAccountId);

    res.json({
      url: loginLink.url,
      expires_at: loginLink.expires_at
    });

  } catch (error) {
    console.error('Error creating login link:', error);
    res.status(500).json({ error: 'Failed to create login link' });
  }
});

module.exports = router;
