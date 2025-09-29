# Stripe Test Implementation Setup Guide

This guide will help you set up and test Stripe integration in your React app.

## 🚀 Quick Start

1. **Get your Stripe test keys** from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. **Set up environment variables** (see below)
3. **Start your servers** and visit `/stripe-test`

## 🔧 Environment Setup

Create a `.env` file in your project root with the following variables:

```env
# Stripe Test Configuration
VITE_STRIPE_MODE=test
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51...
VITE_STRIPE_SECRET_KEY_TEST=sk_test_51...
VITE_STRIPE_CONNECT_CLIENT_ID_TEST=ca_...
VITE_STRIPE_WEBHOOK_SECRET_TEST=whsec_...

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing Features

### 1. Payment Elements Test
- **Route**: `/stripe-test` → Payment Elements tab
- **Features**: 
  - Real-time card validation
  - Test different card scenarios
  - Custom amount input

### 2. Checkout Sessions Test
- **Route**: `/stripe-test` → Checkout Sessions tab
- **Features**:
  - Stripe-hosted checkout pages
  - Multiple payment methods
  - Success/cancel redirects

### 3. Connect Accounts Test
- **Route**: `/stripe-test` → Connect Accounts tab
- **Features**:
  - Create test Connect accounts
  - Account status verification

## 💳 Test Card Numbers

| Card Number | Scenario | Description |
|-------------|----------|-------------|
| `4242 4242 4242 4242` | ✅ Success | Payment succeeds immediately |
| `4000 0025 0000 3155` | 🔐 Authentication | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | ❌ Declined | Always declined with insufficient funds |
| `4000 0000 0000 3220` | 🔐 3D Secure | Requires 3D Secure 2 authentication |

**Test Details:**
- Use any future expiry date
- Use any 3-digit CVC
- Use any postal code

## 🔧 Backend Endpoints

### Test Endpoints (No Authentication Required)
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/test-checkout-session` - Create test checkout session

### Production Endpoints (Authentication Required)
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/transfer` - Transfer funds to creators
- `GET /api/stripe/account/:creatorId` - Get Connect account details

## 🚀 Running the Tests

1. **Start the backend server:**
   ```bash
   npm run server
   ```

2. **Start the frontend:**
   ```bash
   npm run client
   ```

3. **Visit the test page:**
   ```
   http://localhost:3000/stripe-test
   ```

## 🔍 Troubleshooting

### Common Issues

1. **"Stripe not initialized" error**
   - Check your `VITE_STRIPE_PUBLISHABLE_KEY_TEST` is set correctly
   - Ensure the key starts with `pk_test_`

2. **"Failed to create payment intent" error**
   - Check your `STRIPE_SECRET_KEY_TEST` is set correctly
   - Ensure the key starts with `sk_test_`

3. **CORS errors**
   - Make sure your backend is running on port 3001
   - Check that your frontend is making requests to the correct API endpoints

### Configuration Validation

The test page includes a configuration status section that will show:
- ✅ Valid configuration with all required keys
- ❌ Invalid configuration with specific error messages

## 📚 Additional Resources

- [Stripe Documentation](https://docs.stripe.com/)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Elements Guide](https://stripe.com/docs/payments/elements)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)

## 🔄 Next Steps

Once testing is complete:

1. **Set up webhooks** for production
2. **Configure live keys** for production
3. **Implement proper error handling**
4. **Add logging and monitoring**
5. **Set up Stripe Connect for creators**

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for backend errors
3. Verify your Stripe keys are correct
4. Ensure all environment variables are set

