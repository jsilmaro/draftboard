-- Enhanced Notification System Migration
-- This migration enhances the existing notification system with comprehensive features

-- First, let's add new columns to the existing Notification table
ALTER TABLE "public"."Notification" 
ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal' CHECK ("priority" IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'general' CHECK ("category" IN ('system', 'brief', 'submission', 'payment', 'wallet', 'invitation', 'security', 'reward', 'winner', 'general')),
ADD COLUMN IF NOT EXISTS "actionUrl" TEXT,
ADD COLUMN IF NOT EXISTS "actionText" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB,
ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dismissedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "relatedEntityType" TEXT,
ADD COLUMN IF NOT EXISTS "relatedEntityId" TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Notification_priority_idx" ON "public"."Notification"("priority");
CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "public"."Notification"("category");
CREATE INDEX IF NOT EXISTS "Notification_readAt_idx" ON "public"."Notification"("readAt");
CREATE INDEX IF NOT EXISTS "Notification_dismissedAt_idx" ON "public"."Notification"("dismissedAt");
CREATE INDEX IF NOT EXISTS "Notification_expiresAt_idx" ON "public"."Notification"("expiresAt");
CREATE INDEX IF NOT EXISTS "Notification_relatedEntity_idx" ON "public"."Notification"("relatedEntityType", "relatedEntityId");
CREATE INDEX IF NOT EXISTS "Notification_userType_category_idx" ON "public"."Notification"("userType", "category");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- Create a notification preferences table for users
CREATE TABLE IF NOT EXISTS "public"."NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "emailNotifications" BOOLEAN DEFAULT true,
    "pushNotifications" BOOLEAN DEFAULT true,
    "inAppNotifications" BOOLEAN DEFAULT true,
    "categories" JSONB DEFAULT '{"system": true, "brief": true, "submission": true, "payment": true, "wallet": true, "invitation": true, "security": true, "reward": true, "winner": true, "general": true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- Create unique index for user preferences
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreferences_userId_userType_key" ON "public"."NotificationPreferences"("userId", "userType");

-- Create notification templates table for consistent messaging
CREATE TABLE IF NOT EXISTS "public"."NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "actionText" TEXT,
    "actionUrlTemplate" TEXT,
    "priority" TEXT DEFAULT 'normal',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- Create unique index for template names
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_name_key" ON "public"."NotificationTemplate"("name");

-- Insert default notification templates
INSERT INTO "public"."NotificationTemplate" ("id", "name", "type", "category", "titleTemplate", "messageTemplate", "actionText", "actionUrlTemplate", "priority") VALUES
('brief_created', 'Brief Created', 'brief', 'brief', 'Brief Published Successfully!', 'Your brief "{{briefTitle}}" has been published and is now visible to creators.', 'View Brief', '/brand/briefs/{{briefId}}', 'normal'),
('brief_closed', 'Brief Closed', 'brief', 'brief', 'Brief Closed Successfully', 'Your brief "{{briefTitle}}" has been closed. No new applications will be accepted.', 'View Brief', '/brand/briefs/{{briefId}}', 'normal'),
('submission_received', 'New Submission', 'submission', 'submission', 'New Application Received', '{{creatorName}} submitted an application to your brief "{{briefTitle}}"', 'Review Application', '/brand/submissions/{{submissionId}}', 'high'),
('submission_approved', 'Submission Approved', 'submission', 'submission', 'Application Approved!', 'Your application for "{{briefTitle}}" has been approved and added to the shortlist!', 'View Brief', '/creator/briefs/{{briefId}}', 'high'),
('submission_rejected', 'Submission Rejected', 'submission', 'submission', 'Application Update', 'Your application for "{{briefTitle}}" was not selected at this time.', 'View Brief', '/creator/briefs/{{briefId}}', 'normal'),
('payment_received', 'Payment Received', 'payment', 'payment', 'Payment Received!', 'You received ${{amount}} for winning "{{briefTitle}}"', 'View Wallet', '/creator/wallet', 'high'),
('payment_sent', 'Payment Sent', 'payment', 'payment', 'Payment Sent Successfully', 'Payment of ${{amount}} has been sent to {{creatorName}} for "{{briefTitle}}"', 'View Payment', '/brand/payments/{{paymentId}}', 'normal'),
('wallet_topup', 'Wallet Top-Up', 'wallet', 'wallet', 'Wallet Top-Up Successful!', 'Your wallet has been topped up with ${{amount}}. New balance: ${{newBalance}}', 'View Wallet', '/brand/wallet', 'normal'),
('withdrawal_approved', 'Withdrawal Approved', 'wallet', 'wallet', 'Withdrawal Approved!', 'Your withdrawal request for ${{amount}} has been approved and processed.', 'View Wallet', '/creator/wallet', 'high'),
('withdrawal_rejected', 'Withdrawal Rejected', 'wallet', 'wallet', 'Withdrawal Request Rejected', 'Your withdrawal request for ${{amount}} has been rejected. Reason: {{reason}}', 'View Wallet', '/creator/wallet', 'normal'),
('winner_selected', 'Winner Selected', 'winner', 'winner', 'Congratulations! You Won a Reward!', 'You received "{{rewardName}}" ({{rewardDescription}}) for "{{briefTitle}}"! Check your wallet for the reward.', 'View Reward', '/creator/rewards/{{rewardId}}', 'high'),
('invitation_received', 'Invitation Received', 'invitation', 'invitation', 'You Received an Invitation!', '{{brandName}} has invited you to collaborate on "{{briefTitle}}".', 'View Invitation', '/creator/invitations/{{invitationId}}', 'normal'),
('security_alert', 'Security Alert', 'security', 'security', 'Security Alert', '{{message}}', 'View Details', '/security', 'urgent'),
('system_update', 'System Update', 'system', 'system', 'System Update', '{{message}}', 'Learn More', '/updates', 'normal')
ON CONFLICT ("name") DO NOTHING;

