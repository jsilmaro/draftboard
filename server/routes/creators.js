const express = require('express');
const router = express.Router();

// Import shared Prisma client
const { prisma } = require('../prisma');

// Initialize Stripe only if API key is provided
const stripeKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
const isTestMode = process.env.STRIPE_MODE === 'test' || !process.env.STRIPE_SECRET_KEY;

/**
 * Creator Stripe Connect Routes
 * Handles creator onboarding and account status management
 */

// Authentication middleware
const authenticateCreator = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.type !== 'creator') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.creator = user;
    next();
  });
};

// Brand authentication middleware
const authenticateBrand = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.type !== 'brand') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.brand = user;
    next();
  });
};

// Get creator's Stripe Connect account status
router.get('/onboard/status', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Check if creator has a Stripe account in database
    const stripeAccount = await prisma.creatorStripeAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!stripeAccount) {
      return res.status(404).json({ 
        error: 'No Stripe account found',
        data: null 
      });
    }

    // If in test mode and no real Stripe configured, return mock data
    if (isTestMode && !stripe) {
      return res.json({
        data: {
          id: stripeAccount.stripeAccountId,
          status: 'active',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: [],
            pending_verification: []
          },
          country: 'US',
          default_currency: 'usd',
          business_type: 'individual'
        }
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);

    // Determine account status
    let status = 'pending';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted && account.requirements.currently_due.length === 0) {
      status = 'restricted';
    }

    // Update database with current status
    await prisma.creatorStripeAccount.update({
      where: { creatorId: creatorId },
      data: {
        status: status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        updatedAt: new Date()
      }
    });

    res.json({
      data: {
        id: account.id,
        status: status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        country: account.country,
        default_currency: account.default_currency,
        business_type: account.business_type,
        email: account.email
      }
    });

  } catch (error) {
    console.error('Error fetching creator Stripe account status:', error);
    
    // If it's a Stripe API error, try to handle it gracefully
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(404).json({ 
        error: 'Stripe account not found or invalid',
        data: null 
      });
    }

    res.status(500).json({ error: 'Failed to fetch account status' });
  }
});

