# 🚀 Reward & Payment System Implementation Guide

## 📋 **Overview**

This guide provides step-by-step instructions for implementing the complete Reward and Payment System with Stripe integration for your DraftBoard platform.

---

## 🛠️ **Prerequisites**

### **1. Environment Setup**
Ensure your `.env` file contains the correct Stripe keys:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/draftboard"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Webhook Secret (Local Development)
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Environment
NODE_ENV="development"
PORT=3000
```

### **2. Database Migration**
Run the database migration to add the new RewardPool model:

```bash
npx prisma migrate dev --name add-reward-pool
npx prisma generate
```

---

## 🔧 **Backend Implementation**

### **1. File Structure**
```
server/
├── routes/
│   ├── payments.js      # Payment processing routes
│   └── rewards.js       # Reward management routes
├── middleware/
│   └── auth.js          # Authentication middleware
└── index.js             # Main server file (updated)
```

### **2. Key Features Implemented**

#### **Payment System**
- ✅ Wallet funding with Stripe
- ✅ Payment intent creation
- ✅ Payment confirmation
- ✅ Wallet balance management
- ✅ Transaction history
- ✅ Creator payout requests
- ✅ Stripe webhook handling

#### **Reward System**
- ✅ Reward pool creation
- ✅ Reward distribution
- ✅ Winner selection
- ✅ Analytics dashboard
- ✅ Pool status tracking

---

## 🎨 **Frontend Implementation**

### **1. Components Created**
```
src/components/
├── PaymentManagement.tsx    # Wallet & payment management
└── RewardManagement.tsx     # Reward pool management
```

### **2. Key Features**

#### **PaymentManagement Component**
- ✅ Real-time wallet balance display
- ✅ Fund wallet with Stripe Elements
- ✅ Transaction history
- ✅ Payout request form
- ✅ Responsive design

#### **RewardManagement Component**
- ✅ Analytics dashboard
- ✅ Create reward pools
- ✅ Distribute rewards
- ✅ Winner selection interface
- ✅ Pool status tracking

---

## 🚀 **Getting Started**

### **1. Start the Development Server**
```bash
npm run dev
```

### **2. Test Stripe Integration**
```bash
# Test Stripe connection
stripe balance retrieve

# Test webhook events
stripe trigger payment_intent.succeeded
```

### **3. Test Payment Flow**
1. **Brand funds wallet** → Creates payment intent
2. **Payment confirmation** → Updates wallet balance
3. **Create reward pool** → Deducts from wallet
4. **Distribute rewards** → Credits creator wallets
5. **Creator requests payout** → Stripe transfer

---

## 📊 **API Endpoints**

### **Payment Endpoints**
```
POST /api/payments/create-payment-intent    # Create Stripe payment intent
POST /api/payments/confirm-payment          # Confirm payment & fund wallet
GET  /api/payments/wallet/balance           # Get wallet balance
GET  /api/payments/wallet/transactions      # Get transaction history
POST /api/payments/payout/request           # Request creator payout
POST /api/payments/webhooks/stripe          # Stripe webhook handler
```

### **Reward Endpoints**
```
POST /api/rewards/create-pool               # Create reward pool
POST /api/rewards/distribute                # Distribute rewards
GET  /api/rewards/pool/:briefId             # Get pool status
GET  /api/rewards/brand/pools               # Get brand's pools
GET  /api/rewards/creator/earnings          # Get creator earnings
GET  /api/rewards/analytics/brand           # Get brand analytics
```

---

## 🧪 **Testing Scenarios**

### **1. Brand Payment Flow**
```javascript
// 1. Fund wallet
POST /api/payments/create-payment-intent
{
  "amount": 100,
  "currency": "usd"
}

// 2. Confirm payment
POST /api/payments/confirm-payment
{
  "paymentIntentId": "pi_xxx"
}

