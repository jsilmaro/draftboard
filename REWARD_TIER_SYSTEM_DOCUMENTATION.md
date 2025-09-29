# Reward Tier System Documentation

## Overview

The DraftBoard platform has been restructured to use a **reward-tier based system** instead of recalculating amounts at payout time. This provides a cleaner, more predictable flow where payments are set at brief creation, brands assign winners later, and payouts are handled automatically.

## System Architecture

### Database Schema

#### New Models

1. **RewardTier**
   - `id`: Unique identifier
   - `briefId`: Reference to the brief
   - `tierNumber`: Sequential number (1, 2, 3, etc.)
   - `name`: Display name (e.g., "First Place", "Runner-up")
   - `description`: Optional description
   - `amount`: Dollar amount for this tier
   - `position`: Display order
   - `isActive`: Whether tier is active

2. **RewardAssignment**
   - `id`: Unique identifier
   - `briefId`: Reference to the brief
   - `rewardTierId`: Reference to the reward tier
   - `creatorId`: Assigned creator
   - `submissionId`: Creator's submission
   - `assignedAt`: When assignment was made
   - `assignedBy`: Brand user who made assignment
   - `status`: Assignment status (assigned, confirmed, completed)
   - `payoutStatus`: Payout status (pending, processing, paid, failed)
   - `stripeTransferId`: Stripe transfer ID for payouts
   - `paidAt`: When payout was completed

3. **BriefStatus**
   - `id`: Unique identifier
   - `briefId`: Reference to the brief
   - `status`: Current status (draft, funded, winners_selected, payouts_completed)
   - `updatedAt`: When status was updated
   - `updatedBy`: User who updated status
   - `notes`: Optional notes

#### Updated Models

- **Brief**: Added `totalBudget` field calculated from reward tiers
- **Creator**: Added `rewardAssignments` relation
- **Submission**: Added `rewardAssignment` relation

## Flow Overview

### 1. Create Brief (Brand Side)

**Frontend**: `CreateBrief.tsx` + `RewardTierManager.tsx`
**Backend**: `POST /api/briefs`

- Brands define reward tiers at brief creation
- Each tier has a name, description, and amount
- Total budget = sum of all reward tier amounts
- Brief is created with `totalBudget` field
- Initial status: `draft`

### 2. Fund Brief (Checkout)

**Frontend**: `BriefFundingModal.tsx`
**Backend**: `POST /api/briefs/:id/fund`

- Brand funds the brief using total budget from reward tiers
- Stripe Checkout session created with total amount
- On `checkout.session.completed` webhook:
  - Brief marked as `isFunded = true`
  - Status updated to `funded`
  - `BriefFunding` record created

### 3. Select Winners (Brand Side)

**Frontend**: `RewardManagementPage.tsx`
**Backend**: `POST /api/briefs/:id/assign-reward`

- Brands view funded briefs with available submissions
- Assign creators to reward tiers
- Each tier can only be assigned once
- Each submission can only be assigned once
- Status updated to `winners_selected`

### 4. Payout Allocation

**Frontend**: `RewardManagementPage.tsx`
**Backend**: `POST /api/briefs/:id/process-payouts`

- When winners are assigned, trigger Stripe Transfers
- Transfer from platform account to creator's connected account
- Amount based on assigned reward tier
- Update payout status: `pending` → `processing` → `paid`
- Status updated to `payouts_completed`

## API Endpoints

### Brief Creation
```
POST /api/briefs
Body: {
  title: string,
  description: string,
  requirements: string,
  deadline: string,
  rewardTiers: [
    {
      tierNumber: number,
      name: string,
      description: string,
      amount: number,
      position: number
    }
  ]
}
```

### Brief Funding
```
POST /api/briefs/:id/fund
Body: {} // Uses totalBudget from brief
```

### Reward Assignment
```
POST /api/briefs/:id/assign-reward
Body: {
  rewardTierId: string,
  submissionId: string,
  creatorId: string
}
```

### Remove Assignment
```
DELETE /api/reward-assignments/:id
```

### Process Payouts
```
POST /api/briefs/:id/process-payouts
```

### Get Assignments
```
GET /api/briefs/:id/reward-assignments
```

## Frontend Components

### RewardTierManager.tsx
- Manages reward tier creation and editing
- Calculates total budget
- Used in brief creation flow

### RewardManagementPage.tsx
- Main interface for reward assignment
- Shows funded briefs with submissions
- Allows assigning creators to tiers
- Processes payouts

### Updated CreateBrief.tsx
- Integrates RewardTierManager
- Sends reward tier data to backend
- Calculates total budget

## Status Flow

```
Draft → Funded → Winners Selected → Payouts Completed
```

1. **Draft**: Brief created with reward tiers
2. **Funded**: Payment successful, brief funded
3. **Winners Selected**: Creators assigned to reward tiers
4. **Payouts Completed**: All transfers processed

## Webhook Handling

### checkout.session.completed
- Create `BriefFunding` record
- Update brief status to `funded`
- Set `isFunded = true`

### transfer.created
- Update assignment `payoutStatus` to `processing`

### transfer.updated
- Update assignment `payoutStatus` to `paid`
- Set `paidAt` timestamp

## Error Handling

- **Validation**: Ensure reward tiers have valid amounts
- **Assignment Conflicts**: Prevent duplicate assignments
- **Payout Failures**: Handle failed Stripe transfers
- **Status Consistency**: Maintain proper status flow

## Migration Notes

### Database Changes
- New tables: `RewardTier`, `RewardAssignment`, `BriefStatus`
- Updated `Brief` table with `totalBudget` field
- Added relations to existing models

### Backward Compatibility
- Legacy `reward` field maintained
- Old reward system still functional for existing briefs
- Gradual migration to new system

## Development Guidelines

### Adding New Features
1. Update database schema if needed
2. Create/update API endpoints
3. Update frontend components
4. Add proper error handling
5. Update documentation

### Testing
- Test reward tier creation
- Test funding flow with new system
- Test assignment process
- Test payout processing
- Test error scenarios

### Deployment
1. Run database migrations
2. Deploy backend changes
3. Deploy frontend changes
4. Test in staging environment
5. Monitor for issues

## Troubleshooting

### Common Issues
1. **Reward tiers not saving**: Check API endpoint and validation
2. **Funding fails**: Verify totalBudget calculation
3. **Assignment conflicts**: Check for duplicate assignments
4. **Payout failures**: Check Stripe account status

### Debug Steps
1. Check database for proper records
2. Verify API responses
3. Check Stripe webhook logs
4. Review frontend console errors

## Future Enhancements

- **Bulk Assignment**: Assign multiple creators at once
- **Partial Payouts**: Support partial payments
- **Reward Templates**: Predefined reward structures
- **Analytics**: Track reward distribution patterns
- **Notifications**: Real-time updates for assignments

## Support

For issues or questions about the reward tier system:
1. Check this documentation
2. Review API logs
3. Check database state
4. Contact development team

