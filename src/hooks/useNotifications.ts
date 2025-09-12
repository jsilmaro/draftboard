import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  payment?: number;
  security?: number;
  categoryCounts?: Record<string, number>;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: Record<string, boolean>;
}

interface NotificationFilters {
  category?: string;
  priority?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
  includeDismissed?: boolean;
}

const useNotifications = (pollingInterval = 60000) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    urgent: 0
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    inAppNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    categories: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications with filters
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) {
        setNotifications([]);
        setStats({ total: 0, unread: 0, urgent: 0 });
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('userId', user.id);
      queryParams.append('userType', user.type);
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.isRead !== undefined) queryParams.append('isRead', filters.isRead.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
      if (filters.includeDismissed) queryParams.append('includeDismissed', filters.includeDismissed.toString());

      const response = await fetch(`/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Update stats if provided
      if (data.stats) {
        setStats(data.stats);
      }
      
      lastFetchRef.current = Date.now();
      
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Fetch notification statistics (calculated from notifications)
  const fetchStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    
    setStats({
      total,
      unread,
      urgent
    });
  }, [notifications]);

  // Fetch user preferences (using default for now)
  const fetchPreferences = useCallback(async () => {
    // For now, just use default preferences
    setPreferences({
      email: true,
      push: true,
      inApp: true,
      inAppNotifications: true,
      emailNotifications: true,
      pushNotifications: true,
      categories: {}
    });
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[] | null = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) return false;

      if (notificationIds && notificationIds.length > 0) {
        // Mark specific notifications as read
        const promises = notificationIds.map(id => 
          fetch(`/api/notifications/${id}/read?userId=${user.id}&userType=${user.type}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
        );
        
        await Promise.all(promises);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds 
            ? (notificationIds.includes(notification.id) ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification)
            : { ...notification, isRead: true, readAt: new Date().toISOString() }
        )
      );
      
      // Refresh stats
      fetchStats();
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }, [fetchStats, user, isAuthenticated]);

  // Dismiss notifications
  const dismiss = useCallback(async (notificationIds: string[] | null = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) return false;

      if (notificationIds && notificationIds.length > 0) {
        // Delete specific notifications
        const promises = notificationIds.map(id => 
          fetch(`/api/notifications/${id}?userId=${user.id}&userType=${user.type}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        );
        
        await Promise.all(promises);
      }

      // Update local state
      setNotifications(prev => 
        prev.filter(notification => 
          notificationIds 
            ? !notificationIds.includes(notification.id)
            : false
        )
      );
      
      // Refresh stats
      fetchStats();
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error dismissing notifications:', error);
      return false;
    }
  }, [fetchStats, user, isAuthenticated]);

  // Update preferences (local only for now)
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, []);

  // Create test notification
  const createTestNotification = useCallback(async (notificationData: Partial<Notification>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) return false;

      const response = await fetch('/api/notifications/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          userType: user.type,
          ...notificationData
        })
      });

      if (response.ok) {
        // Refresh notifications and stats
        await fetchNotifications();
        return true;
      }
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating test notification:', error);
      return false;
    }
  }, [fetchNotifications, user, isAuthenticated]);

  // Start polling for real-time updates
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      // Only poll if we have a token and user is authenticated
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) return;
      
      const now = Date.now();
      if (lastFetchRef.current && (now - lastFetchRef.current) < 10000) return;

      try {
        // Only fetch notifications during polling to reduce load
        await fetchNotifications();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during polling:', error);
      }
    }, pollingInterval);
  }, [pollingInterval, fetchNotifications, user, isAuthenticated]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user || !isAuthenticated) return;

      try {
        await Promise.all([
          fetchNotifications(),
          fetchPreferences()
        ]);
        startPolling();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing notifications:', error);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      stopPolling();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchNotifications, fetchPreferences, startPolling, stopPolling, user, isAuthenticated]);

  // Update stats when notifications change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling]);

  // Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during debounced refresh:', error);
      }
    }, 500); // 500ms debounce
  }, [fetchNotifications]);

  return {
    notifications,
    stats,
    preferences,
    loading,
    error,
    fetchNotifications,
    fetchStats,
    fetchPreferences,
    markAsRead,
    dismiss,
    updatePreferences,
    createTestNotification,
    startPolling,
    stopPolling,
    refresh: debouncedRefresh
  };
};

export default useNotifications;
