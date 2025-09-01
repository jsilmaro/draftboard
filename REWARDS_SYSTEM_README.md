# 🎉 Reward + Payment System

A complete **React.js frontend + Express backend** implementation with **Stripe integration** for handling brand funding, creator onboarding, and reward distribution.

## 🚀 Features

### 💰 **Brand Funding**
- Stripe Checkout integration for brief funding
- Secure payment processing
- Webhook handling for payment confirmation

### 👥 **Creator Onboarding**
- Stripe Connect Express accounts
- Automated onboarding flow
- Account status tracking

### 🏆 **Reward Distribution**
- **Cash Rewards**: Direct Stripe transfers to creator accounts
- **Credit Rewards**: In-app credit balance system
- **Prize Rewards**: Non-cash rewards with detailed tracking

### 📊 **Dashboard & Management**
- Creator rewards dashboard
- Winner selection interface
- Credit redemption system

## 🛠️ Tech Stack

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Payments**: Stripe (Checkout + Connect)
- **Database**: MySQL/PostgreSQL
- **Authentication**: JWT (optional)

## 📁 Project Structure

```
├── server/
│   ├── stripe.js          # Stripe integration & webhooks
│   ├── rewards.js         # Reward distribution system
│   └── integration.js     # Main server setup
├── src/components/
│   ├── StripeCheckout.tsx           # Brand funding checkout
│   ├── StripeConnectOnboarding.tsx  # Creator onboarding
│   ├── CreatorRewardsDashboard.tsx  # Rewards management
│   └── WinnerSelectionModal.tsx     # Winner selection UI
├── database/
│   └── schema.sql         # Complete database schema
└── package-rewards.json   # Dependencies
```

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
# Backend dependencies
npm install express cors stripe dotenv mysql2 sequelize

# Frontend dependencies (in your React app)
npm install @stripe/stripe-js
```

### 2. **Environment Setup**

Create a `.env` file:

```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database
DB_HOST=localhost
DB_NAME=draftboard_rewards
DB_USER=your_user
DB_PASSWORD=your_password
```

### 3. **Database Setup**

```bash
# Create database
mysql -u root -p
CREATE DATABASE draftboard_rewards;

# Run schema
mysql -u root -p draftboard_rewards < database/schema.sql
```

### 4. **Stripe Configuration**

1. **Create Stripe Account**: [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Set up Webhooks**: Dashboard → Developers → Webhooks
   - Endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `account.updated`, `transfer.created`

### 5. **Start Development**

```bash
# Backend
node server/integration.js

# Frontend (in your React app)
npm start
```

## 💳 Stripe Integration Details

### **Brand Funding Flow**
1. Brand clicks "Fund Brief" button
2. Frontend calls `/api/stripe/create-checkout-session`
3. Redirects to Stripe Checkout
4. Webhook confirms payment
5. Brief marked as funded

### **Creator Onboarding Flow**
1. Creator clicks "Connect Stripe Account"
2. Frontend calls `/api/stripe/create-connect-account`
3. Redirects to Stripe Connect onboarding
4. Webhook updates account status
5. Creator can receive cash rewards

### **Reward Distribution Flow**
1. Brand selects winners via `WinnerSelectionModal`
2. Frontend calls `/api/rewards/distribute`
3. Backend processes each reward type:
   - **Cash**: Stripe transfer to creator account
   - **Credit**: Updates database balance
   - **Prize**: Logs in database
4. Results returned to frontend

## 🎯 API Endpoints

### **Stripe Endpoints**
- `POST /api/stripe/create-checkout-session` - Create funding session
- `POST /api/stripe/create-connect-account` - Create creator account
- `GET /api/stripe/connect-account/:id` - Get account status
- `POST /api/stripe/webhook` - Handle webhooks

### **Rewards Endpoints**
- `POST /api/rewards/distribute` - Distribute rewards
- `GET /api/rewards/creator/:id/history` - Get reward history
- `GET /api/rewards/creator/:id/credits` - Get credit balance
- `POST /api/rewards/redeem-credits` - Redeem credits

## 🎨 React Components Usage

### **StripeCheckout Component**
```tsx
import StripeCheckout from './components/StripeCheckout';

<StripeCheckout
  briefId="brief-123"
  amount={100.00}
  brandId="brand-456"
  briefTitle="Social Media Campaign"
  onSuccess={() => console.log('Payment successful!')}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

### **StripeConnectOnboarding Component**
```tsx
import StripeConnectOnboarding from './components/StripeConnectOnboarding';

<StripeConnectOnboarding
  creatorId="creator-789"
  creatorEmail="creator@example.com"
  creatorName="John Doe"
  onSuccess={(accountId) => console.log('Account created:', accountId)}
  onError={(error) => console.error('Onboarding failed:', error)}
/>
```

### **CreatorRewardsDashboard Component**
```tsx
import CreatorRewardsDashboard from './components/CreatorRewardsDashboard';

<CreatorRewardsDashboard creatorId="creator-789" />
```

### **WinnerSelectionModal Component**
```tsx
import WinnerSelectionModal from './components/WinnerSelectionModal';

<WinnerSelectionModal
  briefId="brief-123"
  submissions={submissions}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(results) => console.log('Rewards distributed:', results)}
/>
```

## 🔒 Security Features

- **Webhook Signature Verification**: All Stripe webhooks verified
- **Input Validation**: All API inputs validated
- **Error Handling**: Comprehensive error handling
- **Rate Limiting**: Built-in rate limiting (add to your server)
- **CORS Configuration**: Proper CORS setup

## 📊 Database Schema

The system includes a complete database schema with:

- **creators**: Creator accounts with Stripe integration
- **brands**: Brand accounts
- **briefs**: Funded briefs with payment tracking
- **submissions**: Creator submissions to briefs
- **rewards**: All reward distributions
- **stripe_webhook_events**: Webhook event tracking

## 🧪 Testing

```bash
# Run tests
npm test

# Test Stripe integration (use test keys)
npm run test:stripe

# Test reward distribution
npm run test:rewards
```

## 🚀 Production Deployment

### **Environment Variables**
```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
DB_HOST=your_production_db_host
```

### **Webhook Configuration**
- Update webhook endpoint to production URL
- Use live Stripe keys
- Test webhook delivery

### **Database**
- Use production database
- Run migrations
- Set up backups

## 🎉 Features Included

✅ **Complete Stripe Integration**
- Checkout sessions for brand funding
- Connect accounts for creator onboarding
- Transfer API for cash rewards
- Webhook handling for all events

✅ **Three Reward Types**
- Cash rewards via Stripe transfers
- Credit rewards with in-app balance
- Prize rewards with detailed tracking

✅ **React Components**
- Ready-to-use UI components
- TypeScript support
- Responsive design
- Error handling

✅ **Backend API**
- RESTful API design
- Comprehensive error handling
- Database integration ready
- Webhook processing

✅ **Database Schema**
- Complete MySQL/PostgreSQL schema
- Optimized indexes
- Stored procedures
- Views for common queries

## 📞 Support

For questions or issues:
1. Check the Stripe documentation
2. Review the webhook logs
3. Test with Stripe test keys first
4. Check database connections

## 🔄 Next Steps

1. **Integrate with your existing app**
2. **Customize the UI components**
3. **Add authentication/authorization**
4. **Set up monitoring and logging**
5. **Deploy to production**

---

**🎊 You now have a complete reward + payment system ready for production!**

