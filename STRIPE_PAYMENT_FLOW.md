# 💳 DraftBoard Stripe Payment Flow Documentation

## Overview
This document explains the complete Stripe payment flow in the DraftBoard platform, from checkout to withdrawals, covering Brand, Creator, and Admin interactions.

---

## 🔄 Complete Payment Flow

### **Phase 1: Brief Creation & Funding (Brand Side)**

#### Step 1: Brand Creates Brief
- **Location**: `BrandDashboard` → Create Brief
- **Component**: `CreateBrief.tsx`
- **Action**: Brand creates a brief with reward tiers
- **Database**: Creates `Brief` record with status `draft`

#### Step 2: Brand Funds Brief
- **Location**: `BrandDashboard` → Fund Brief Button
- **Component**: `BriefFundingModal.tsx`
- **Flow**:
  1. Brand clicks "Fund Brief"
  2. Modal opens with Stripe payment form
  3. Brand enters card details
  4. System calculates:
     - **Total Amount**: Sum of all reward tiers
     - **Platform Fee**: 10% of total
     - **Net Amount**: Total - Platform Fee
  5. Creates Stripe Checkout Session via `/api/briefs/:id/fund`
  6. Stripe processes payment
  7. On success:
     - Creates `BriefFunding` record (status: `completed`)
     - Updates `Brief.isFunded = true`
     - Brief becomes visible to creators

**Database Tables Updated:**
- `BriefFunding`: Payment record with Stripe session ID
- `Brief`: isFunded flag set to true

---

### **Phase 2: Creator Submission & Winner Selection (Creator → Brand)**

#### Step 3: Creator Submits to Brief
- **Location**: `CreatorDashboard` → Available Briefs
- **Action**: Creator submits content to funded brief
- **Database**: Creates `Submission` record (status: `pending`)

#### Step 4: Brand Reviews Submissions
- **Location**: `BrandDashboard` → Manage Rewards & Payments → Review Submissions
- **Component**: `ManageRewardsPayments.tsx`
- **Flow**:
  1. Brand reviews submissions
  2. Accepts submissions (status: `approved`) or Rejects (status: `rejected`)
  3. Approved submissions moved to "Shortlist"

**Database Tables Updated:**
- `Submission`: Status changed to `approved` or `rejected`

#### Step 5: Brand Selects Winners
- **Location**: `BrandDashboard` → Manage Rewards & Payments → Select Winners
- **Component**: `WinnerSelectionModal.tsx`
- **Flow**:
  1. Brand selects winners from shortlisted submissions
  2. Assigns positions (1st, 2nd, 3rd place, etc.)
  3. System checks Creator's Stripe Connect status:
     - ✅ **Active**: Ready for instant payment
     - ⚠️ **Pending**: Payment may be delayed
     - ❌ **Not Connected**: Creator must connect Stripe account
  4. Brand distributes rewards (cash, credits, or prizes)

**Database Tables Updated:**
- `Winner`: Records winner selection
- `WinnerReward`: Records reward details

---

### **Phase 3: Reward Distribution (Brand → Creator)**

#### Step 6: Brand Distributes Rewards
- **Location**: `ManageRewardsPayments.tsx` → Distribute Rewards
- **API Endpoint**: `/api/rewards/distribute-with-stripe`
- **Flow**:
  
  **For CASH Rewards:**
  1. System checks Creator's `CreatorStripeAccount` status
  2. If Stripe account active:
     - Creates Stripe Transfer to creator's connected account
     - Amount transferred directly to creator
     - Records in `CreatorPayout` table
     - Updates `CreatorWallet.balance` for tracking
  3. If Stripe account not ready:
     - Holds payment
     - Notifies creator to complete Stripe onboarding
  
  **For CREDIT Rewards:**
  1. Adds credits to `CreatorWallet.balance`
  2. Records in `WalletTransaction`
  3. Creator can use credits for platform features or withdraw later
  
  **For PRIZE Rewards:**
  1. Records prize description in `WinnerReward`
  2. Brand coordinates physical prize delivery externally

**Database Tables Updated:**
- `CreatorPayout`: For cash transfers
- `CreatorWallet`: Balance updated
- `WalletTransaction`: Transaction logged
- `Payment`: Payment status tracked

---

### **Phase 4: Creator Stripe Connect Setup**

#### Creator Connects Stripe Account
- **Location**: `CreatorDashboard` → Wallet
- **Component**: `CreatorWallet.tsx` with `StripeConnectButton.tsx`
- **Flow**:
  1. Creator clicks "Connect Stripe Account"
  2. System calls `/api/creators/onboard`
  3. Creates Stripe Express account
  4. Redirects to Stripe onboarding
  5. Creator completes identity verification
  6. Stripe redirects back to platform
  7. System stores `CreatorStripeAccount` with status

