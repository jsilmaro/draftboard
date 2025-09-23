// This file contains the old payment endpoints that have been removed
// and replaced with Stripe Connect functionality

// REMOVED ENDPOINTS:
// - /api/brands/payments/process (replaced with /api/briefs/:id/reward)
// - /api/payments/create-winner-payment-intent (replaced with Stripe Connect)
// - /api/payments/process-wallet-payment (replaced with Stripe Connect)
// - /api/brands/payment-methods (replaced with Stripe Checkout)
// - /api/brands/bulk-payment (replaced with /api/briefs/:id/reward)
// - /api/payments/process-reward (replaced with Stripe Connect)
// - /api/payments/:paymentId/status (replaced with Stripe Connect status)

// NEW STRIPE CONNECT ENDPOINTS:
// - POST /api/creators/onboard - Create Stripe Connect account
// - POST /api/creators/onboard/link - Get onboarding URL
// - GET /api/creators/onboard/status - Check account status
// - POST /api/briefs/:id/fund - Fund brief with Stripe Checkout
// - POST /api/briefs/:id/reward - Pay winners via Stripe Connect
// - POST /api/briefs/:id/refund - Refund unused funds
// - GET /api/briefs/:id/funding/status - Check funding status
// - GET /api/creators/payouts - Get creator payout history

// This cleanup ensures:
// 1. Old reward/payment system is completely removed
// 2. Only Stripe Connect functionality remains
// 3. All endpoints follow RESTful conventions
// 4. Real-time status updates via webhooks
// 5. Proper error handling and validation


