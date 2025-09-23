const { prisma } = require('../prisma');

/**
 * Comprehensive Stripe Webhook Service
 * Handles all Stripe events with proper error handling, retry logic, and logging
 */

class StripeWebhookService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.supportedEvents = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'account.updated',
      'transfer.created',
      'transfer.updated',
      'transfer.paid',
      'payout.paid',
      'payout.failed',
      'refund.created',
      'refund.updated'
    ];
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(event) {
    const startTime = Date.now();
    
    try {
      console.log(`🔔 Processing webhook event: ${event.type} (ID: ${event.id})`);
      
      // Check if event is supported
      if (!this.supportedEvents.includes(event.type)) {
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return { success: true, message: 'Event type not handled' };
      }

      // Process the event
      let result;
      switch (event.type) {
        case 'checkout.session.completed':
          result = await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'account.updated':
          result = await this.handleAccountUpdated(event.data.object);
          break;
        case 'transfer.created':
          result = await this.handleTransferCreated(event.data.object);
          break;
        case 'transfer.updated':
          result = await this.handleTransferUpdated(event.data.object);
          break;
        case 'transfer.paid':
          result = await this.handleTransferPaid(event.data.object);
          break;
        case 'payout.paid':
          result = await this.handlePayoutPaid(event.data.object);
          break;
        case 'payout.failed':
          result = await this.handlePayoutFailed(event.data.object);
          break;
        case 'refund.created':
          result = await this.handleRefundCreated(event.data.object);
          break;
        case 'refund.updated':
          result = await this.handleRefundUpdated(event.data.object);
          break;
        default:
          result = { success: false, message: 'Unknown event type' };
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Webhook processed successfully: ${event.type} (${processingTime}ms)`);
      
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Webhook processing failed: ${event.type} (${processingTime}ms)`, error);
      
      // Log error details for debugging
      await this.logWebhookError(event, error);
      
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   * Marks Brief as funded and links payment to the correct Brief
   */
  async handleCheckoutSessionCompleted(session) {
    console.log(`💳 Processing checkout.session.completed for session: ${session.id}`);
    
    try {
      const metadata = session.metadata || {};

      if (metadata.type === 'brief_funding' && metadata.briefId && metadata.brandId) {
        // Handle brief funding
        await this.processBriefFunding(session, metadata.briefId, metadata.brandId);
      } else if (metadata.type === 'wallet_funding' && metadata.brandId) {
        // Handle wallet funding
        await this.processWalletFunding(session, metadata.brandId);
      } else {
        console.log(`⚠️ Unknown checkout session type or missing metadata: ${session.id}`);
        return { success: false, message: 'Unknown session type' };
      }

      return { success: true, message: 'Checkout session processed successfully' };
    } catch (error) {
      console.error('Error handling checkout.session.completed:', error);
      throw error;
    }
  }

  /**
   * Handle payment_intent.succeeded event
   * Backup confirmation for successful payments
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    console.log(`💰 Processing payment_intent.succeeded for: ${paymentIntent.id}`);
    
    try {
      // Find existing funding record
      const funding = await prisma.briefFunding.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (funding && funding.status !== 'completed') {
        await prisma.briefFunding.update({
          where: { id: funding.id },
          data: {
            status: 'completed',
            fundedAt: new Date()
          }
        });

        // Update brief status
        await prisma.brief.update({
          where: { id: funding.briefId },
          data: {
            isFunded: true,
            fundedAt: new Date()
          }
        });

        // Create notification
        await this.createNotification(
          funding.brandId,
          'brand',
          'Brief Funding Confirmed',
          `Your brief has been successfully funded with $${funding.totalAmount}. You can now start reviewing submissions!`,
          'payment',
          'brief',
          { briefId: funding.briefId, amount: funding.totalAmount }
        );

        console.log(`✅ Brief funding confirmed: ${funding.briefId} - $${funding.totalAmount}`);
      }

      return { success: true, message: 'Payment intent processed successfully' };
    } catch (error) {
      console.error('Error handling payment_intent.succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  async handlePaymentIntentFailed(paymentIntent) {
    console.log(`💸 Processing payment_intent.payment_failed for: ${paymentIntent.id}`);
    
    try {
      const funding = await prisma.briefFunding.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (funding) {
        await prisma.briefFunding.update({
          where: { id: funding.id },
          data: {
            status: 'failed',
            updatedAt: new Date()
          }
        });

        // Create notification for brand
        await this.createNotification(
          funding.brandId,
          'brand',
          'Payment Failed',
          `Your payment of $${funding.totalAmount} for brief funding has failed. Please try again.`,
          'payment',
          'brief',
          { briefId: funding.briefId, amount: funding.totalAmount }
        );

        console.log(`❌ Brief funding failed: ${funding.briefId} - $${funding.totalAmount}`);
      }

      return { success: true, message: 'Payment failure processed successfully' };
    } catch (error) {
      console.error('Error handling payment_intent.payment_failed:', error);
      throw error;
    }
  }

  /**
   * Handle account.updated event
   * Updates Creator account status (restricted, enabled)
   */
  async handleAccountUpdated(account) {
    console.log(`🔄 Processing account.updated for account: ${account.id}`);
    
    try {
      // Find creator account
      const creatorAccount = await prisma.creatorStripeAccount.findUnique({
        where: { stripeAccountId: account.id }
      });

      if (!creatorAccount) {
        console.log(`⚠️ Creator account not found: ${account.id}`);
        return { success: false, message: 'Creator account not found' };
      }

      // Determine account status
      let status = 'pending';
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'active';
      } else if (account.requirements && account.requirements.currently_due.length > 0) {
        status = 'restricted';
      }

      // Update account status
      await prisma.creatorStripeAccount.update({
        where: { id: creatorAccount.id },
        data: {
          status,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements,
          updatedAt: new Date()
        }
      });

      // Create notification for creator
      let notificationTitle, notificationMessage;
      if (status === 'active') {
        notificationTitle = 'Stripe Account Active!';
        notificationMessage = 'Your Stripe account is now active and ready to receive payments!';
      } else if (status === 'restricted') {
        notificationTitle = 'Stripe Account Requires Action';
        notificationMessage = 'Your Stripe account requires additional information to be completed.';
      } else {
        notificationTitle = 'Stripe Account Updated';
        notificationMessage = 'Your Stripe account status has been updated.';
      }

      await this.createNotification(
        creatorAccount.creatorId,
        'creator',
        notificationTitle,
        notificationMessage,
        'payment',
        'wallet',
        {
          accountId: account.id,
          status,
          requirements: account.requirements
        }
      );

      console.log(`✅ Creator account updated: ${account.id} - Status: ${status}`);
      return { success: true, message: 'Account updated successfully' };
    } catch (error) {
      console.error('Error handling account.updated:', error);
      throw error;
    }
  }

  /**
   * Handle transfer.created event
   */
  async handleTransferCreated(transfer) {
    console.log(`📤 Processing transfer.created for: ${transfer.id}`);
    
    try {
      // Find payout record
      const payout = await prisma.creatorPayout.findFirst({
        where: { stripeTransferId: transfer.id }
      });

      if (payout) {
        await prisma.creatorPayout.update({
          where: { id: payout.id },
          data: {
            status: transfer.status === 'paid' ? 'paid' : 'pending',
            paidAt: transfer.status === 'paid' ? new Date() : null,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Transfer created: ${transfer.id} - Status: ${transfer.status}`);
      } else {
        console.log(`⚠️ Payout record not found for transfer: ${transfer.id}`);
      }

      return { success: true, message: 'Transfer created successfully' };
    } catch (error) {
      console.error('Error handling transfer.created:', error);
      throw error;
    }
  }

  /**
   * Handle transfer.updated event
   */
  async handleTransferUpdated(transfer) {
    console.log(`🔄 Processing transfer.updated for: ${transfer.id}`);
    
    try {
      const payout = await prisma.creatorPayout.findFirst({
        where: { stripeTransferId: transfer.id }
      });

      if (payout) {
        await prisma.creatorPayout.update({
          where: { id: payout.id },
          data: {
            status: transfer.status === 'paid' ? 'paid' : 'failed',
            paidAt: transfer.status === 'paid' ? new Date() : null,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Transfer updated: ${transfer.id} - Status: ${transfer.status}`);
      }

      return { success: true, message: 'Transfer updated successfully' };
    } catch (error) {
      console.error('Error handling transfer.updated:', error);
      throw error;
    }
  }

  /**
   * Handle transfer.paid event
   */
  async handleTransferPaid(transfer) {
    console.log(`✅ Processing transfer.paid for: ${transfer.id}`);
    
    try {
      const payout = await prisma.creatorPayout.findFirst({
        where: { stripeTransferId: transfer.id }
      });

      if (payout) {
        await prisma.creatorPayout.update({
          where: { id: payout.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Update creator wallet
        await this.updateCreatorWallet(payout.creatorId, payout.netAmount, 'credit', 'Payout received');

        // Create notification for creator
        await this.createNotification(
          payout.creatorId,
          'creator',
          'Payment Received!',
          `You've received $${payout.netAmount} for your winning submission!`,
          'payment',
          'reward',
          {
            payoutId: payout.id,
            amount: payout.netAmount,
            transferId: transfer.id
          }
        );

        console.log(`✅ Creator paid: ${payout.creatorId} - $${payout.netAmount}`);
      }

      return { success: true, message: 'Transfer paid successfully' };
    } catch (error) {
      console.error('Error handling transfer.paid:', error);
      throw error;
    }
  }

  /**
   * Handle payout.paid event
   */
  async handlePayoutPaid(payout) {
    console.log(`💰 Processing payout.paid for: ${payout.id}`);
    
    try {
      // This event is typically for Connect account payouts
      // We can use this to confirm creators received their funds
      
      console.log(`✅ Payout confirmed: ${payout.id} - Amount: $${payout.amount / 100}`);
      return { success: true, message: 'Payout paid successfully' };
    } catch (error) {
      console.error('Error handling payout.paid:', error);
      throw error;
    }
  }

  /**
   * Handle payout.failed event
   */
  async handlePayoutFailed(payout) {
    console.log(`❌ Processing payout.failed for: ${payout.id}`);
    
    try {
      // Handle failed payouts - might need to retry or notify
      console.log(`❌ Payout failed: ${payout.id} - Amount: $${payout.amount / 100}`);
      return { success: true, message: 'Payout failure processed' };
    } catch (error) {
      console.error('Error handling payout.failed:', error);
      throw error;
    }
  }

  /**
   * Handle refund.created event
   */
  async handleRefundCreated(refund) {
    console.log(`💸 Processing refund.created for: ${refund.id}`);
    
    try {
      const refundRecord = await prisma.briefRefund.findFirst({
        where: { stripeRefundId: refund.id }
      });

      if (refundRecord) {
        await prisma.briefRefund.update({
          where: { id: refundRecord.id },
          data: {
            status: refund.status === 'succeeded' ? 'completed' : 'failed',
            processedAt: refund.status === 'succeeded' ? new Date() : null,
            updatedAt: new Date()
          }
        });

        if (refund.status === 'succeeded') {
          // Create notification for brand
          await this.createNotification(
            refundRecord.brandId,
            'brand',
            'Refund Processed',
            `Your refund of $${refundRecord.amount} has been processed successfully.`,
            'payment',
            'wallet',
            {
              refundId: refundRecord.id,
              amount: refundRecord.amount,
              stripeRefundId: refund.id
            }
          );
        }

        console.log(`✅ Refund processed: ${refund.id} - Status: ${refund.status}`);
      }

      return { success: true, message: 'Refund processed successfully' };
    } catch (error) {
      console.error('Error handling refund.created:', error);
      throw error;
    }
  }

  /**
   * Handle refund.updated event
   */
  async handleRefundUpdated(refund) {
    console.log(`🔄 Processing refund.updated for: ${refund.id}`);
    
    try {
      const refundRecord = await prisma.briefRefund.findFirst({
        where: { stripeRefundId: refund.id }
      });

      if (refundRecord) {
        await prisma.briefRefund.update({
          where: { id: refundRecord.id },
          data: {
            status: refund.status === 'succeeded' ? 'completed' : 'failed',
            updatedAt: new Date()
          }
        });

        console.log(`✅ Refund updated: ${refund.id} - Status: ${refund.status}`);
      }

      return { success: true, message: 'Refund updated successfully' };
    } catch (error) {
      console.error('Error handling refund.updated:', error);
      throw error;
    }
  }

  /**
   * Process brief funding
   */
  async processBriefFunding(session, briefId, brandId) {
    const funding = await prisma.briefFunding.findFirst({
      where: { stripeCheckoutSessionId: session.id }
    });

    if (!funding) {
      console.log(`⚠️ Funding record not found for session: ${session.id}`);
      return;
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

    // Update brief status
    await prisma.brief.update({
      where: { id: briefId },
      data: {
        isFunded: true,
        fundedAt: new Date()
      }
    });

    // Create notification for brand
    await this.createNotification(
      brandId,
      'brand',
      'Brief Funding Successful',
      `Your brief has been successfully funded with $${funding.totalAmount}. You can now start reviewing submissions!`,
      'payment',
      'brief',
      {
        briefId,
        amount: funding.totalAmount,
        sessionId: session.id
      }
    );

    console.log(`✅ Brief funding completed: ${briefId} - $${funding.totalAmount}`);
  }

  /**
   * Process wallet funding
   */
  async processWalletFunding(session, brandId) {
    const amount = session.amount_total / 100; // Convert from cents

    // Update brand wallet
    await this.updateBrandWallet(brandId, amount, 'credit', 'Wallet funding via Stripe');

    // Create notification for brand
    await this.createNotification(
      brandId,
      'brand',
      'Wallet Funded',
      `Your wallet has been funded with $${amount}. You can now use these funds for brief creation.`,
      'payment',
      'wallet',
      {
        amount,
        sessionId: session.id
      }
    );

    console.log(`✅ Wallet funding completed: ${brandId} - $${amount}`);
  }

  /**
   * Update creator wallet
   */
  async updateCreatorWallet(creatorId, amount, type, description) {
    const wallet = await prisma.creatorWallet.upsert({
      where: { creatorId },
      update: {
        balance: { increment: amount },
        totalEarned: type === 'credit' ? { increment: amount } : undefined,
        totalWithdrawn: type === 'debit' ? { increment: amount } : undefined,
        updatedAt: new Date()
      },
      create: {
        creatorId,
        balance: type === 'credit' ? amount : -amount,
        totalEarned: type === 'credit' ? amount : 0,
        totalWithdrawn: type === 'debit' ? amount : 0
      }
    });

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        description,
        balanceBefore: wallet.balance - (type === 'credit' ? amount : -amount),
        balanceAfter: wallet.balance,
        referenceId: `stripe_${Date.now()}`
      }
    });
  }

  /**
   * Update brand wallet
   */
  async updateBrandWallet(brandId, amount, type, description) {
    const wallet = await prisma.brandWallet.upsert({
      where: { brandId },
      update: {
        balance: { increment: amount },
        totalDeposited: type === 'credit' ? { increment: amount } : undefined,
        totalSpent: type === 'debit' ? { increment: amount } : undefined,
        updatedAt: new Date()
      },
      create: {
        brandId,
        balance: type === 'credit' ? amount : -amount,
        totalDeposited: type === 'credit' ? amount : 0,
        totalSpent: type === 'debit' ? amount : 0
      }
    });

    // Create transaction record
    await prisma.brandWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        description,
        balanceBefore: wallet.balance - (type === 'credit' ? amount : -amount),
        balanceAfter: wallet.balance,
        referenceId: `stripe_${Date.now()}`
      }
    });
  }

  /**
   * Create notification
   */
  async createNotification(userId, userType, title, message, type, category, metadata) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          userType,
          title,
          message,
          type,
          category,
          metadata,
          isRead: false,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Log webhook errors for debugging
   */
  async logWebhookError(event, error) {
    try {
      console.error('Webhook Error Details:', {
        eventId: event.id,
        eventType: event.type,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        eventData: {
          id: event.data.object?.id,
          metadata: event.data.object?.metadata
        }
      });
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
  }

  /**
   * Retry mechanism for failed operations
   */
  async retryOperation(operation, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`⚠️ Operation failed, retrying (${attempt}/${maxRetries})...`);
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new StripeWebhookService();
