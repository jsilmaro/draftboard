// Dynamic Stripe initialization based on mode
const getStripeInstance = () => {
  const mode = process.env.STRIPE_MODE || 'test';
  
  if (mode === 'live') {
    const secretKey = process.env.STRIPE_SECRET_KEY_LIVE;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY_LIVE is required for live mode');
    }
    console.log('🔴 Server using Stripe LIVE mode');
    return require('stripe')(secretKey);
  } else {
    const secretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.log('⚠️ STRIPE_SECRET_KEY not found, Stripe disabled');
      return null;
    }
    console.log('🟡 Server using Stripe TEST mode');
    return require('stripe')(secretKey);
  }
};

const stripe = getStripeInstance();
const prisma = require('../prisma');

// Check if Stripe is available
const isStripeAvailable = () => stripe !== null;

/**
 * Stripe Connect Service
 * Handles all Stripe Connect operations for the creator-brand collaboration platform
 */

class StripeConnectService {
  constructor() {
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5'); // 5% default
    this.minimumFee = parseFloat(process.env.MINIMUM_PLATFORM_FEE || '0.50'); // $0.50 minimum
  }

  /**
   * Calculate platform fee for a given amount
   * @param {number} amount - Amount in dollars
   * @returns {object} - { platformFee, netAmount }
   */
  calculatePlatformFee(amount) {
    const platformFee = Math.max(
      (amount * this.platformFeePercentage) / 100,
      this.minimumFee
    );
    const netAmount = amount - platformFee;
    
    return {
      platformFee: parseFloat(platformFee.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2))
    };
  }

  /**
   * Create Stripe Connect Express account for creator
   * @param {string} creatorId - Creator ID
   * @param {object} creatorData - Creator information
   * @returns {object} - Account creation result
   */
  async createConnectAccount(creatorId, creatorData) {
    try {
      if (!isStripeAvailable()) {
        throw new Error('Stripe is not configured');
      }

      const { email, country = 'US' } = creatorData;

      // Create Stripe Connect Express account
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

      // Store account in database
      const connectAccount = await prisma.stripeConnectAccount.upsert({
        where: { creatorId: creatorId },
        update: {
          stripeAccountId: account.id,
          status: 'pending',
          updatedAt: new Date()
        },
        create: {
          creatorId: creatorId,
          stripeAccountId: account.id,
          status: 'pending'
        }
      });

      console.log(`✅ Stripe Connect account created: ${account.id} for creator ${creatorId}`);

      return {
        success: true,
        accountId: account.id,
        connectAccountId: connectAccount.id,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw new Error(`Failed to create Connect account: ${error.message}`);
    }
  }

  /**
   * Create account link for onboarding
   * @param {string} accountId - Stripe account ID
   * @param {string} returnUrl - Return URL after onboarding
   * @param {string} refreshUrl - Refresh URL if onboarding expires
   * @returns {object} - Account link
   */
  async createAccountLink(accountId, returnUrl, refreshUrl) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding'
      });

      return {
        success: true,
        url: accountLink.url,
        expiresAt: accountLink.expires_at
      };
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error(`Failed to create account link: ${error.message}`);
    }
  }

  /**
   * Get account status and requirements
   * @param {string} accountId - Stripe account ID
   * @returns {object} - Account status
   */
  async getAccountStatus(accountId) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      // Update database with current status
      await prisma.stripeConnectAccount.update({
        where: { stripeAccountId: accountId },
        data: {
          status: account.details_submitted ? 'active' : 'pending',
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements
        }
      });

      return {
        success: true,
        status: account.details_submitted ? 'active' : 'pending',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements
      };
    } catch (error) {
      console.error('Error retrieving account status:', error);
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  /**
   * Create checkout session for brief funding
   * @param {string} briefId - Brief ID
   * @param {string} brandId - Brand ID
   * @param {number} totalAmount - Total amount to charge
   * @param {string} briefTitle - Brief title
   * @returns {object} - Checkout session
   */
  async createBriefFundingSession(briefId, brandId, totalAmount, briefTitle) {
    try {
      const { platformFee, netAmount } = this.calculatePlatformFee(totalAmount);
      
      // Create brief funding record
      const funding = await prisma.briefFunding.create({
        data: {
          briefId: briefId,
          brandId: brandId,
          totalAmount: totalAmount,
          platformFee: platformFee,
          netAmount: netAmount,
          status: 'pending'
        }
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Brief Funding: ${briefTitle}`,
              description: `Funding for brief: ${briefTitle}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/briefs/${briefId}/funding/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/briefs/${briefId}/funding/cancel`,
        metadata: {
          briefId: briefId,
          brandId: brandId,
          fundingId: funding.id,
          type: 'brief_funding'
        }
      });

      // Update funding record with session ID
      await prisma.briefFunding.update({
        where: { id: funding.id },
        data: { stripeCheckoutSessionId: session.id }
      });

      console.log(`✅ Brief funding session created: ${session.id} for $${totalAmount}`);

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        fundingId: funding.id
      };
    } catch (error) {
      console.error('Error creating brief funding session:', error);
      throw new Error(`Failed to create funding session: ${error.message}`);
    }
  }

  /**
   * Process successful brief funding
   * @param {string} sessionId - Stripe checkout session ID
   * @returns {object} - Processing result
   */
  async processBriefFunding(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        throw new Error('Payment not completed');
      }

      // Find funding record
      const funding = await prisma.briefFunding.findFirst({
        where: { stripeCheckoutSessionId: sessionId }
      });

      if (!funding) {
        throw new Error('Funding record not found');
      }

      // Update funding status
      await prisma.briefFunding.update({
        where: { id: funding.id },
        data: {
          status: 'completed',
          fundedAt: new Date(),
          stripePaymentIntentId: session.payment_intent
        }
      });

      console.log(`✅ Brief funding processed: ${funding.id} for $${funding.totalAmount}`);

      return {
        success: true,
        fundingId: funding.id,
        amount: funding.totalAmount,
        netAmount: funding.netAmount
      };
    } catch (error) {
      console.error('Error processing brief funding:', error);
      throw new Error(`Failed to process funding: ${error.message}`);
    }
  }

  /**
   * Create payouts for selected winners
   * @param {string} briefId - Brief ID
   * @param {Array} winners - Array of winner objects with creatorId, submissionId, amount
   * @returns {object} - Payout results
   */
  async createWinnerPayouts(briefId, winners) {
    try {
      const funding = await prisma.briefFunding.findUnique({
        where: { briefId: briefId },
        include: { brief: true }
      });

      if (!funding || funding.status !== 'completed') {
        throw new Error('Brief not funded or funding not completed');
      }

      const results = [];
      const transferGroupId = `tg_${briefId}_${Date.now()}`;

      for (const winner of winners) {
        try {
          // Get creator's Stripe account
          const connectAccount = await prisma.stripeConnectAccount.findUnique({
            where: { creatorId: winner.creatorId }
          });

          if (!connectAccount || connectAccount.status !== 'active') {
            throw new Error(`Creator ${winner.creatorId} not onboarded to Stripe`);
          }

          const { platformFee, netAmount } = this.calculatePlatformFee(winner.amount);

          // Create payout record
          const payout = await prisma.creatorPayout.create({
            data: {
              creatorId: winner.creatorId,
              briefId: briefId,
              submissionId: winner.submissionId,
              amount: winner.amount,
              platformFee: platformFee,
              netAmount: netAmount,
              stripeTransferGroupId: transferGroupId,
              status: 'pending'
            }
          });

          // Create Stripe transfer
          const transfer = await stripe.transfers.create({
            amount: Math.round(netAmount * 100), // Convert to cents
            currency: 'usd',
            destination: connectAccount.stripeAccountId,
            transfer_group: transferGroupId,
            metadata: {
              briefId: briefId,
              creatorId: winner.creatorId,
              submissionId: winner.submissionId,
              payoutId: payout.id
            }
          });

          // Update payout with transfer ID
          await prisma.creatorPayout.update({
            where: { id: payout.id },
            data: {
              stripeTransferId: transfer.id,
              status: 'paid',
              paidAt: new Date()
            }
          });

          results.push({
            success: true,
            payoutId: payout.id,
            transferId: transfer.id,
            amount: netAmount,
            creatorId: winner.creatorId
          });

          console.log(`✅ Payout created: ${payout.id} for $${netAmount} to creator ${winner.creatorId}`);

        } catch (error) {
          console.error(`Error creating payout for creator ${winner.creatorId}:`, error);
          results.push({
            success: false,
            creatorId: winner.creatorId,
            error: error.message
          });
        }
      }

      return {
        success: true,
        transferGroupId: transferGroupId,
        results: results
      };
    } catch (error) {
      console.error('Error creating winner payouts:', error);
      throw new Error(`Failed to create payouts: ${error.message}`);
    }
  }

  /**
   * Process refund for unused funds
   * @param {string} briefId - Brief ID
   * @param {string} reason - Refund reason
   * @returns {object} - Refund result
   */
  async processBriefRefund(briefId, reason = 'Brief expired with unused funds') {
    try {
      const funding = await prisma.briefFunding.findUnique({
        where: { briefId: briefId },
        include: { brief: true }
      });

      if (!funding || funding.status !== 'completed') {
        throw new Error('Brief not funded or funding not completed');
      }

      // Calculate remaining funds (total - already paid out)
      const paidOut = await prisma.creatorPayout.aggregate({
        where: { 
          briefId: briefId,
          status: 'paid'
        },
        _sum: { amount: true }
      });

      const remainingAmount = funding.totalAmount - (paidOut._sum.amount || 0);

      if (remainingAmount <= 0) {
        throw new Error('No funds remaining to refund');
      }

      // Create refund record
      const refund = await prisma.briefRefund.create({
        data: {
          briefId: briefId,
          brandId: funding.brandId,
          amount: remainingAmount,
          reason: reason,
          status: 'pending'
        }
      });

      // Create Stripe refund
      const stripeRefund = await stripe.refunds.create({
        payment_intent: funding.stripePaymentIntentId,
        amount: Math.round(remainingAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          briefId: briefId,
          refundId: refund.id,
          reason: reason
        }
      });

      // Update refund record
      await prisma.briefRefund.update({
        where: { id: refund.id },
        data: {
          stripeRefundId: stripeRefund.id,
          status: 'completed',
          processedAt: new Date()
        }
      });

      console.log(`✅ Refund processed: ${refund.id} for $${remainingAmount}`);

      return {
        success: true,
        refundId: refund.id,
        amount: remainingAmount,
        stripeRefundId: stripeRefund.id
      };
    } catch (error) {
      console.error('Error processing brief refund:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Get creator's Stripe account status
   * @param {string} creatorId - Creator ID
   * @returns {object} - Account status
   */
  async getCreatorAccountStatus(creatorId) {
    try {
      const connectAccount = await prisma.stripeConnectAccount.findUnique({
        where: { creatorId: creatorId }
      });

      if (!connectAccount) {
        return {
          success: true,
          onboarded: false,
          status: 'not_created'
        };
      }

      // Get fresh status from Stripe
      const accountStatus = await this.getAccountStatus(connectAccount.stripeAccountId);

      return {
        success: true,
        onboarded: true,
        status: accountStatus.status,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled,
        requirements: accountStatus.requirements
      };
    } catch (error) {
      console.error('Error getting creator account status:', error);
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }
}

module.exports = new StripeConnectService();