**Stripe Account Statuses:**
- **pending**: Account created, awaiting verification
- **restricted**: Verification incomplete or issues detected
- **active**: Fully verified, ready for payouts

**Database Tables Updated:**
- `CreatorStripeAccount`: Stores Stripe account ID and status

---

### **Phase 5: Creator Wallet & Withdrawals**

#### Step 7: Creator Views Wallet
- **Location**: `CreatorDashboard` → Wallet
- **Component**: `CreatorWallet.tsx`
- **Displays**:
  - Current Balance
  - Total Earned
  - Stripe Account Status
  - Recent Transactions
  - Payout History

**API Endpoints:**
- `/api/creators/wallet/:creatorId`: Get wallet balance
- `/api/stripe/account/:creatorId`: Get Stripe account status

#### Step 8: Creator Requests Withdrawal
- **Location**: `CreatorWallet.tsx` → Request Withdrawal
- **API Endpoint**: `/api/wallet/withdrawal/request`
- **Flow**:
  1. Creator enters withdrawal amount
  2. System validates:
     - Balance sufficient
     - Minimum amount ($10)
     - Stripe account connected
  3. Creates `WithdrawalRequest` (status: `pending`)
  4. Notifies admin for approval
  5. Creator sees pending status

**Database Tables Updated:**
- `WithdrawalRequest`: New withdrawal request

---

### **Phase 6: Admin Approval & Processing**

#### Step 9: Admin Reviews Withdrawals
- **Location**: `AdminDashboard` → Withdrawals
- **Component**: `WithdrawalManagement.tsx`
- **Flow**:
  1. Admin sees all withdrawal requests
  2. Filters by status (pending, approved, rejected)
  3. For each request:
     - **Approve**: Triggers Stripe transfer, updates wallet
     - **Reject**: Denies request, adds reason
  4. System processes approved requests:
     - Creates Stripe Transfer to creator's account
     - Updates `CreatorWallet.balance`
     - Records in `WalletTransaction`
     - Changes status to `approved`
     - Notifies creator

**API Endpoint**: `/api/admin/withdrawal-requests/:id/process`

**Database Tables Updated:**
- `WithdrawalRequest`: Status updated
- `CreatorWallet`: Balance decremented
- `WalletTransaction`: Transaction logged

---

## 📊 Database Tables & Relationships

### Payment-Related Tables:

1. **BriefFunding**
   - Tracks brand payments for brief funding
   - Links: Brief → Brand
   - Stripe Data: checkout_session_id, payment_intent_id

2. **CreatorStripeAccount**
   - Stores creator's Stripe Connect account info
   - Links: Creator
   - Status tracking for payout eligibility

3. **CreatorWallet**
   - Creator's balance from credits and winnings
   - Links: Creator → WalletTransactions

4. **WalletTransaction**
   - All wallet activities (earnings, credits, withdrawals)
   - Links: CreatorWallet

5. **WinnerReward**
   - Reward details for brief winners
   - Links: Brief → Winner
   - Types: cash, credit, prize

6. **CreatorPayout**
   - Cash payout records via Stripe
   - Links: Creator → Brief → Submission
   - Stripe Data: transfer_id

7. **WithdrawalRequest**
   - Creator withdrawal requests awaiting admin approval
   - Links: Creator
   - Status: pending, approved, rejected

8. **Payment**
   - Payment records for winners
   - Links: Winner
   - Stripe Data: payment_intent_id, transfer_id

---

## 🔐 Security & Validation

### Payment Validation:
- ✅ Amount validation (minimum thresholds)
- ✅ Stripe account status verification
- ✅ Balance sufficiency checks
- ✅ Duplicate payment prevention
- ✅ Webhook signature verification

### Access Control:
- ✅ Brand can only fund own briefs
- ✅ Creator can only withdraw own balance
- ✅ Admin approval required for withdrawals
- ✅ JWT token authentication on all endpoints

---

## 🎯 Current Implementation Status

### ✅ Working Features:

1. **Brand Side:**
   - Brief creation with reward tiers
   - Stripe checkout for brief funding
   - Winner selection and reward distribution
   - Real-time funding status display

2. **Creator Side:**
   - Stripe Connect account onboarding
   - Wallet balance tracking
   - Earnings display
   - Withdrawal request submission
   - Payout history viewing

