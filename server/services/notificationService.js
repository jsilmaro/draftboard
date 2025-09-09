const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationService {
  /**
   * Create a new notification with enhanced features
   */
  static async createNotification({
    userId,
    userType,
    title,
    message,
    type = 'general',
    category = 'general',
    priority = 'normal',
    actionUrl = null,
    actionText = null,
    metadata = null,
    relatedEntityType = null,
    relatedEntityId = null,
    expiresAt = null
  }) {
    try {
      console.log(`🔔 Creating enhanced notification:`, { 
        userId, userType, title, message, type, category, priority 
      });
      
      // Validate inputs
      if (!userId || !userType || !title || !message) {
        throw new Error('Missing required fields for notification');
      }

      // Use enhanced schema (now that it's available)
      const notification = await prisma.notification.create({
        data: {
          userId,
          userType,
          title,
          message,
          type,
          category,
          priority,
          actionUrl,
          actionText,
          metadata: metadata ? JSON.stringify(metadata) : null,
          relatedEntityType,
          relatedEntityId,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });

      // Log delivery attempt
      await this.logDelivery(notification.id, 'in_app', 'pending');

      console.log(`🔔 Enhanced notification created successfully:`, notification.id);
      return notification;
    } catch (error) {
      console.error('🔔 Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification from template
   */
  static async createFromTemplate(templateName, userId, userType, variables = {}) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { name: templateName }
      });

      if (!template || !template.isActive) {
        throw new Error(`Template ${templateName} not found or inactive`);
      }

      // Replace variables in templates
      const title = this.replaceVariables(template.titleTemplate, variables);
      const message = this.replaceVariables(template.messageTemplate, variables);
      const actionUrl = template.actionUrlTemplate ? 
        this.replaceVariables(template.actionUrlTemplate, variables) : null;

      return await this.createNotification({
        userId,
        userType,
        title,
        message,
        type: template.type,
        category: template.category,
        priority: template.priority,
        actionUrl,
        actionText: template.actionText,
        metadata: { templateName, variables }
      });
    } catch (error) {
      console.error('🔔 Error creating notification from template:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with filtering and pagination
   */
  static async getUserNotifications({
    userId,
    userType,
    category = null,
    priority = null,
    isRead = null,
    limit = 20,
    offset = 0,
    includeDismissed = false
  }) {
    try {
      // Use enhanced schema (now that it's available)
      const where = {
        userId,
        userType,
        ...(category && { category }),
        ...(priority && { priority }),
        ...(isRead !== null && { isRead }),
        ...(includeDismissed ? {} : { dismissedAt: null })
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications: notifications.map(n => ({
          ...n,
          metadata: n.metadata ? JSON.parse(n.metadata) : null
        })),
        total: Number(total),
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('🔔 Error fetching user notifications:', error);
      
      // If it's a table doesn't exist error, return empty results
      if (error.code === 'P2021' || error.message.includes("Can't reach database server")) {
        console.log('🔔 Notification tables not available, returning empty results');
        return {
          notifications: [],
          total: 0,
          hasMore: false
        };
      }
      
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId, userType, notificationIds = null) {
    try {
      const where = {
        userId,
        userType,
        isRead: false,
        ...(notificationIds && { id: { in: notificationIds } })
      };

      // Use enhanced schema (now that it's available)
      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`🔔 Marked ${result.count} notifications as read for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('🔔 Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss notifications
   */
  static async dismiss(userId, userType, notificationIds = null) {
    try {
      // Use enhanced schema (now that it's available)
      const where = {
        userId,
        userType,
        dismissedAt: null,
        ...(notificationIds && { id: { in: notificationIds } })
      };

      const result = await prisma.notification.updateMany({
        where,
        data: {
          dismissedAt: new Date()
        }
      });

      console.log(`🔔 Dismissed ${result.count} notifications for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('🔔 Error dismissing notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getStats(userId, userType) {
    try {
      // Use enhanced schema (now that it's available)
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as total_count,
          COUNT(*) FILTER (WHERE "isRead" = false)::int as unread_count,
          COUNT(*) FILTER (WHERE "priority" = 'urgent' AND "isRead" = false)::int as urgent_unread_count,
          COUNT(*) FILTER (WHERE "category" = 'payment' AND "isRead" = false)::int as payment_unread_count,
          COUNT(*) FILTER (WHERE "category" = 'security' AND "isRead" = false)::int as security_unread_count
        FROM "Notification"
        WHERE "userId" = ${userId} 
        AND "userType" = ${userType}
        AND ("dismissedAt" IS NULL OR "dismissedAt" IS NULL)
      `;

      const categoryStats = await prisma.notification.groupBy({
        by: ['category'],
        where: {
          userId,
          userType,
          dismissedAt: null
        },
        _count: {
          category: true
        }
      });

      return {
        total_count: Number(stats[0].total_count),
        unread_count: Number(stats[0].unread_count),
        urgent_unread_count: Number(stats[0].urgent_unread_count),
        payment_unread_count: Number(stats[0].payment_unread_count),
        security_unread_count: Number(stats[0].security_unread_count),
        categoryCounts: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = Number(stat._count.category);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('🔔 Error fetching notification stats:', error);
      // Return default stats on error
      return {
        total_count: 0,
        unread_count: 0,
        urgent_unread_count: 0,
        payment_unread_count: 0,
        security_unread_count: 0,
        categoryCounts: {}
      };
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId, userType) {
    try {
      // Use enhanced schema (now that it's available)
      let preferences = await prisma.notificationPreferences.findUnique({
        where: {
          userId_userType: {
            userId,
            userType
          }
        }
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: {
            userId,
            userType,
            emailNotifications: true,
            pushNotifications: true,
            inAppNotifications: true,
            categories: {
              system: true,
              brief: true,
              submission: true,
              payment: true,
              wallet: true,
              invitation: true,
              security: true,
              reward: true,
              winner: true,
              general: true
            }
          }
        });
      }

      return {
        ...preferences,
        categories: typeof preferences.categories === 'string' 
          ? JSON.parse(preferences.categories) 
          : preferences.categories
      };
    } catch (error) {
      console.error('🔔 Error fetching user preferences:', error);
      // Return default preferences on error
      return {
        id: 'default',
        userId,
        userType,
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        categories: {
          system: true,
          brief: true,
          submission: true,
          payment: true,
          wallet: true,
          invitation: true,
          security: true,
          reward: true,
          winner: true,
          general: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateUserPreferences(userId, userType, preferences) {
    try {
      // Use enhanced schema (now that it's available)
      const updated = await prisma.notificationPreferences.upsert({
        where: {
          userId_userType: {
            userId,
            userType
          }
        },
        update: {
          emailNotifications: preferences.emailNotifications,
          pushNotifications: preferences.pushNotifications,
          inAppNotifications: preferences.inAppNotifications,
          categories: JSON.stringify(preferences.categories),
          updatedAt: new Date()
        },
        create: {
          userId,
          userType,
          emailNotifications: preferences.emailNotifications ?? true,
          pushNotifications: preferences.pushNotifications ?? true,
          inAppNotifications: preferences.inAppNotifications ?? true,
          categories: JSON.stringify(preferences.categories ?? {
            system: true,
            brief: true,
            submission: true,
            payment: true,
            wallet: true,
            invitation: true,
            security: true,
            reward: true,
            winner: true,
            general: true
          })
        }
      });

      return {
        ...updated,
        categories: typeof updated.categories === 'string' 
          ? JSON.parse(updated.categories) 
          : updated.categories
      };
    } catch (error) {
      console.error('🔔 Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Log notification delivery attempt
   */
  static async logDelivery(notificationId, deliveryMethod, status, errorMessage = null) {
    try {
      // Use enhanced schema (now that it's available)
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          deliveryMethod,
          status,
          errorMessage,
          deliveredAt: status === 'delivered' ? new Date() : null
        }
      });
    } catch (error) {
      console.error('🔔 Error logging delivery:', error);
    }
  }

  /**
   * Clean up old notifications
   */
  static async cleanupOldNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          OR: [
            {
              AND: [
                { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
                { isRead: true },
                { dismissedAt: { not: null } }
              ]
            },
            {
              expiresAt: { lt: new Date() }
            }
          ]
        }
      });

      console.log(`🔔 Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('🔔 Error cleaning up notifications:', error);
      throw error;
    }
  }

  /**
   * Replace variables in template strings
   */
  static replaceVariables(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  static async createBulkNotifications(notifications) {
    try {
      const results = await Promise.allSettled(
        notifications.map(notification => this.createNotification(notification))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`🔔 Bulk notification creation: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      console.error('🔔 Error in bulk notification creation:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
