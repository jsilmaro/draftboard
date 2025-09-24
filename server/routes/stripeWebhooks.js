const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma');

// Initialize Stripe only if API key is available
let stripe = null;
const stripeKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
  stripe = require('stripe')(stripeKey);
} else {
  console.log('⚠️ STRIPE_SECRET_KEY not found, using mock mode for webhooks');
}

/**
 * Stripe Webhooks Handler
 * Processes Stripe events for Connect accounts, payments, and transfers
 */

// Stripe webhook endpoint
router.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  // If Stripe is not initialized, return mock response
  if (!stripe) {
    console.log('🔔 Mock webhook received (Stripe not configured)');
    return res.json({ received: true, mock: true });
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

  console.log(`📨 Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle account.updated event
 * Updates Connect account status when onboarding is completed
 */
async function handleAccountUpdated(account) {
  try {
    console.log(`🔄 Processing account.updated for ${account.id}`);

    const connectAccount = await prisma.stripeConnectAccount.findUnique({
      where: { stripeAccountId: account.id }
    });

    if (!connectAccount) {
      console.log(`⚠️ Connect account not found in database: ${account.id}`);
      return;
    }

    // Update account status
    await prisma.stripeConnectAccount.update({
      where: { stripeAccountId: account.id },
      data: {
        status: account.details_submitted ? 'active' : 'pending',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        updatedAt: new Date()
      }
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: connectAccount.creatorId,
        userType: 'creator',
        title: 'Stripe Account Updated',
        message: account.details_submitted 
          ? 'Your Stripe account is now active and ready to receive payments!'
          : 'Your Stripe account requires additional information to be completed.',
        type: 'payment',
        category: 'wallet',
        metadata: {
          accountId: account.id,
          status: account.details_submitted ? 'active' : 'pending',
          requirements: account.requirements
        }
      }
    });

    console.log(`✅ Account updated: ${account.id} - Status: ${account.details_submitted ? 'active' : 'pending'}`);
  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

/**
 * Handle checkout.session.completed event
 * Processes successful brief funding
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log(`💳 Processing checkout.session.completed for ${session.id}`);

    if (session.metadata?.type !== 'brief_funding') {
      console.log(`⚠️ Ignoring non-brief-funding session: ${session.id}`);
      return;
    }

    // Extract data from session metadata
    const { briefId, brandId, totalAmount, platformFee, netAmount } = session.metadata;
    
    if (!briefId || !brandId) {
      console.log(`⚠️ Missing brief or brand information in session metadata: ${session.id}`);
      return;
    }

    // Create funding record and update brief status in a transaction
    await prisma.$transaction(async (tx) => {
      // Create funding record (NOW after payment is confirmed)
      await tx.briefFunding.create({
        data: {
          briefId: briefId,
          brandId: brandId,
          totalAmount: parseFloat(totalAmount),
          platformFee: parseFloat(platformFee),
          netAmount: parseFloat(netAmount),
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          status: 'completed',
          fundedAt: new Date()
        }
      });

      // Update brief status to funded
      await tx.brief.update({
        where: { id: briefId },
        data: {
          isFunded: true,
          fundedAt: new Date()
        }
      });

      // Create notification for brand
      await tx.notification.create({
        data: {
          userId: brandId,
          userType: 'brand',
          title: 'Brief Funding Successful',
          message: `Your brief has been successfully funded with $${totalAmount}. You can now start reviewing submissions!`,
          type: 'payment',
          category: 'brief',
          metadata: {
            briefId: briefId,
            amount: totalAmount,
            sessionId: session.id
          }
        }
      });

      console.log(`✅ Brief funding completed: ${briefId} - $${totalAmount}`);
    });

  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

/**
 * Handle payment_intent.succeeded event
 * Backup handler for successful payments
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log(`💰 Processing payment_intent.succeeded for ${paymentIntent.id}`);

    // Find funding by payment intent ID
    const funding = await prisma.briefFunding.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!funding) {
      console.log(`⚠️ Funding record not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update funding status if not already completed
    if (funding.status !== 'completed') {
      await prisma.briefFunding.update({
        where: { id: funding.id },
        data: {
          status: 'completed',
          fundedAt: new Date()
        }
      });

      console.log(`✅ Brief funding confirmed: ${funding.briefId} - $${funding.totalAmount}`);
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

/**
 * Handle transfer.created event
 * Updates payout status when transfer is created
 */
async function handleTransferCreated(transfer) {
  try {
    console.log(`📤 Processing transfer.created for ${transfer.id}`);

    const payout = await prisma.creatorPayout.findFirst({
      where: { stripeTransferId: transfer.id }
    });

    if (!payout) {
      console.log(`⚠️ Payout record not found for transfer: ${transfer.id}`);
      return;
    }

    // Update payout status
    await prisma.creatorPayout.update({
      where: { id: payout.id },
      data: {
        status: transfer.status === 'paid' ? 'paid' : 'pending',
        paidAt: transfer.status === 'paid' ? new Date() : null
      }
    });

    // Create notification for creator
    if (transfer.status === 'paid') {
      await prisma.notification.create({
        data: {
          userId: payout.creatorId,
          userType: 'creator',
          title: 'Payment Received!',
          message: `You've received $${payout.netAmount} for your winning submission!`,
          type: 'payment',
          category: 'reward',
          metadata: {
            payoutId: payout.id,
            amount: payout.netAmount,
            transferId: transfer.id
          }
        }
      });
    }

    console.log(`✅ Transfer processed: ${transfer.id} - Status: ${transfer.status}`);
  } catch (error) {
    console.error('Error handling transfer.created:', error);
  }
}

/**
 * Handle transfer.updated event
 * Updates payout status when transfer status changes
 */
async function handleTransferUpdated(transfer) {
  try {
    console.log(`🔄 Processing transfer.updated for ${transfer.id}`);

    const payout = await prisma.creatorPayout.findFirst({
      where: { stripeTransferId: transfer.id }
    });

    if (!payout) {
      console.log(`⚠️ Payout record not found for transfer: ${transfer.id}`);
      return;
    }

    // Update payout status
    await prisma.creatorPayout.update({
      where: { id: payout.id },
      data: {
        status: transfer.status === 'paid' ? 'paid' : 'failed',
        paidAt: transfer.status === 'paid' ? new Date() : null
      }
    });

    console.log(`✅ Transfer updated: ${transfer.id} - Status: ${transfer.status}`);
  } catch (error) {
    console.error('Error handling transfer.updated:', error);
  }
}

/**
 * Handle refund.created event
 * Updates refund status when refund is processed
 */
async function handleRefundCreated(refund) {
  try {
    console.log(`💸 Processing refund.created for ${refund.id}`);

    const refundRecord = await prisma.briefRefund.findFirst({
      where: { stripeRefundId: refund.id }
    });

    if (!refundRecord) {
      console.log(`⚠️ Refund record not found for refund: ${refund.id}`);
      return;
    }

    // Update refund status
    await prisma.briefRefund.update({
      where: { id: refundRecord.id },
      data: {
        status: refund.status === 'succeeded' ? 'completed' : 'failed',
        processedAt: refund.status === 'succeeded' ? new Date() : null
      }
    });

    // Create notification for brand
    if (refund.status === 'succeeded') {
      await prisma.notification.create({
        data: {
          userId: refundRecord.brandId,
          userType: 'brand',
          title: 'Refund Processed',
          message: `Your refund of $${refundRecord.amount} has been processed successfully.`,
          type: 'payment',
          category: 'wallet',
          metadata: {
            refundId: refundRecord.id,
            amount: refundRecord.amount,
            stripeRefundId: refund.id
          }
        }
      });
    }

    console.log(`✅ Refund processed: ${refund.id} - Status: ${refund.status}`);
  } catch (error) {
    console.error('Error handling refund.created:', error);
  }
}

module.exports = router;