3. **Admin Side:**
   - Withdrawal request management
   - Financial metrics dashboard (real data)
   - Transaction monitoring
   - Payout tracking

### 🎨 Recent Improvements:

1. **UI/UX Enhancements:**
   - Complete dark/light mode support across all payment interfaces
   - Modern sidebar navigation
   - Improved status indicators
   - Better error messages

2. **Data Integrity:**
   - Financial Dashboard now uses 100% real database data
   - Removed all mock data
   - Proper Decimal to Float conversions

3. **Flow Visibility:**
   - Creator Stripe status visible to brands during winner selection
   - Payment readiness warnings
   - Clear status badges throughout

---

## 🚀 Recommended Next Steps (Optional Enhancements)

### Potential Improvements (Not Implemented):

1. **Automated Withdrawal Processing:**
   - Auto-approve withdrawals under certain threshold
   - Scheduled batch processing

2. **Enhanced Notifications:**
   - Email notifications for payment events
   - SMS alerts for large transactions

3. **Advanced Reporting:**
   - Downloadable financial reports
   - Tax documentation generation

4. **Refund System:**
   - Brief cancellation with automatic refunds
   - Dispute resolution flow

---

## 📁 Key Files in Stripe Flow

### Frontend Components:
- `src/components/BriefFundingModal.tsx` - Brief funding checkout
- `src/components/CreatorWallet.tsx` - Creator wallet & withdrawals
- `src/components/StripeConnectButton.tsx` - Stripe Connect onboarding
- `src/components/WinnerSelectionModal.tsx` - Winner selection with Stripe status
- `src/components/ManageRewardsPayments.tsx` - Reward distribution
- `src/components/WithdrawalManagement.tsx` - Admin withdrawal approval
- `src/components/AdminFinancialDashboard.tsx` - Financial metrics

### Backend Services:
- `server/services/stripeConnectService.js` - Core Stripe operations
- `server/services/stripeWebhookService.js` - Webhook event processing
- `server/routes/stripeConnect.js` - Stripe Connect endpoints
- `server/routes/stripeWebhooks.js` - Webhook handlers
- `server/routes/payments.js` - Payment & payout endpoints
- `server/routes/admin.js` - Admin financial metrics endpoint

### Configuration:
- `src/config/stripe.ts` - Stripe client configuration
- `server/stripe.js` - Server-side Stripe routes

---

## 🔍 Flow Diagram

```
BRAND FLOW:
1. Create Brief → 2. Fund Brief (Stripe Checkout) → 3. Brief Published
                              ↓
                    BriefFunding Record Created
                              ↓
4. Review Submissions → 5. Select Winners → 6. Distribute Rewards
                                                      ↓
                                            ┌─────────┴─────────┐
                                            ↓                   ↓
                                    CASH (Stripe)        CREDIT (Wallet)
                                            ↓                   ↓
                                    CreatorPayout      WalletTransaction

CREATOR FLOW:
1. Connect Stripe Account → 2. Submit to Briefs → 3. Win Brief
                                                          ↓
                                                  Receive Reward
                                                          ↓
                                            ┌─────────────┴─────────────┐
                                            ↓                           ↓
                                    Cash → Stripe Account     Credits → Wallet
                                                                        ↓
4. Request Withdrawal ← Credits in Wallet
         ↓
5. Admin Approves → 6. Stripe Transfer → 7. Creator Receives Funds

ADMIN FLOW:
1. Monitor All Transactions → 2. Review Withdrawal Requests
                                      ↓
                        ┌─────────────┴─────────────┐
                        ↓                           ↓
                    Approve                     Reject
                        ↓                           ↓
                Stripe Transfer              Return to Wallet
                        ↓
            Creator Receives Funds
```

---

## 📈 Transaction States

### Brief Funding States:
- `pending` → Payment initiated
- `completed` → Payment successful, brief funded
- `failed` → Payment failed

### Submission States:
- `pending` → Awaiting review
- `approved` → Shortlisted for winning
- `rejected` → Not selected

### Payout States:
- `pending` → Transfer initiated
- `completed` → Transfer successful
- `failed` → Transfer failed

### Withdrawal Request States:
- `pending` → Awaiting admin approval
- `approved` → Approved and processed
- `rejected` → Denied by admin

---

## 🎯 Key Integration Points

### 1. Stripe Connect Integration
**Purpose**: Allow creators to receive direct deposits

**Setup Flow:**
- Creator → Wallet → Connect Stripe
- System creates Express Connect account
- Redirect to Stripe onboarding
- Stripe webhook updates account status

