# Stripe Connect Implementation Flow

## Overview

This document outlines the complete Stripe Connect (Standard/Express) integration for our platform, implementing a secure and scalable payment flow from Brand funding to Creator payouts.

## High-Level Flow Diagram

```
Brand → Platform → Creator → Bank
  ↓        ↓        ↓       ↓
Create   Hold     Transfer  Payout
Brief    Funds    Rewards   to Bank
  ↓        ↓        ↓       ↓
Fund     Webhook   Webhook  Webhook
Brief    Updates   Updates  Updates
```

## Detailed Flow Process

### 1. Brand Funding Phase

#### 1.1 Create Funding Brief
- **Frontend**: Brand creates a brief with reward amount
- **Component**: `CreateBrief.tsx` (integrated into Brief Management)
- **API**: `POST /api/briefs` (existing)
- **Flow**: Integrated modal within Brief Management page for seamless experience

#### 1.2 Fund Brief Checkout
- **Frontend**: Brand clicks "Fund Brief" button
- **Component**: `BriefFundingModal.tsx`
- **API**: `POST /api/stripe/create-checkout-session`
- **Process**:
  1. Creates Stripe Checkout Session
  2. Stores funding record in `briefFunding` table
  3. Redirects to Stripe Checkout

#### 1.3 Payment Processing
- **Stripe**: Processes payment via Checkout
- **Webhook**: `checkout.session.completed` event
- **Service**: `StripeWebhookService.handleCheckoutSessionCompleted()`
- **Database**: Updates `brief.isFunded = true`, `brief.fundedAt`

### 2. Winner Selection Phase

#### 2.1 View and Manage Briefs
- **Frontend**: Brand navigates to "Brief Management" tab
- **Component**: `BriefManagementPage.tsx`
- **Features**:
  - View all briefs (funded and unfunded)
  - Fund unfunded briefs directly
  - Select winners for funded briefs
  - Filter by funding status

#### 2.2 Select Winners
- **Frontend**: Brand selects winning submissions
- **Component**: `WinnerSelectionFlow.tsx`
- **Features**:
  - Configure reward amount per winner
  - Calculate platform fees (5%)
  - Transfer individual or bulk rewards

#### 2.3 Transfer Funds
- **API**: `POST /api/stripe/transfer`
- **Process**:
  1. Creates Stripe transfer to Creator's connected account
  2. Stores payout record in `creatorPayout` table
  3. Updates submission status to "winner"
  4. Creates notification for Creator

### 3. Creator Wallet Phase

#### 3.1 Connect Stripe Account
- **Frontend**: Creator connects via Stripe Connect
- **Component**: `StripeConnectButton.tsx`
- **API**: `POST /api/stripe/connect/onboard`

#### 3.2 View Wallet Status
- **Frontend**: Creator views wallet dashboard
- **Component**: `CreatorWallet.tsx`
- **Features**:
  - Account status (active/pending/restricted)
  - Transfer history
  - Payout status

### 4. Payout Phase

#### 4.1 Automatic Payouts
- **Stripe**: Handles automatic payouts to Creator's bank
- **Webhook**: `payout.paid` event
- **Service**: `StripeWebhookService.handlePayoutPaid()`
- **Database**: Updates `creatorPayout.status = 'paid'`

## API Endpoints

### Stripe Integration Endpoints

#### Create Checkout Session
```
POST /api/stripe/create-checkout-session
```
**Purpose**: Create Stripe Checkout session for brief funding
**Body**:
```json
{
  "briefId": "string",
  "amount": "number",
  "successUrl": "string",
  "cancelUrl": "string"
}
```

#### Transfer Funds
```
POST /api/stripe/transfer
```
**Purpose**: Transfer funds to Creator's connected account
**Body**:
```json
{
  "submissionId": "string",
  "amount": "number",
  "description": "string"
}
```

#### Get Account Details
```
GET /api/stripe/account/:creatorId
```
**Purpose**: Fetch Creator's Stripe Connect account status
**Response**:
```json
{
  "accountId": "string",
  "status": "active|pending|restricted",
  "chargesEnabled": "boolean",
  "payoutsEnabled": "boolean",
  "requirements": "object",
  "country": "string",
  "default_currency": "string"
}
```

#### Get Funded Briefs
```
GET /api/stripe/funded-briefs
```
**Purpose**: Get all funded briefs for brand
**Response**: Array of funded briefs with submissions

#### Get Creator Payouts
```
GET /api/stripe/payouts/:creatorId
```
**Purpose**: Get payout history for creator
**Response**: Array of payout records

### Webhook Endpoints

#### Stripe Webhooks
```
POST /api/webhooks/stripe
```
**Purpose**: Handle all Stripe webhook events
**Events Handled**:
- `checkout.session.completed` - Mark brief as funded
- `payment_intent.succeeded` - Confirm payment
- `account.updated` - Update Creator account status
- `transfer.created` - Track fund transfers
- `payout.paid` - Confirm Creator payouts
- `refund.created` - Handle refunds

## Database Schema

### Key Tables

