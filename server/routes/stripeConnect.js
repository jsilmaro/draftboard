const express = require('express');
const router = express.Router();
const stripeConnectService = require('../services/stripeConnectService');
const authenticateToken = require('../middleware/auth');
const prisma = require('../prisma');

/**
 * Stripe Connect API Routes
 * Handles creator onboarding, brief funding, payouts, and refunds
 */

// ===== CREATOR ONBOARDING =====

/**
 * POST /api/creators/onboard
 * Create Stripe Connect Express account for creator
 */
router.post('/creators/onboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can onboard to Stripe' });
    }

    const { country = 'US' } = req.body;
    const creatorData = {
      email: req.user.email,
      fullName: req.user.fullName || req.user.userName,
      country: country
    };

    const result = await stripeConnectService.createConnectAccount(
      req.user.id,
      creatorData
    );

    res.json({
      success: true,
      message: 'Stripe Connect account created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    
    // Provide specific guidance for Stripe Connect not enabled
    if (error.message.includes('signed up for Connect')) {
      res.status(400).json({ 
        error: 'Stripe Connect not enabled',
        message: 'Please enable Stripe Connect in your Stripe dashboard first. Go to Connect → Settings and complete the setup process.',
        setupUrl: 'https://dashboard.stripe.com/connect/accounts/overview'
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to create Connect account',
      message: error.message 
    });
  }
});

/**
 * POST /api/creators/onboard/link
 * Create account link for onboarding
 */
router.post('/creators/onboard/link', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can create onboarding links' });
    }

    const { returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      return res.status(400).json({ error: 'returnUrl and refreshUrl are required' });
    }

    // Get creator's Stripe account
    let connectAccount;
    try {
      connectAccount = await prisma.stripeConnectAccount.findUnique({
        where: { creatorId: req.user.id }
      });
    } catch (dbError) {
      console.log('StripeConnectAccount table not available');
      connectAccount = null;
    }

    if (!connectAccount) {
      return res.status(404).json({ error: 'Stripe Connect account not found. Please onboard first.' });
    }

    const result = await stripeConnectService.createAccountLink(
      connectAccount.stripeAccountId,
      returnUrl,
      refreshUrl
    );

    res.json({
      success: true,
      message: 'Account link created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(500).json({ 
      error: 'Failed to create account link',
      message: error.message 
    });
  }
});

/**
 * GET /api/creators/onboard/status
 * Get creator's Stripe account status
 */
router.get('/creators/onboard/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can check account status' });
    }

    const result = await stripeConnectService.getCreatorAccountStatus(req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ 
      error: 'Failed to get account status',
      message: error.message 
    });
  }
});

// ===== BRIEF FUNDING =====

/**
 * POST /api/briefs/:id/fund
 * Create checkout session for brief funding
 */
router.post('/briefs/:id/fund', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can fund briefs' });
    }

    const { id: briefId } = req.params;
    const { totalAmount } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid totalAmount is required' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Check if brief is already funded
    const existingFunding = await prisma.briefFunding.findUnique({
      where: { briefId: briefId }
    });

    if (existingFunding && existingFunding.status === 'completed') {
      return res.status(400).json({ error: 'Brief is already funded' });
    }

    const result = await stripeConnectService.createBriefFundingSession(
      briefId,
      req.user.id,
      parseFloat(totalAmount),
      brief.title
    );

    res.json({
      success: true,
      message: 'Funding session created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating funding session:', error);
    res.status(500).json({ 
      error: 'Failed to create funding session',
      message: error.message 
    });
  }
});

/**
 * POST /api/briefs/:id/fund/confirm
 * Confirm successful brief funding
 */
router.post('/briefs/:id/fund/confirm', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await stripeConnectService.processBriefFunding(sessionId);

    res.json({
      success: true,
      message: 'Brief funding confirmed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error confirming funding:', error);
    res.status(500).json({ 
      error: 'Failed to confirm funding',
      message: error.message 
    });
  }
});

