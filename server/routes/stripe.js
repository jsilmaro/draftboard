const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../prisma');
// We'll use the authenticateToken middleware from the main server
// const auth = require('../middleware/auth');

// Create Stripe Checkout Session for Brief Funding
router.post('/create-checkout-session', async (req, res) => {
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
router.post('/transfer', async (req, res) => {
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
router.get('/account/:creatorId', async (req, res) => {
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
router.get('/funded-briefs', async (req, res) => {
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
router.get('/payouts/:creatorId', async (req, res) => {
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

module.exports = router;