**Status Tracking:**
- Real-time status in `CreatorStripeAccount`
- Visible to brands during winner selection
- Required for cash payouts

### 2. Stripe Checkout Integration
**Purpose**: Secure brand payment collection

**Payment Flow:**
- Brand → Fund Brief → Stripe Checkout
- Payment Intent created
- Card payment confirmed
- Webhook confirms completion
- Database updated

**Security:**
- PCI-compliant (Stripe handles card data)
- Webhook signature verification
- Idempotency keys prevent duplicates

### 3. Stripe Transfers
**Purpose**: Pay creators directly

**Transfer Flow:**
- Brand distributes rewards OR Admin approves withdrawal
- System creates Stripe Transfer
- Funds sent to creator's connected account
- Webhook confirms transfer
- Database updated

---

## 💡 Current Flow Strengths

### ✅ Robust Implementation:
1. **Separation of Concerns**: Clear division between checkout, Connect, and transfers
2. **Webhook Reliability**: All Stripe events properly handled
3. **Database Consistency**: Proper transaction recording
4. **Error Handling**: Comprehensive try-catch blocks
5. **Status Tracking**: Real-time status updates across all tables

### ✅ User Experience:
1. **Visual Feedback**: Clear status indicators
2. **Payment Readiness**: Creators see Stripe status before submitting
3. **Admin Control**: Withdrawal approval system
4. **Transparency**: Complete transaction history

### ✅ Security:
1. **No Direct Card Storage**: Stripe handles all PCI compliance
2. **Webhook Verification**: Signature checking prevents spoofing
3. **JWT Authentication**: All API endpoints protected
4. **Amount Validation**: Min/max checks on all transactions

---

## 🔧 Technical Implementation Details

### Environment Variables Required:
```
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_CONNECT_CLIENT_ID_TEST=ca_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
STRIPE_MODE=test (or live)
```

### Webhook Endpoints:
- `/api/stripe/webhooks` - Main webhook handler
- Listens for:
  - `checkout.session.completed`
  - `account.updated`
  - `transfer.paid`
  - `payout.paid`

### Key API Endpoints:

**Brand:**
- `POST /api/briefs/:id/fund` - Create checkout session
- `POST /api/rewards/distribute-with-stripe` - Distribute rewards

**Creator:**
- `POST /api/creators/onboard` - Start Stripe Connect
- `GET /api/creators/wallet/:creatorId` - Get wallet balance
- `GET /api/stripe/account/:creatorId` - Get Stripe status
- `POST /api/wallet/withdrawal/request` - Request withdrawal

**Admin:**
- `GET /api/admin/withdrawal-requests` - List all requests
- `POST /api/admin/withdrawal-requests/:id/process` - Process request
- `GET /api/admin/financial-metrics` - Get financial overview

---

## 📝 Recent Updates & Fixes

### Latest Changes:
1. ✅ Fixed Financial Dashboard to use real database data
2. ✅ Corrected Prisma field names (totalAmount, not amount)
3. ✅ Fixed WinnerReward relationship queries
4. ✅ Added proper Decimal to Float conversions
5. ✅ Complete dark/light mode support for all payment UIs
6. ✅ Modern sidebar navigation across all dashboards

### Bug Fixes:
- Fixed BriefFunding aggregate query field names
- Fixed WinnerReward relationship navigation (via Winner model)
- Removed console.error statements for clean linting

---

## ⚠️ Important Notes

### DO NOT Remove These Files:
All files in the Stripe flow are actively used and interconnected:

**Frontend:**
- All components listed above are essential
- Each serves a specific purpose in the payment flow
- Removing any would break the flow

**Backend:**
- All service files are core to operations
- Routes handle different aspects of the payment lifecycle
- Webhooks are critical for payment confirmation

### Test Mode vs Live Mode:
- Currently using `STRIPE_MODE=test` for development
- Switch to `live` mode only after thorough testing
- Ensure all environment variables configured for both modes

---

## 🎉 Conclusion

The DraftBoard Stripe implementation is **comprehensive and well-structured**. The flow covers:
- ✅ Brand checkout for brief funding
- ✅ Creator Stripe Connect onboarding
- ✅ Automated reward distribution
- ✅ Manual withdrawal request system
- ✅ Admin oversight and approval
- ✅ Complete transaction tracking

**The flow is production-ready with proper security, validation, and error handling.**

No files need to be removed - all components are actively serving the payment flow. The implementation follows Stripe best practices and maintains clear separation between different payment types (funding, payouts, withdrawals).

---

*Last Updated: 2025-09-30*
*Version: 1.0*