// 3. Check balance
GET /api/payments/wallet/balance
```

### **2. Reward Pool Flow**
```javascript
// 1. Create reward pool
POST /api/rewards/create-pool
{
  "briefId": "brief_xxx",
  "amount": 500,
  "paymentMethod": "wallet"
}

// 2. Distribute rewards
POST /api/rewards/distribute
{
  "briefId": "brief_xxx",
  "winners": [
    {
      "creatorId": "creator_xxx",
      "position": 1,
      "amount": 300
    },
    {
      "creatorId": "creator_yyy",
      "position": 2,
      "amount": 200
    }
  ]
}
```

### **3. Creator Payout Flow**
```javascript
// 1. Request payout
POST /api/payments/payout/request
{
  "amount": 50,
  "accountId": "acct_xxx"
}
```

---

## 🔒 **Security Considerations**

### **1. Authentication**
- ✅ JWT token validation
- ✅ User type verification
- ✅ Route protection

### **2. Payment Security**
- ✅ Stripe PCI compliance
- ✅ Webhook signature verification
- ✅ Input validation

### **3. Data Protection**
- ✅ Encrypted sensitive data
- ✅ Secure database connections
- ✅ Audit logging

---

## 📱 **Frontend Integration**

### **1. Add Components to Routes**
```typescript
// In your main App or router
import PaymentManagement from './components/PaymentManagement';
import RewardManagement from './components/RewardManagement';

// Add routes
<Route path="/payments" element={<PaymentManagement userType={userType} userId={userId} token={token} />} />
<Route path="/rewards" element={<RewardManagement userType={userType} userId={userId} token={token} />} />
```

### **2. Navigation Integration**
```typescript
// Add to navigation menu
{userType === 'brand' && (
  <>
    <Link to="/payments">Wallet</Link>
    <Link to="/rewards">Rewards</Link>
  </>
)}

{userType === 'creator' && (
  <Link to="/payments">Earnings</Link>
)}
```

---

## 🚨 **Troubleshooting**

### **1. Common Issues**

#### **Environment Variables Not Set**
```bash
# Check if .env file exists and has correct values
cat .env

# Restart server after changes
npm run dev
```

#### **Database Connection Issues**
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Check database connection
npx prisma studio
```

#### **Stripe Integration Issues**
```bash
# Test Stripe connection
stripe balance retrieve

# Check webhook endpoint
stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe
```

### **2. Error Handling**
- ✅ Payment failures → User notification
- ✅ Network errors → Retry mechanism
- ✅ Validation errors → Clear error messages
- ✅ Database errors → Graceful degradation

---

## 📈 **Monitoring & Analytics**

### **1. Key Metrics**
- Payment success rate
- Average transaction value
- Payout processing time
- Error rates
- Revenue tracking

### **2. Logging**
```javascript
// Payment events
console.log('Payment succeeded:', paymentIntent.id);
console.log('Wallet funded:', amount);

// Reward events
console.log('Reward pool created:', poolId);
console.log('Rewards distributed:', totalAmount);
```

---

## 🔄 **Deployment Checklist**

### **Pre-Production**
- [ ] Stripe test mode configured
- [ ] Webhook endpoints set up
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Payment flows tested

### **Production**
- [ ] Switch to Stripe live mode
- [ ] Update webhook URLs
- [ ] Set production environment variables
- [ ] Monitor payment processing
- [ ] Set up error alerts

---

## 📞 **Support**

### **1. Stripe Support**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

### **2. Development Support**
- Check server logs for errors
- Verify API endpoint responses
- Test with Stripe CLI
- Monitor webhook events

---

## 🎯 **Next Steps**

### **1. Advanced Features**
- Recurring payments
- Subscription models
- Advanced analytics
- Fraud detection

### **2. Optimization**
- Payment caching
- Database optimization
- API rate limiting
- Performance monitoring

---

This implementation provides a complete, production-ready Reward and Payment System with Stripe integration. The system is designed to be scalable, secure, and user-friendly for both brands and creators.

