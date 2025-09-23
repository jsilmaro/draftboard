# Stripe Connect Implementation Guide

## Overview

This implementation provides a clean, production-ready Stripe Connect flow for your creator-brand collaboration platform. It replaces the chaotic payment system with a structured approach using Stripe Connect Express accounts.

## Business Logic Flow

1. **Brands create briefs** with winner spots and budget
2. **Brands fund briefs upfront** using Stripe Checkout
3. **Funds are held in platform balance** with optional service fees
4. **Creators onboard to Stripe Connect** Express accounts
5. **Winners are selected** and funds are transferred to creators
6. **Unused funds are refunded** to brands when briefs expire

## Database Schema

### New Models Added

```prisma
model StripeConnectAccount {
  id                String   @id @default(cuid())
  creatorId         String   @unique
  stripeAccountId   String   @unique
  status            String   @default("pending")
  chargesEnabled    Boolean  @default(false)
  payoutsEnabled    Boolean  @default(false)
  detailsSubmitted  Boolean  @default(false)
  requirements      Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  creator           Creator  @relation(fields: [creatorId], references: [id])
}

model BriefFunding {
  id                        String    @id @default(cuid())
  briefId                   String    @unique
  brandId                   String
  totalAmount               Decimal   @db.Decimal(10, 2)
  platformFee               Decimal   @default(0) @db.Decimal(10, 2)
  netAmount                 Decimal   @db.Decimal(10, 2)
  stripePaymentIntentId     String?
  stripeCheckoutSessionId   String?
  status                    String    @default("pending")
  fundedAt                  DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
  brief                     Brief     @relation(fields: [briefId], references: [id])
  brand                     Brand     @relation(fields: [brandId], references: [id])
  payouts                  CreatorPayout[]
  refunds                  BriefRefund[]
}

model CreatorPayout {
  id                    String    @id @default(cuid())
  creatorId             String
  briefId               String
  submissionId          String
  amount                Decimal   @db.Decimal(10, 2)
  platformFee           Decimal   @default(0) @db.Decimal(10, 2)
  netAmount             Decimal   @db.Decimal(10, 2)
  stripeTransferId      String?
  stripeTransferGroupId String?
  status                String    @default("pending")
  paidAt                DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  creator               Creator   @relation(fields: [creatorId], references: [id])
  brief                 Brief     @relation(fields: [briefId], references: [id])
  submission            Submission @relation(fields: [submissionId], references: [id])
  funding               BriefFunding @relation(fields: [briefId], references: [briefId])
}

model BriefRefund {
  id              String    @id @default(cuid())
  briefId         String
  brandId         String
  amount          Decimal   @db.Decimal(10, 2)
  stripeRefundId  String?
  reason          String?
  status          String    @default("pending")
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  brief           Brief     @relation(fields: [briefId], references: [id])
  brand           Brand     @relation(fields: [brandId], references: [id])
  funding         BriefFunding @relation(fields: [briefId], references: [briefId])
}
```

## API Endpoints

### Creator Onboarding

#### 1. Create Stripe Connect Account
```http
POST /api/creators/onboard
Authorization: Bearer <creator_token>
Content-Type: application/json

{
  "country": "US"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stripe Connect account created successfully",
  "data": {
    "accountId": "acct_1234567890",
    "connectAccountId": "conn_1234567890",
    "status": "pending"
  }
}
```

#### 2. Create Onboarding Link
```http
POST /api/creators/onboard/link
Authorization: Bearer <creator_token>
Content-Type: application/json

{
  "returnUrl": "https://yourapp.com/onboarding/success",
  "refreshUrl": "https://yourapp.com/onboarding/refresh"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account link created successfully",
  "data": {
    "url": "https://connect.stripe.com/setup/c/...",
    "expiresAt": 1640995200
  }
}
```

#### 3. Check Account Status
```http
GET /api/creators/onboard/status
Authorization: Bearer <creator_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboarded": true,
    "status": "active",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "requirements": []
  }
}
```

### Brief Funding

#### 4. Fund Brief
```http
POST /api/briefs/:id/fund
Authorization: Bearer <brand_token>
Content-Type: application/json

{
  "totalAmount": 1000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Funding session created successfully",
  "data": {
    "sessionId": "cs_1234567890",
    "url": "https://checkout.stripe.com/pay/cs_...",
    "fundingId": "fund_1234567890"
  }
}
```

#### 5. Confirm Funding
```http
POST /api/briefs/:id/fund/confirm
Authorization: Bearer <brand_token>
Content-Type: application/json

{
  "sessionId": "cs_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Brief funding confirmed successfully",
  "data": {
    "fundingId": "fund_1234567890",
    "amount": 1000.00,
    "netAmount": 950.00
  }
}
```

### Winner Payouts