-- Create notification delivery log for tracking
CREATE TABLE IF NOT EXISTS "public"."NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL CHECK ("deliveryMethod" IN ('in_app', 'email', 'push')),
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "public"."NotificationDelivery" 
ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" 
FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for delivery tracking
CREATE INDEX IF NOT EXISTS "NotificationDelivery_notificationId_idx" ON "public"."NotificationDelivery"("notificationId");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_idx" ON "public"."NotificationDelivery"("status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_deliveredAt_idx" ON "public"."NotificationDelivery"("deliveredAt");

-- Create a function to clean up old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 90 days that are read and dismissed
    DELETE FROM "public"."Notification" 
    WHERE "createdAt" < NOW() - INTERVAL '90 days' 
    AND "isRead" = true 
    AND "dismissedAt" IS NOT NULL;
    
    -- Delete expired notifications
    DELETE FROM "public"."Notification" 
    WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(user_id TEXT, user_type TEXT)
RETURNS TABLE(
    total_count BIGINT,
    unread_count BIGINT,
    category_counts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE "isRead" = false) as unread_count,
        jsonb_object_agg(
            COALESCE("category", 'general'), 
            category_count
        ) as category_counts
    FROM (
        SELECT 
            "category",
            COUNT(*) as category_count
        FROM "public"."Notification"
        WHERE "userId" = user_id 
        AND "userType" = user_type
        AND "dismissedAt" IS NULL
        GROUP BY "category"
    ) category_stats;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark multiple notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    user_id TEXT,
    user_type TEXT,
    notification_ids TEXT[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF notification_ids IS NULL THEN
        -- Mark all notifications as read for the user
        UPDATE "public"."Notification"
        SET "isRead" = true, "readAt" = NOW()
        WHERE "userId" = user_id 
        AND "userType" = user_type
        AND "isRead" = false;
    ELSE
        -- Mark specific notifications as read
        UPDATE "public"."Notification"
        SET "isRead" = true, "readAt" = NOW()
        WHERE "userId" = user_id 
        AND "userType" = user_type
        AND "id" = ANY(notification_ids);
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to dismiss notifications
CREATE OR REPLACE FUNCTION dismiss_notifications(
    user_id TEXT,
    user_type TEXT,
    notification_ids TEXT[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF notification_ids IS NULL THEN
        -- Dismiss all notifications for the user
        UPDATE "public"."Notification"
        SET "dismissedAt" = NOW()
        WHERE "userId" = user_id 
        AND "userType" = user_type
        AND "dismissedAt" IS NULL;
    ELSE
        -- Dismiss specific notifications
        UPDATE "public"."Notification"
        SET "dismissedAt" = NOW()
        WHERE "userId" = user_id 
        AND "userType" = user_type
        AND "id" = ANY(notification_ids);
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE "public"."Notification" IS 'Enhanced notification system with categories, priorities, and metadata support';
COMMENT ON TABLE "public"."NotificationPreferences" IS 'User notification preferences and settings';
COMMENT ON TABLE "public"."NotificationTemplate" IS 'Templates for consistent notification messaging';
COMMENT ON TABLE "public"."NotificationDelivery" IS 'Tracking notification delivery across different channels';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Cleans up old and expired notifications';
COMMENT ON FUNCTION get_notification_stats(TEXT, TEXT) IS 'Returns notification statistics for a user';
COMMENT ON FUNCTION mark_notifications_read(TEXT, TEXT, TEXT[]) IS 'Marks notifications as read for a user';
COMMENT ON FUNCTION dismiss_notifications(TEXT, TEXT, TEXT[]) IS 'Dismisses notifications for a user';
