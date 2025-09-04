const NotificationService = require('../services/notificationService');

class NotificationTriggers {
  /**
   * Trigger notifications for brief-related events
   */
  static async briefCreated(briefId, brandId, briefTitle) {
    try {
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Brief Published Successfully!',
        message: `Your brief "${briefTitle}" has been published and is now visible to creators.`,
        type: 'brief',
        category: 'brief',
        priority: 'normal',
        actionUrl: `/brand/briefs/${briefId}`,
        actionText: 'View Brief',
        relatedEntityType: 'brief',
        relatedEntityId: briefId,
        metadata: { briefTitle, briefId }
      });
    } catch (error) {
      console.error('Error creating brief created notification:', error);
    }
  }

  static async briefClosed(briefId, brandId, briefTitle, creatorIds = []) {
    try {
      // Notify brand
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Brief Closed Successfully',
        message: `Your brief "${briefTitle}" has been closed. No new applications will be accepted.`,
        type: 'brief',
        category: 'brief',
        priority: 'normal',
        actionUrl: `/brand/briefs/${briefId}`,
        actionText: 'View Brief',
        relatedEntityType: 'brief',
        relatedEntityId: briefId,
        metadata: { briefTitle, briefId }
      });

      // Notify all creators who applied
      if (creatorIds.length > 0) {
        const creatorNotifications = creatorIds.map(creatorId => ({
          userId: creatorId,
          userType: 'creator',
          title: 'Brief Application Closed',
          message: `The brief "${briefTitle}" you applied to has been closed. The brand is reviewing applications.`,
          type: 'brief',
          category: 'brief',
          priority: 'normal',
          actionUrl: `/creator/briefs/${briefId}`,
          actionText: 'View Brief',
          relatedEntityType: 'brief',
          relatedEntityId: briefId,
          metadata: { briefTitle, briefId }
        }));

        await NotificationService.createBulkNotifications(creatorNotifications);
      }
    } catch (error) {
      console.error('Error creating brief closed notifications:', error);
    }
  }

  static async briefStatusUpdated(briefId, brandId, briefTitle, status) {
    try {
      let statusMessage = '';
      switch (status) {
        case 'active':
          statusMessage = `Your brief "${briefTitle}" is now active and accepting applications.`;
          break;
        case 'paused':
          statusMessage = `Your brief "${briefTitle}" has been paused. Applications are temporarily suspended.`;
          break;
        case 'completed':
          statusMessage = `Your brief "${briefTitle}" has been completed.`;
          break;
        default:
          statusMessage = `Your brief "${briefTitle}" status has been updated to ${status}.`;
      }

      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Brief Status Updated',
        message: statusMessage,
        type: 'brief',
        category: 'brief',
        priority: 'normal',
        actionUrl: `/brand/briefs/${briefId}`,
        actionText: 'View Brief',
        relatedEntityType: 'brief',
        relatedEntityId: briefId,
        metadata: { briefTitle, briefId, status }
      });
    } catch (error) {
      console.error('Error creating brief status update notification:', error);
    }
  }

  /**
   * Trigger notifications for submission-related events
   */
  static async submissionReceived(submissionId, briefId, briefTitle, brandId, creatorId, creatorName) {
    try {
      // Notify brand
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'New Application Received',
        message: `${creatorName} submitted an application to your brief "${briefTitle}"`,
        type: 'submission',
        category: 'submission',
        priority: 'high',
        actionUrl: `/brand/submissions/${submissionId}`,
        actionText: 'Review Application',
        relatedEntityType: 'submission',
        relatedEntityId: submissionId,
        metadata: { submissionId, briefId, briefTitle, creatorId, creatorName }
      });

      // Notify creator
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Application Submitted Successfully!',
        message: `Your application for "${briefTitle}" has been submitted successfully. The brand will review it soon.`,
        type: 'submission',
        category: 'submission',
        priority: 'normal',
        actionUrl: `/creator/submissions/${submissionId}`,
        actionText: 'View Application',
        relatedEntityType: 'submission',
        relatedEntityId: submissionId,
        metadata: { submissionId, briefId, briefTitle }
      });
    } catch (error) {
      console.error('Error creating submission received notifications:', error);
    }
  }

  static async submissionApproved(submissionId, briefId, briefTitle, creatorId) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Application Approved!',
        message: `Your application for "${briefTitle}" has been approved and added to the shortlist!`,
        type: 'submission',
        category: 'submission',
        priority: 'high',
        actionUrl: `/creator/submissions/${submissionId}`,
        actionText: 'View Application',
        relatedEntityType: 'submission',
        relatedEntityId: submissionId,
        metadata: { submissionId, briefId, briefTitle }
      });
    } catch (error) {
      console.error('Error creating submission approved notification:', error);
    }
  }

  static async submissionRejected(submissionId, briefId, briefTitle, creatorId, reason = null) {
    try {
      const message = reason 
        ? `Your application for "${briefTitle}" was not selected. Reason: ${reason}`
        : `Your application for "${briefTitle}" was not selected at this time.`;

      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Application Update',
        message: message,
        type: 'submission',
        category: 'submission',
        priority: 'normal',
        actionUrl: `/creator/submissions/${submissionId}`,
        actionText: 'View Application',
        relatedEntityType: 'submission',
        relatedEntityId: submissionId,
        metadata: { submissionId, briefId, briefTitle, reason }
      });
    } catch (error) {
      console.error('Error creating submission rejected notification:', error);
    }
  }

  static async submissionViewed(submissionId, briefId, briefTitle, creatorId) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Your Submission Was Viewed',
        message: `The brand viewed your submission for "${briefTitle}". They're reviewing applications!`,
        type: 'submission',
        category: 'submission',
        priority: 'low',
        actionUrl: `/creator/submissions/${submissionId}`,
        actionText: 'View Application',
        relatedEntityType: 'submission',
        relatedEntityId: submissionId,
        metadata: { submissionId, briefId, briefTitle }
      });
    } catch (error) {
      console.error('Error creating submission viewed notification:', error);
    }
  }

  /**
   * Trigger notifications for payment-related events
   */
  static async paymentReceived(paymentId, briefId, briefTitle, creatorId, amount) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Payment Received!',
        message: `You received $${amount.toFixed(2)} for winning "${briefTitle}"`,
        type: 'payment',
        category: 'payment',
        priority: 'high',
        actionUrl: `/creator/wallet`,
        actionText: 'View Wallet',
        relatedEntityType: 'payment',
        relatedEntityId: paymentId,
        metadata: { paymentId, briefId, briefTitle, amount }
      });
    } catch (error) {
      console.error('Error creating payment received notification:', error);
    }
  }

  static async paymentSent(paymentId, briefId, briefTitle, brandId, creatorName, amount) {
    try {
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Payment Sent Successfully',
        message: `Payment of $${amount.toFixed(2)} has been sent to ${creatorName} for "${briefTitle}"`,
        type: 'payment',
        category: 'payment',
        priority: 'normal',
        actionUrl: `/brand/payments/${paymentId}`,
        actionText: 'View Payment',
        relatedEntityType: 'payment',
        relatedEntityId: paymentId,
        metadata: { paymentId, briefId, briefTitle, creatorName, amount }
      });
    } catch (error) {
      console.error('Error creating payment sent notification:', error);
    }
  }

  static async paymentFailed(paymentId, briefId, briefTitle, brandId, creatorName, errorMessage) {
    try {
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Payment Processing Issue',
        message: `Payment to ${creatorName} for "${briefTitle}" encountered an issue: ${errorMessage}`,
        type: 'payment',
        category: 'payment',
        priority: 'urgent',
        actionUrl: `/brand/payments/${paymentId}`,
        actionText: 'Retry Payment',
        relatedEntityType: 'payment',
        relatedEntityId: paymentId,
        metadata: { paymentId, briefId, briefTitle, creatorName, errorMessage }
      });
    } catch (error) {
      console.error('Error creating payment failed notification:', error);
    }
  }

  /**
   * Trigger notifications for wallet-related events
   */
  static async walletTopUp(walletId, userId, userType, amount, newBalance) {
    try {
      await NotificationService.createNotification({
        userId: userId,
        userType: userType,
        title: 'Wallet Top-Up Successful!',
        message: `Your wallet has been topped up with $${amount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`,
        type: 'wallet',
        category: 'wallet',
        priority: 'normal',
        actionUrl: `/${userType}/wallet`,
        actionText: 'View Wallet',
        relatedEntityType: 'wallet',
        relatedEntityId: walletId,
        metadata: { walletId, amount, newBalance }
      });
    } catch (error) {
      console.error('Error creating wallet top-up notification:', error);
    }
  }

  static async withdrawalRequested(withdrawalId, creatorId, amount) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for $${amount.toFixed(2)} has been submitted and is pending admin approval.`,
        type: 'wallet',
        category: 'wallet',
        priority: 'normal',
        actionUrl: `/creator/wallet`,
        actionText: 'View Wallet',
        relatedEntityType: 'withdrawal',
        relatedEntityId: withdrawalId,
        metadata: { withdrawalId, amount }
      });
    } catch (error) {
      console.error('Error creating withdrawal requested notification:', error);
    }
  }

  static async withdrawalApproved(withdrawalId, creatorId, amount) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Withdrawal Approved!',
        message: `Your withdrawal request for $${amount.toFixed(2)} has been approved and processed.`,
        type: 'wallet',
        category: 'wallet',
        priority: 'high',
        actionUrl: `/creator/wallet`,
        actionText: 'View Wallet',
        relatedEntityType: 'withdrawal',
        relatedEntityId: withdrawalId,
        metadata: { withdrawalId, amount }
      });
    } catch (error) {
      console.error('Error creating withdrawal approved notification:', error);
    }
  }

  static async withdrawalRejected(withdrawalId, creatorId, amount, reason) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal request for $${amount.toFixed(2)} has been rejected. Reason: ${reason}`,
        type: 'wallet',
        category: 'wallet',
        priority: 'normal',
        actionUrl: `/creator/wallet`,
        actionText: 'View Wallet',
        relatedEntityType: 'withdrawal',
        relatedEntityId: withdrawalId,
        metadata: { withdrawalId, amount, reason }
      });
    } catch (error) {
      console.error('Error creating withdrawal rejected notification:', error);
    }
  }

  /**
   * Trigger notifications for winner/reward-related events
   */
  static async winnerSelected(winnerId, briefId, briefTitle, creatorId, position, rewardAmount) {
    try {
      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'Congratulations! You Won a Reward!',
        message: `You received ${position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`} place for "${briefTitle}"! Reward: $${rewardAmount.toFixed(2)}`,
        type: 'winner',
        category: 'winner',
        priority: 'high',
        actionUrl: `/creator/rewards/${winnerId}`,
        actionText: 'View Reward',
        relatedEntityType: 'winner',
        relatedEntityId: winnerId,
        metadata: { winnerId, briefId, briefTitle, position, rewardAmount }
      });
    } catch (error) {
      console.error('Error creating winner selected notification:', error);
    }
  }

  static async winnersSelected(briefId, briefTitle, brandId, winnerCount) {
    try {
      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Winners Selected Successfully!',
        message: `${winnerCount} winner${winnerCount > 1 ? 's' : ''} have been selected for "${briefTitle}". You can now process payments to the winners.`,
        type: 'winner',
        category: 'winner',
        priority: 'normal',
        actionUrl: `/brand/briefs/${briefId}/winners`,
        actionText: 'View Winners',
        relatedEntityType: 'brief',
        relatedEntityId: briefId,
        metadata: { briefId, briefTitle, winnerCount }
      });
    } catch (error) {
      console.error('Error creating winners selected notification:', error);
    }
  }

  /**
   * Trigger notifications for invitation-related events
   */
  static async invitationReceived(invitationId, brandId, brandName, creatorId, briefTitle = null) {
    try {
      const message = briefTitle 
        ? `${brandName} has invited you to collaborate on "${briefTitle}".`
        : `${brandName} has invited you to collaborate on future projects.`;

      await NotificationService.createNotification({
        userId: creatorId,
        userType: 'creator',
        title: 'You Received an Invitation!',
        message: message,
        type: 'invitation',
        category: 'invitation',
        priority: 'normal',
        actionUrl: `/creator/invitations/${invitationId}`,
        actionText: 'View Invitation',
        relatedEntityType: 'invitation',
        relatedEntityId: invitationId,
        metadata: { invitationId, brandId, brandName, briefTitle }
      });
    } catch (error) {
      console.error('Error creating invitation received notification:', error);
    }
  }

  static async invitationSent(invitationId, brandId, creatorName, briefTitle = null) {
    try {
      const message = briefTitle 
        ? `Invitation sent to ${creatorName} to collaborate on "${briefTitle}".`
        : `Invitation sent to ${creatorName} to collaborate on future projects.`;

      await NotificationService.createNotification({
        userId: brandId,
        userType: 'brand',
        title: 'Invitation Sent Successfully',
        message: message,
        type: 'invitation',
        category: 'invitation',
        priority: 'low',
        actionUrl: `/brand/invitations/${invitationId}`,
        actionText: 'View Invitation',
        relatedEntityType: 'invitation',
        relatedEntityId: invitationId,
        metadata: { invitationId, creatorName, briefTitle }
      });
    } catch (error) {
      console.error('Error creating invitation sent notification:', error);
    }
  }

  /**
   * Trigger notifications for security-related events
   */
  static async securityAlert(userId, userType, alertType, message, severity = 'normal') {
    try {
      const priority = severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'normal';
      
      await NotificationService.createNotification({
        userId: userId,
        userType: userType,
        title: 'Security Alert',
        message: message,
        type: 'security',
        category: 'security',
        priority: priority,
        actionUrl: '/security',
        actionText: 'View Details',
        relatedEntityType: 'security',
        relatedEntityId: alertType,
        metadata: { alertType, severity },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire after 7 days
      });
    } catch (error) {
      console.error('Error creating security alert notification:', error);
    }
  }

  /**
   * Trigger notifications for system-related events
   */
  static async systemUpdate(userId, userType, updateType, message) {
    try {
      await NotificationService.createNotification({
        userId: userId,
        userType: userType,
        title: 'System Update',
        message: message,
        type: 'system',
        category: 'system',
        priority: 'normal',
        actionUrl: '/updates',
        actionText: 'Learn More',
        relatedEntityType: 'system',
        relatedEntityId: updateType,
        metadata: { updateType }
      });
    } catch (error) {
      console.error('Error creating system update notification:', error);
    }
  }

  /**
   * Trigger welcome notifications
   */
  static async welcomeBack(userId, userType, userName) {
    try {
      await NotificationService.createNotification({
        userId: userId,
        userType: userType,
        title: 'Welcome Back!',
        message: `Welcome back to your dashboard, ${userName}!`,
        type: 'system',
        category: 'system',
        priority: 'low',
        actionUrl: `/${userType}/dashboard`,
        actionText: 'View Dashboard',
        metadata: { userName },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire after 24 hours
      });
    } catch (error) {
      console.error('Error creating welcome back notification:', error);
    }
  }
}

module.exports = NotificationTriggers;