#### BriefFunding
```sql
model BriefFunding {
  id                     String   @id @default(cuid())
  briefId                String
  brandId                String
  amount                 Decimal  @db.Decimal(10, 2)
  totalAmount            Decimal  @db.Decimal(10, 2)
  platformFee            Decimal  @db.Decimal(10, 2)
  status                 String   @default("pending")
  stripeCheckoutSessionId String?
  stripePaymentIntentId  String?
  fundedAt               DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

#### CreatorPayout
```sql
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
}
```

#### Brief (Updated)
```sql
model Brief {
  // ... existing fields
  isFunded              Boolean   @default(false)
  fundedAt              DateTime?
}
```

## Frontend Components

### Brand Components

#### BriefFundingModal
- **Purpose**: Handle brief funding checkout
- **Features**: Amount input, fee calculation, Stripe Checkout redirect
- **API**: `POST /api/stripe/create-checkout-session`

#### BriefManagementPage
- **Purpose**: Complete brief management with funding and winner selection
- **Features**: 
  - View all briefs with filtering (All/Funded/Unfunded)
  - Create new briefs via integrated modal
  - Fund unfunded briefs with integrated Stripe checkout
  - Select winners for funded briefs
  - Brief cards with submission previews
  - Status indicators and action buttons
  - Seamless workflow from creation to funding to winner selection
- **API**: `GET /api/brands/briefs` for all briefs

#### WinnerSelectionFlow
- **Purpose**: Select winners and transfer rewards
- **Features**: 
  - Multi-select submissions
  - Reward amount configuration
  - Individual/bulk transfers
  - Real-time status updates
- **API**: `POST /api/stripe/transfer`

### Creator Components

#### CreatorWallet
- **Purpose**: Display wallet status and transaction history
- **Features**:
  - Stripe account status
  - Transfer history
  - Payout status
  - Account requirements
- **API**: `GET /api/stripe/account/:creatorId`

## Testing Instructions

### Test Mode Setup

1. **Environment Variables**:
   ```env
   STRIPE_SECRET_KEY_TEST=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=development
   ```

2. **Test Cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Testing Flow

#### 1. Test Brief Funding
1. Create a brief as Brand
2. Click "Fund Brief" button
3. Use test card `4242 4242 4242 4242`
4. Verify webhook updates `isFunded = true`

#### 2. Test Winner Selection
1. Navigate to "Funded Briefs" tab
2. Select winning submissions
3. Configure reward amount
4. Transfer funds
5. Verify Creator receives notification

#### 3. Test Creator Wallet
1. Connect Creator to Stripe (test mode)
2. Verify account status display
3. Check transfer history after winning

### Webhook Testing

#### Using Stripe CLI
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payout.paid
```

#### Using Test Endpoint
```bash
# Test webhook processing (development only)
curl -X POST http://localhost:3001/api/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "id": "cs_test_123",
      "metadata": {
        "type": "brief_funding",
        "briefId": "brief_id",
        "brandId": "brand_id"
      }
    }
  }'
```

## Production Deployment

### Environment Setup
1. **Stripe Keys**: Use live keys in production
2. **Webhook Endpoint**: Register production webhook URL
3. **Database**: Ensure all migrations are applied
4. **SSL**: Ensure HTTPS for webhook endpoints

### Webhook Registration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `account.updated`
   - `transfer.created`
   - `payout.paid`
   - `refund.created`
4. Copy webhook secret to environment variables

### Monitoring
- Monitor webhook delivery in Stripe Dashboard
- Set up alerts for failed webhooks
- Track payout status and Creator account restrictions
- Monitor platform fee collection

## Security Considerations

### Webhook Security
- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Implement idempotency for webhook processing
- Use retry logic for failed operations

### Data Protection
- Store minimal payment data (use Stripe for sensitive info)
- Encrypt webhook payloads in transit
- Implement proper access controls for payout data

### Error Handling
- Graceful handling of failed transfers
- Proper error logging and monitoring
- User-friendly error messages

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
- Check webhook endpoint URL is correct
- Verify webhook secret in environment variables
- Check Stripe Dashboard for delivery failures

#### Creator Account Restrictions
- Check account requirements in Stripe Dashboard
- Guide Creator through additional verification
- Monitor account status via API

#### Transfer Failures
- Verify Creator has connected Stripe account
- Check account status (charges_enabled, payouts_enabled)
- Review transfer amount limits

### Debug Tools
- Stripe Dashboard logs
- Webhook endpoint health check: `GET /api/webhooks/stripe/health`
- Test webhook endpoint: `POST /api/webhooks/stripe/test`

## Future Enhancements

### Planned Features
1. **Automated Winner Selection**: AI-powered submission evaluation
2. **Escrow System**: Hold funds until deliverables are submitted
3. **Multi-Currency Support**: Support for international payments
4. **Advanced Analytics**: Detailed payout and revenue analytics
5. **Mobile App**: Native mobile app for Creators

### Scalability Considerations
- Implement queue system for high-volume transfers
- Add caching for frequently accessed data
- Optimize database queries for large datasets
- Consider microservices architecture for payment processing

---

## Quick Start Checklist

- [ ] Set up Stripe test/live keys
- [ ] Configure webhook endpoints
- [ ] Run database migrations
- [ ] Test brief funding flow
- [ ] Test winner selection
- [ ] Test Creator wallet
- [ ] Verify webhook processing
- [ ] Deploy to production
- [ ] Register production webhooks
- [ ] Monitor payment flows

For support or questions, refer to the Stripe Connect documentation or contact the development team.