// ===== WINNER PAYOUTS =====

/**
 * POST /api/briefs/:id/reward
 * Create payouts for selected winners
 */
router.post('/briefs/:id/reward', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create payouts' });
    }

    const { id: briefId } = req.params;
    const { winners } = req.body;

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: 'Winners array is required' });
    }

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    // Validate winners data
    for (const winner of winners) {
      if (!winner.creatorId || !winner.submissionId || !winner.amount) {
        return res.status(400).json({ 
          error: 'Each winner must have creatorId, submissionId, and amount' 
        });
      }
    }

    const result = await stripeConnectService.createWinnerPayouts(briefId, winners);

    res.json({
      success: true,
      message: 'Payouts created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating payouts:', error);
    res.status(500).json({ 
      error: 'Failed to create payouts',
      message: error.message 
    });
  }
});

// ===== REFUNDS =====

/**
 * POST /api/briefs/:id/refund
 * Process refund for unused funds
 */
router.post('/briefs/:id/refund', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can request refunds' });
    }

    const { id: briefId } = req.params;
    const { reason } = req.body;

    // Verify brief exists and belongs to brand
    const brief = await prisma.brief.findFirst({
      where: { 
        id: briefId,
        brandId: req.user.id 
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found or access denied' });
    }

    const result = await stripeConnectService.processBriefRefund(
      briefId, 
      reason || 'Brief expired with unused funds'
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      error: 'Failed to process refund',
      message: error.message 
    });
  }
});

// ===== UTILITY ROUTES =====

/**
 * GET /api/briefs/:id/funding/status
 * Get brief funding status
 */
router.get('/briefs/:id/funding/status', authenticateToken, async (req, res) => {
  try {
    const { id: briefId } = req.params;

    const funding = await prisma.briefFunding.findUnique({
      where: { briefId: briefId },
      include: {
        brief: {
          select: { title: true, brandId: true }
        },
        payouts: {
          include: {
            creator: {
              select: { fullName: true, userName: true }
            }
          }
        },
        refunds: true
      }
    });

    if (!funding) {
      return res.status(404).json({ error: 'Brief funding not found' });
    }

    // Check access permissions
    if (req.user.type === 'brand' && funding.brief.brandId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: funding
    });
  } catch (error) {
    console.error('Error getting funding status:', error);
    res.status(500).json({ 
      error: 'Failed to get funding status',
      message: error.message 
    });
  }
});

/**
 * GET /api/creators/payouts
 * Get creator's payout history
 */
router.get('/creators/payouts', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'creator') {
      return res.status(403).json({ error: 'Only creators can view payouts' });
    }

    try {
      const payouts = await prisma.creatorPayout.findMany({
        where: { creatorId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });

      // Fetch related data separately since relations are not defined
      const enrichedPayouts = await Promise.all(payouts.map(async (payout) => {
        try {
          const [brief, submission] = await Promise.all([
            prisma.brief.findUnique({
              where: { id: payout.briefId },
              select: { 
                title: true, 
                brand: { 
                  select: { companyName: true } 
                } 
              }
            }),
            prisma.submission.findUnique({
              where: { id: payout.submissionId },
              select: { id: true, submittedAt: true }
            })
          ]);

          return {
            ...payout,
            brief: brief || null,
            submission: submission || null
          };
        } catch (error) {
          console.error('Error fetching related data for payout:', payout.id, error);
          return {
            ...payout,
            brief: null,
            submission: null
          };
        }
      }));

      res.json({
        success: true,
        data: enrichedPayouts
      });
    } catch (dbError) {
      // If CreatorPayout table doesn't exist yet, return empty array
      console.log('CreatorPayout table not available, returning empty payouts');
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Error getting creator payouts:', error);
    res.status(500).json({ 
      error: 'Failed to get payouts',
      message: error.message 
    });
  }
});

module.exports = router;
