import { useState, useEffect, useCallback, useRef } from 'react';

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
      if (!token) {
        setNotifications([]);
        setStats({ total: 0, unread: 0, urgent: 0 });
        return;
      }

      const queryParams = new URLSearchParams();
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
  }, []);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notification stats:', error);
    }
  }, []);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notification preferences:', error);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[] | null = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds 
              ? (notificationIds.includes(notification.id) ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification)
              : { ...notification, isRead: true, readAt: new Date().toISOString() }
          )
        );
        
        // Refresh stats
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }, [fetchStats]);

  // Dismiss notifications
  const dismiss = useCallback(async (notificationIds: string[] | null = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => 
            notificationIds 
              ? !notificationIds.includes(notification.id)
              : false
          )
        );
        
        // Refresh stats
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error dismissing notifications:', error);
      return false;
    }
  }, [fetchStats]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        return true;
      }
      return false;
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
      if (!token) return false;

      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      if (response.ok) {
        // Refresh notifications and stats
        await Promise.all([fetchNotifications(), fetchStats()]);
        return true;
      }
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating test notification:', error);
      return false;
    }
  }, [fetchNotifications, fetchStats]);

  // Start polling for real-time updates
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      // Only poll if we have a token and it's been at least 10 seconds since last fetch
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const now = Date.now();
      if (lastFetchRef.current && (now - lastFetchRef.current) < 10000) return;

      try {
        // Only fetch stats during polling to reduce load
        await fetchStats();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during polling:', error);
      }
    }, pollingInterval);
  }, [pollingInterval, fetchStats]);

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
      if (!token) return;

      try {
        await Promise.all([
          fetchNotifications(),
          fetchStats(),
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
  }, [fetchNotifications, fetchStats, fetchPreferences, startPolling, stopPolling]);

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
        await Promise.all([fetchNotifications(), fetchStats()]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during debounced refresh:', error);
      }
    }, 500); // 500ms debounce
  }, [fetchNotifications, fetchStats]);

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
