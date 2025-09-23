const express = require('express');
const router = express.Router();
const stripeWebhookService = require('../services/stripeWebhookService');

// Initialize Stripe only if API key is available
let stripe = null;
const stripeKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
  stripe = require('stripe')(stripeKey);
} else {
  console.log('⚠️ STRIPE_SECRET_KEY not found, webhook will run in mock mode');
}

/**
 * Production-Ready Stripe Webhook Endpoint
 * Handles all Stripe events with proper signature verification and error handling
 */

// Main webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const startTime = Date.now();
  let event;

  try {
    // If Stripe is not configured, return mock response for development
    if (!stripe) {
      console.log('🔔 Mock webhook received (Stripe not configured)');
      return res.json({ 
        received: true, 
        mock: true,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }

    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ 
        error: 'Webhook secret not configured',
        timestamp: new Date().toISOString()
      });
    }

    if (!sig) {
      console.error('❌ No Stripe signature found in headers');
      return res.status(400).json({ 
        error: 'No Stripe signature provided',
        timestamp: new Date().toISOString()
      });
    }

    // Construct event from request body and signature
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({ 
        error: `Webhook signature verification failed: ${err.message}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📨 Verified Stripe webhook: ${event.type} (ID: ${event.id})`);

    // Process the webhook event
    const result = await stripeWebhookService.processWebhookEvent(event);

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Webhook processed successfully: ${event.type} (${processingTime}ms)`);

    res.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      success: result.success,
      message: result.message,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`❌ Webhook processing failed: ${event?.type || 'unknown'} (${processingTime}ms)`, error);

    // Return appropriate error response
    const statusCode = error.name === 'PrismaClientKnownRequestError' ? 500 : 400;
    
    res.status(statusCode).json({
      error: 'Webhook processing failed',
      eventId: event?.id || 'unknown',
      eventType: event?.type || 'unknown',
      message: error.message,
      processingTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test webhook endpoint for development/testing
 * Allows manual testing of webhook events
 */
router.post('/stripe/test', async (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Create mock event for testing
    const mockEvent = {
      id: `evt_test_${Date.now()}`,
      type: eventType,
      data: {
        object: eventData || {}
      },
      created: Math.floor(Date.now() / 1000)
    };

    console.log(`🧪 Processing test webhook: ${eventType}`);

    const result = await stripeWebhookService.processWebhookEvent(mockEvent);

    res.json({
      success: true,
      message: 'Test webhook processed',
      eventType,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test webhook failed:', error);
    res.status(500).json({
      error: 'Test webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Webhook health check endpoint
 */
router.get('/stripe/health', (req, res) => {
  const isConfigured = !!(stripeKey && process.env.STRIPE_WEBHOOK_SECRET);
  
  res.json({
    status: 'healthy',
    configured: isConfigured,
    stripeKey: !!stripeKey,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supportedEvents: stripeWebhookService.supportedEvents,
    timestamp: new Date().toISOString()
  });
});

/**
 * Webhook event history endpoint (for debugging)
 */
router.get('/stripe/events', async (req, res) => {
  try {
    // This would typically query a webhook events log table
    // For now, we'll return a simple response
    res.json({
      message: 'Webhook events endpoint - implement logging table for full functionality',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({
      error: 'Failed to fetch webhook events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