#### 6. Create Payouts for Winners
```http
POST /api/briefs/:id/reward
Authorization: Bearer <brand_token>
Content-Type: application/json

{
  "winners": [
    {
      "creatorId": "creator_123",
      "submissionId": "sub_123",
      "amount": 500.00
    },
    {
      "creatorId": "creator_456",
      "submissionId": "sub_456",
      "amount": 300.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payouts created successfully",
  "data": {
    "transferGroupId": "tg_brief123_1640995200",
    "results": [
      {
        "success": true,
        "payoutId": "payout_123",
        "transferId": "tr_1234567890",
        "amount": 475.00,
        "creatorId": "creator_123"
      },
      {
        "success": true,
        "payoutId": "payout_456",
        "transferId": "tr_0987654321",
        "amount": 285.00,
        "creatorId": "creator_456"
      }
    ]
  }
}
```

### Refunds

#### 7. Process Refund for Unused Funds
```http
POST /api/briefs/:id/refund
Authorization: Bearer <brand_token>
Content-Type: application/json

{
  "reason": "Brief expired with unused funds"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refundId": "refund_1234567890",
    "amount": 200.00,
    "stripeRefundId": "re_1234567890"
  }
}
```

### Utility Endpoints

#### 8. Get Brief Funding Status
```http
GET /api/briefs/:id/funding/status
Authorization: Bearer <token>
```

#### 9. Get Creator Payouts
```http
GET /api/creators/payouts
Authorization: Bearer <creator_token>
```

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=5
MINIMUM_PLATFORM_FEE=0.50
FRONTEND_URL=https://yourapp.com
```

## Webhook Configuration

### Required Stripe Events

Configure these webhook events in your Stripe Dashboard:

- `account.updated` - Updates Connect account status
- `checkout.session.completed` - Processes successful payments
- `payment_intent.succeeded` - Backup payment confirmation
- `transfer.created` - Updates payout status
- `transfer.updated` - Handles transfer status changes
- `refund.created` - Processes refund confirmations

### Webhook Endpoint

```
POST /api/stripe/webhook
```

## Implementation Steps

### 1. Database Migration

Run the migration to add the new tables:

```bash
npx prisma migrate dev --name add_stripe_connect_models
```

### 2. Update Your Frontend

#### Creator Onboarding Flow

```javascript
// 1. Create Connect account
const createAccount = async () => {
  const response = await fetch('/api/creators/onboard', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ country: 'US' })
  });
  return response.json();
};

// 2. Create onboarding link
const createOnboardingLink = async () => {
  const response = await fetch('/api/creators/onboard/link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      returnUrl: `${window.location.origin}/onboarding/success`,
      refreshUrl: `${window.location.origin}/onboarding/refresh`
    })
  });
  const data = await response.json();
  window.location.href = data.data.url;
};

// 3. Check status
const checkAccountStatus = async () => {
  const response = await fetch('/api/creators/onboard/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

#### Brand Funding Flow

```javascript
// Fund a brief
const fundBrief = async (briefId, amount) => {
  const response = await fetch(`/api/briefs/${briefId}/fund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ totalAmount: amount })
  });
  const data = await response.json();
  window.location.href = data.data.url; // Redirect to Stripe Checkout
};

// Confirm funding (call after successful checkout)
const confirmFunding = async (briefId, sessionId) => {
  const response = await fetch(`/api/briefs/${briefId}/fund/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId })
  });
  return response.json();
};
```

#### Winner Selection Flow

```javascript
// Create payouts for winners
const createPayouts = async (briefId, winners) => {
  const response = await fetch(`/api/briefs/${briefId}/reward`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ winners })
  });
  return response.json();
};
```

### 3. Connect to Existing Stripe Account

To connect your existing Stripe account:

1. **Get your Stripe keys** from your Stripe Dashboard
2. **Set up webhooks** pointing to your server
3. **Configure Connect settings** in your Stripe Dashboard:
   - Go to Connect → Settings
   - Enable Express accounts
   - Set up your branding
   - Configure payout schedules

### 4. Testing

#### Test Mode
- Use Stripe test keys (`sk_test_...`, `pk_test_...`)
- Test with Stripe test cards
- Use test webhook endpoints

#### Production Mode
- Use live keys (`sk_live_...`, `pk_live_...`)
- Set up production webhooks
- Test with small amounts first

## Key Features

### ✅ **Clean Architecture**
- Modular service layer
- Proper error handling
- Database transactions
- Webhook processing

### ✅ **Security**
- JWT authentication
- Webhook signature verification
- Input validation
- Access control

### ✅ **Scalability**
- Efficient database queries
- Proper indexing
- Webhook queuing
- Error recovery

### ✅ **Monitoring**
- Comprehensive logging
- Status tracking
- Notification system
- Audit trails

## Migration from Old System

1. **Backup existing data**
2. **Run database migration**
3. **Update API calls** in frontend
4. **Test thoroughly** in staging
5. **Deploy gradually** with feature flags

## Support

For issues or questions:
- Check Stripe documentation
- Review webhook logs
- Monitor database transactions
- Use Stripe Dashboard for debugging

This implementation provides a production-ready, scalable payment system that follows Stripe's best practices and your business requirements.

