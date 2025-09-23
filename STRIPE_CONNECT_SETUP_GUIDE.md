# Stripe Connect Setup Guide

## 🚀 **Live Stripe Connect Implementation**

This guide will help you set up Stripe Connect for your creator-brand collaboration platform.

## 📋 **Prerequisites**

### **1. Stripe Account Setup**
- [ ] Create a Stripe account at [stripe.com](https://stripe.com)
- [ ] Complete business verification
- [ ] Enable Stripe Connect in your dashboard

### **2. Stripe Connect Activation**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Connect** → **Settings**
3. Click **"Get started with Connect"**
4. Choose **"Express accounts"** (recommended for creators)
5. Complete the setup process

### **3. Environment Variables**
Make sure your `.env` file has:
```env
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENTAGE=5.0 # Optional platform fee
```

## 🔧 **Database Setup**

### **1. Run Migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

### **2. Verify Tables Created**
- `StripeConnectAccount` - Creator Stripe accounts
- `BriefFunding` - Brief funding records
- `CreatorPayout` - Creator payout records
- `BriefRefund` - Refund records

## 🎯 **API Endpoints**

### **Creator Onboarding**
```bash
# Create Stripe Connect account
POST /api/creators/onboard
{
  "email": "creator@example.com",
  "name": "Creator Name"
}

# Get onboarding link
POST /api/creators/onboard/link
{
  "returnUrl": "https://yoursite.com/creator/wallet?success=true",
  "refreshUrl": "https://yoursite.com/creator/wallet?refresh=true"
}

# Check account status
GET /api/creators/onboard/status
```

### **Brief Funding**
```bash
# Fund a brief
POST /api/briefs/:id/fund
{
  "amount": 1000.00,
  "currency": "usd"
}

# Check funding status
GET /api/briefs/:id/funding/status
```

### **Payouts**
```bash
# Pay winners
POST /api/briefs/:id/reward
{
  "winnerIds": ["submission1", "submission2"]
}

# Get creator payouts
GET /api/creators/payouts
```

### **Refunds**
```bash
# Refund unused funds
POST /api/briefs/:id/refund
{
  "reason": "Brief expired with unused funds"
}
```

## 🔗 **Webhook Setup**

### **1. Create Webhook Endpoint**
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `account.updated`
   - `transfer.succeeded`
   - `charge.refunded`

### **2. Test Webhook**
```bash
# Test webhook locally
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

## 🧪 **Testing**

### **1. Test Mode**
- Use test API keys (`sk_test_...`)
- Create test briefs and submissions
- Test the full flow

### **2. Live Mode**
- Switch to live API keys (`sk_live_...`)
- Real money transactions
- Production webhooks

## 🚨 **Important Notes**

### **Stripe Connect Requirements**
- **Express Accounts**: Best for creators (simplified onboarding)
- **Standard Accounts**: More complex but more control
- **Custom Accounts**: Full control but complex implementation

### **Platform Fees**
- Set in `PLATFORM_FEE_PERCENTAGE` environment variable
- Automatically calculated and deducted
- Visible to creators in payout breakdown

### **Compliance**
- **KYC/AML**: Stripe handles identity verification
- **Tax Reporting**: Stripe provides 1099 forms
- **PCI Compliance**: Stripe is PCI compliant

## 🔄 **User Flow**

### **For Creators:**
1. **Connect Stripe**: Click "Connect Stripe to get paid"
2. **Complete Onboarding**: Fill out Stripe Express form
3. **Submit to Briefs**: Normal submission process
4. **Win Briefs**: Automatic payout to Stripe account
5. **Track Earnings**: View payout history

### **For Brands:**
1. **Create Brief**: Normal brief creation
2. **Fund Brief**: Automatic funding modal appears
3. **Stripe Checkout**: Secure payment processing
4. **Select Winners**: Normal winner selection
5. **Automatic Payouts**: Winners paid automatically

### **For Admins:**
1. **Financial Dashboard**: Real-time metrics
2. **Monitor Transactions**: All funding and payouts
3. **Handle Refunds**: Automatic refund processing
4. **Platform Fees**: Track fee collection

## 🎉 **Benefits**

### **For Creators:**
- ✅ **Direct Payments**: Money goes straight to their account
- ✅ **No Withdrawal Requests**: Automatic processing
- ✅ **Professional Setup**: Industry-standard payment processing
- ✅ **Tax Documents**: Automatic 1099 generation

### **For Brands:**
- ✅ **Secure Payments**: Stripe handles all security
- ✅ **Automatic Processing**: No manual payment handling
- ✅ **Professional Experience**: Industry-standard checkout
- ✅ **Refund Protection**: Automatic refunds for unused funds

### **For Platform:**
- ✅ **Automatic Fees**: Platform fees collected automatically
- ✅ **Reduced Support**: Fewer payment-related issues
- ✅ **Professional Image**: Industry-standard payment processing
- ✅ **Scalable**: Built for growth

## 🚀 **Go Live Checklist**

- [ ] Stripe Connect enabled in dashboard
- [ ] Live API keys configured
- [ ] Webhook endpoint configured
- [ ] Database migrations applied
- [ ] Test with real accounts
- [ ] Monitor webhook events
- [ ] Set up monitoring and alerts

## 📞 **Support**

- **Stripe Documentation**: [stripe.com/docs/connect](https://stripe.com/docs/connect)
- **Stripe Support**: Available in dashboard
- **Platform Support**: Your development team

---

**Ready to go live with Stripe Connect! 🎯**


