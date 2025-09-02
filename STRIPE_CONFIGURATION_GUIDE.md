# 🚀 Stripe Integration Configuration Guide

## Overview
This system supports both **Mock Stripe** (for development/testing) and **Live Stripe** (for production) implementations. You can easily switch between them using environment variables.

## 🔧 Configuration

### 1. Environment Variables

Create a `.env` file in your project root with these variables:

```bash
# Stripe Mode (mock | live)
VITE_STRIPE_MODE=mock

# Live Stripe Configuration (only needed when MODE=live)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_test_secret_here
VITE_STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Mode Switching

#### Mock Mode (Default)
```bash
REACT_APP_STRIPE_MODE=mock
```
- ✅ **No Stripe account needed**
- ✅ **Instant setup for development**
- ✅ **Simulates all Stripe operations**
- ✅ **Perfect for testing**

#### Live Mode
```bash
REACT_APP_STRIPE_MODE=live
```
- 🌐 **Uses real Stripe Connect**
- 💳 **Real payment processing**
- 🔒 **Secure production environment**
- 📊 **Real analytics and reporting**

## 🧪 Mock Mode Features

### What's Simulated:
- ✅ Stripe Connect account creation
- ✅ Account onboarding flow
- ✅ Payment processing
- ✅ Transfer creation
- ✅ Account status updates
- ✅ Webhook simulation

### Benefits:
- **Fast Development**: No waiting for Stripe setup
- **Cost-Free**: No Stripe fees during development
- **Full Control**: Simulate any scenario
- **Offline Work**: Works without internet

## 🌐 Live Mode Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete business verification

### 2. Get API Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your **Publishable Key** (starts with `pk_`)
3. Copy your **Secret Key** (starts with `sk_`)

### 3. Enable Stripe Connect
1. Go to Stripe Dashboard → Connect
2. Complete Connect onboarding
3. Get your **Connect Client ID** (starts with `ca_`)

### 4. Set Webhook Endpoint
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
3. Copy the **Webhook Secret** (starts with `whsec_`)

## 🔄 Switching Between Modes

### From Mock to Live:
1. Update `.env` file:
   ```bash
   VITE_STRIPE_MODE=live
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_CONNECT_CLIENT_ID=ca_...
   VITE_STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. Restart your application

### From Live to Mock:
1. Update `.env` file:
   ```bash
   VITE_STRIPE_MODE=mock
   ```

2. Restart your application

## 📁 File Structure

```
src/
├── config/
│   └── stripe.ts              # Stripe configuration
├── services/
│   └── stripeService.ts       # Stripe service layer
└── components/
    └── CreatorStripeOnboarding.tsx  # Onboarding UI
```

## 🚀 Usage Examples

### Creator Onboarding
```typescript
import { stripeService, isStripeLive } from '../services/stripeService';

// Create Connect account
const account = await stripeService.createConnectAccount({
  creatorId: 'user123',
  email: 'creator@example.com',
  name: 'John Doe',
  country: 'US'
});

// Check if using live Stripe
if (isStripeLive()) {
  console.log('Using real Stripe Connect');
} else {
  console.log('Using mock Stripe');
}
```

### Payment Processing
```typescript
// Create checkout session
const session = await stripeService.createCheckoutSession({
  briefId: 'brief123',
  amount: 100.00,
  brandId: 'brand456',
  briefTitle: 'Logo Design'
});

// Create transfer to creator
const transfer = await stripeService.createTransfer({
  amount: 95.00, // After platform fee
  currency: 'usd',
  destination: 'acct_creator123',
  description: 'Payment for Logo Design'
});
```

## 🔒 Security Considerations

### Mock Mode:
- ✅ Safe for development
- ✅ No real money involved
- ✅ No external API calls

### Live Mode:
- 🔒 **Never expose secret keys in frontend**
- 🔒 **Use environment variables**
- 🔒 **Implement proper authentication**
- 🔒 **Validate all inputs**
- 🔒 **Use HTTPS in production**

## 🐛 Troubleshooting

### Common Issues:

#### 1. "Stripe not initialized"
- Check if `VITE_STRIPE_MODE=live`
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Ensure Stripe.js is loaded

#### 2. "Account creation failed"
- Check backend logs
- Verify API endpoints are working
- Check authentication tokens

#### 3. "Onboarding not completing"
- Check account status in Stripe Dashboard
- Verify webhook endpoints
- Check for error logs

### Debug Mode:
```typescript
// Enable debug logging
console.log('Stripe Config:', STRIPE_CONFIG);
console.log('Service Mode:', isStripeLive() ? 'Live' : 'Mock');
```

## 📚 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Onboarding](https://stripe.com/docs/connect/onboarding)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)

## 🎯 Next Steps

1. **For Development**: Use Mock Mode (default)
2. **For Testing**: Use Mock Mode with simulated scenarios
3. **For Production**: Switch to Live Mode with real Stripe account
4. **For Scaling**: Implement additional Stripe features as needed

---

**Need Help?** Check the console logs and Stripe Dashboard for detailed error information.