// Create Stripe Connect account for creator
router.post('/onboard', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { country = 'US' } = req.body;

    // Check if creator already has a Stripe account
    const existingAccount = await prisma.creatorStripeAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (existingAccount) {
      return res.status(400).json({ 
        error: 'Creator already has a Stripe account',
        accountId: existingAccount.stripeAccountId 
      });
    }

    // Get creator details
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { email: true, fullName: true }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    let accountId;
    let accountData;

    if (isTestMode && !stripe) {
      // Mock mode - create a fake account
      accountId = `acct_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      accountData = {
        id: accountId,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: {
          currently_due: ['legal_entity.type', 'legal_entity.first_name', 'legal_entity.last_name'],
          eventually_due: ['external_account'],
          past_due: [],
          pending_verification: []
        }
      };
    } else {
      // Create real Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: country,
        email: creator.email,
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

      accountId = account.id;
      accountData = account;
    }

    // Store account reference in database
    await prisma.creatorStripeAccount.create({
      data: {
        creatorId: creatorId,
        stripeAccountId: accountId,
        status: 'pending',
        chargesEnabled: accountData.charges_enabled,
        payoutsEnabled: accountData.payouts_enabled,
        detailsSubmitted: accountData.details_submitted,
        requirements: accountData.requirements,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Stripe Connect account created: ${accountId} for creator ${creatorId}`);

    res.json({ 
      message: 'Stripe account created successfully',
      accountId: accountId
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

// Create account link for onboarding
router.post('/onboard/link', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { returnUrl, refreshUrl } = req.body;

    // Get creator's Stripe account
    const stripeAccount = await prisma.creatorStripeAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!stripeAccount) {
      return res.status(404).json({ error: 'No Stripe account found. Please create one first.' });
    }

    let accountLink;

    if (isTestMode && !stripe) {
      // Mock mode - return a fake onboarding URL
      accountLink = {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/onboarding?account_id=${stripeAccount.stripeAccountId}&mock=true`
      };
    } else {
      // Create real Stripe account link
      accountLink = await stripe.accountLinks.create({
        account: stripeAccount.stripeAccountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding',
      });
    }

    res.json({ 
      message: 'Account link created successfully',
      data: accountLink 
    });

  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(500).json({ error: 'Failed to create account link' });
  }
});

// Re-check account status (for wallet page visits)
router.post('/onboard/recheck', authenticateCreator, async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Get creator's Stripe account from database
    const stripeAccount = await prisma.creatorStripeAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!stripeAccount) {
      return res.status(404).json({ 
        error: 'No Stripe account found',
        data: null 
      });
    }

    // If in test mode, simulate account verification
    if (isTestMode && !stripe) {
      const mockAccount = {
        id: stripeAccount.stripeAccountId,
        status: 'active',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        }
      };

      // Update database
      await prisma.creatorStripeAccount.update({
        where: { creatorId: creatorId },
        data: {
          status: 'active',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          updatedAt: new Date()
        }
      });

      return res.json({ 
        message: 'Account status updated (test mode)',
        data: mockAccount 
      });
    }

    // Retrieve fresh account details from Stripe
    const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);

    // Determine account status
    let status = 'pending';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted && account.requirements.currently_due.length === 0) {
      status = 'restricted';
    }

    // Update database with fresh status
    await prisma.creatorStripeAccount.update({
      where: { creatorId: creatorId },
      data: {
        status: status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Account status refreshed',
      data: {
        id: account.id,
        status: status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        country: account.country,
        default_currency: account.default_currency,
        business_type: account.business_type,
        email: account.email
      }
    });

  } catch (error) {
    console.error('Error rechecking creator Stripe account status:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(404).json({ 
        error: 'Stripe account not found or invalid',
        data: null 
      });
    }

    res.status(500).json({ error: 'Failed to recheck account status' });
  }
});

// Test mode: Simulate fully verified account
router.post('/onboard/simulate-verified', authenticateCreator, async (req, res) => {
  try {
    if (!isTestMode || stripe) {
      return res.status(400).json({ error: 'This endpoint is only available in test mode without real Stripe' });
    }

    const creatorId = req.creator.id;

    // Get or create Stripe account
    let stripeAccount = await prisma.creatorStripeAccount.findUnique({
      where: { creatorId: creatorId }
    });

    if (!stripeAccount) {
      // Create a mock account
      const mockAccountId = `acct_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      stripeAccount = await prisma.creatorStripeAccount.create({
        data: {
          creatorId: creatorId,
          stripeAccountId: mockAccountId,
          status: 'active',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: [],
            pending_verification: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Update existing account to verified status
      stripeAccount = await prisma.creatorStripeAccount.update({
        where: { creatorId: creatorId },
        data: {
          status: 'active',
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: [],
            pending_verification: []
          },
          updatedAt: new Date()
        }
      });
    }

    res.json({ 
      message: 'Account simulated as fully verified (test mode)',
      data: {
        id: stripeAccount.stripeAccountId,
        status: 'active',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        }
      }
    });

  } catch (error) {
    console.error('Error simulating verified account:', error);
    res.status(500).json({ error: 'Failed to simulate verified account' });
  }
});

// Invite creator endpoint (for brands)
router.post('/invite', authenticateBrand, async (req, res) => {
  try {
    const brandId = req.brand.id;
    const { creatorId, message } = req.body;

    if (!creatorId) {
      return res.status(400).json({ error: 'Creator ID is required' });
    }

    console.log(`🔍 VALIDATION: Brand ${brandId} attempting to invite user ${creatorId}`);

    // Get brand details
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { companyName: true }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // STEP 1: Check if ID exists in Brand table (REJECT if true)
    const brandAccount = await prisma.brand.findUnique({
      where: { id: creatorId },
      select: { id: true, companyName: true }
    });

    if (brandAccount) {
      console.error(`❌ BLOCKED: Attempt to invite BRAND account ${creatorId} (${brandAccount.companyName})`);
      return res.status(400).json({ 
        error: 'Cannot invite brand accounts',
        message: 'You can only invite creator accounts, not other brands.'
      });
    }

    // STEP 2: Verify ID exists in Creator table (REQUIRED)
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { 
        id: true, 
        fullName: true, 
        userName: true,
        email: true 
      }
    });

    if (!creator) {
      console.error(`❌ REJECTED: User ${creatorId} not found in Creator table`);
      return res.status(404).json({ error: 'Creator not found' });
    }

    // STEP 3: Validate creator has required fields
    if (!creator.userName || !creator.email) {
      console.error(`❌ REJECTED: Invalid creator data for ${creatorId}`);
      return res.status(400).json({ 
        error: 'Invalid creator account',
        message: 'This account is missing required creator fields.'
      });
    }

    console.log(`✅ VALIDATED: ${creatorId} is a CREATOR (${creator.fullName || creator.userName})`);

    // Create invite record in database
    const invite = await prisma.invite.create({
      data: {
        creatorId: creatorId,
        brandId: brandId,
        status: 'PENDING',
        message: message,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create notification for the creator with redirect to invites tab
    await prisma.notification.create({
      data: {
        userId: creatorId,
        userType: 'creator',
        type: 'BRAND_INVITATION',
        category: 'invitation',
        title: `Invitation from ${brand.companyName}`,
        message: message 
          ? `${brand.companyName} has invited you to connect. Message: "${message}"`
          : `${brand.companyName} has invited you to connect and collaborate!`,
        actionUrl: '/creator/dashboard?tab=invites',
        actionText: 'View Invites',
        priority: 'normal',
        isRead: false,
        metadata: {
          brandId: brandId,
          brandName: brand.companyName,
          inviteId: invite.id,
          invitationType: 'direct_invite',
          invitedAt: new Date().toISOString()
        },
        createdAt: new Date()
      }
    });

    console.log(`✅ SUCCESS: Brand ${brand.companyName} (${brandId}) invited CREATOR ${creator.fullName || creator.userName} (${creatorId})`);
    
    res.json({ 
      message: 'Invitation sent successfully',
      inviteId: invite.id,
      creator: {
        id: creator.id,
        name: creator.fullName || creator.userName,
        userType: 'creator', // Explicit confirmation
        invited: true
      }
    });

  } catch (error) {
    console.error('Error sending creator invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get list of invited creators for a brand
router.get('/invited', authenticateBrand, async (req, res) => {
  try {
    const brandId = req.brand.id;

    // Find all BRAND_INVITATION notifications sent by THIS brand
    const invitations = await prisma.notification.findMany({
      where: {
        type: 'BRAND_INVITATION',
        userType: 'creator'
      },
      select: {
        userId: true, // This is the creator ID who was invited
        metadata: true,
        createdAt: true
      }
    });

    // Filter to only invitations from THIS brand using metadata
    const invitedByThisBrand = invitations.filter(inv => {
      if (inv.metadata && typeof inv.metadata === 'object') {
        return inv.metadata.brandId === brandId;
      }
      return false;
    });

    // Get unique creator IDs
    const invitedCreatorIds = [...new Set(invitedByThisBrand.map(inv => inv.userId))];

    console.log(`📋 Brand ${brandId} has invited ${invitedCreatorIds.length} creators`);

    res.json({ 
      invitedCreators: invitedCreatorIds
    });

  } catch (error) {
    console.error('Error fetching invited creators:', error);
    res.status(500).json({ error: 'Failed to fetch invited creators' });
  }
});

module.exports = router;
