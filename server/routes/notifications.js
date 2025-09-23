const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma');

// GET /notifications - Get all notifications for the current user
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd get the user ID from authentication
    // For now, we'll use a placeholder or get from query params
    const userId = req.query.userId || 'default-user';
    const userType = req.query.userType || 'creator';
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        userType: userType
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;

    res.json({
      notifications: notifications,
      stats: {
        total,
        unread,
        urgent
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /notifications/:id - Get a specific notification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 'default-user';
    const userType = req.query.userType || 'creator';
    
    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId,
        userType: userType
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// PATCH /notifications/:id/read - Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 'default-user';
    const userType = req.query.userType || 'creator';
    
    const notification = await prisma.notification.updateMany({
      where: {
        id: id,
        userId: userId,
        userType: userType
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /notifications - Create a new notification (for testing)
router.post('/', async (req, res) => {
  try {
    const { userId, userType, title, message, type, category, priority } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        userId: userId || 'default-user',
        userType: userType || 'creator',
        title,
        message,
        type: type || 'info',
        category: category || 'general',
        priority: priority || 'normal',
        isRead: false
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// POST /notifications/seed - Create sample notifications for testing
router.post('/seed', async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const userType = req.body.userType || 'creator';
    
    const sampleNotifications = [
      {
        userId,
        userType,
        title: 'Welcome to DraftBoard!',
        message: 'Welcome back to your dashboard! We\'re excited to have you on our platform.',
        type: 'success',
        category: 'welcome',
        priority: 'normal',
        isRead: false
      },
      {
        userId,
        userType,
        title: 'New Brief Available',
        message: 'A new brief has been published that matches your interests. Check it out!',
        type: 'info',
        category: 'brief',
        priority: 'high',
        isRead: false
      },
      {
        userId,
        userType,
        title: 'Payment Received',
        message: 'Your payment of $150 has been processed successfully.',
        type: 'success',
        category: 'payment',
        priority: 'normal',
        isRead: false
      },
      {
        userId,
        userType,
        title: 'Submission Deadline Approaching',
        message: 'You have 2 days left to submit your work for the "Creative Campaign" brief.',
        type: 'warning',
        category: 'deadline',
        priority: 'urgent',
        isRead: false
      },
      {
        userId,
        userType,
        title: 'Profile Update Required',
        message: 'Please update your profile information to continue using the platform.',
        type: 'info',
        category: 'profile',
        priority: 'normal',
        isRead: true
      }
    ];

    const createdNotifications = await Promise.all(
      sampleNotifications.map(notification => 
        prisma.notification.create({ data: notification })
      )
    );

    res.status(201).json({
      message: 'Sample notifications created successfully',
      notifications: createdNotifications
    });
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    res.status(500).json({ error: 'Failed to create sample notifications' });
  }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 'default-user';
    const userType = req.query.userType || 'creator';
    
    const notification = await prisma.notification.deleteMany({
      where: {
        id: id,
        userId: userId,
        userType: userType
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
