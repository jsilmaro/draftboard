import React, { useState, useEffect } from 'react';
import useNotifications from '../hooks/useNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  dismissedAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  
  const {
    notifications,
    stats,
    preferences,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    dismiss,
    updatePreferences,
    createTestNotification
  } = useNotifications();

  // Refresh notifications when dropdown opens (only if not recently fetched)
  useEffect(() => {
    if (isOpen && !loading) {
      // Only refresh if we don't have notifications or they're stale
      if (notifications.length === 0) {
        fetchNotifications();
      }
    }
  }, [isOpen, loading, notifications.length, fetchNotifications]);

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.isRead;
    if (activeFilter === 'urgent') return notification.priority === 'urgent';
    return notification.category === activeFilter;
  });

  // Debug logging
  // Debug logging removed for production
  // useEffect(() => {
  //   console.log('NotificationBell Debug:', {
  //     loading,
  //     error,
  //     notificationsCount: notifications.length,
  //     filteredCount: filteredNotifications.length,
  //     stats,
  //     isOpen
  //   });
  // }, [loading, error, notifications.length, filteredNotifications.length, stats, isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
  };

  const handleDismiss = async (notificationId: string) => {
    await dismiss([notificationId]);
  };

  const handleCreateTestNotification = async () => {
    await createTestNotification({
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      type: 'system',
      category: 'system',
      priority: 'normal'
    });
  };

  const getNotificationIcon = (category: string, priority: string) => {
    const getIconColor = (category: string, priority: string) => {
      if (priority === 'urgent') return 'bg-red-500';
      if (priority === 'high') return 'bg-orange-500';
      if (priority === 'low') return 'bg-gray-400';
      
      switch (category) {
        case 'payment': return 'bg-green-500';
        case 'wallet': return 'bg-blue-500';
        case 'submission': return 'bg-purple-500';
        case 'brief': return 'bg-orange-500';
        case 'winner': return 'bg-yellow-500';
        case 'invitation': return 'bg-pink-500';
        case 'security': return 'bg-red-500';
        case 'reward': return 'bg-indigo-500';
        case 'system': return 'bg-gray-500';
        default: return 'bg-gray-400';
      }
    };

    const getIconSymbol = (category: string) => {
      switch (category) {
        case 'payment': return '💰';
        case 'wallet': return '💳';
        case 'submission': return '📝';
        case 'brief': return '📋';
        case 'winner': return '🏆';
        case 'invitation': return '📧';
        case 'security': return '🔒';
        case 'reward': return '🎁';
        case 'system': return '⚙️';
        default: return '🔔';
      }
    };

    return (
      <div className={`w-10 h-10 ${getIconColor(category, priority)} rounded-full flex items-center justify-center`}>
        <span className="text-white text-lg">{getIconSymbol(category)}</span>
      </div>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Force fetch notifications when opening
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      >
        <img src="/icons/Green_icons/NotificationBell.png" alt="Notifications" className="w-10 h-10 drop-shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'}} />
        
        {/* Unread Badge */}
        {stats.unread > 0 && (
          <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${
            stats.urgent > 0 ? 'bg-red-500 animate-pulse' : 'bg-red-500'
          }`}>
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {stats.unread > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {stats.unread} unread
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateTestNotification}
                  className="text-sm text-green-600 hover:text-green-800 p-1 rounded"
                  title="Create test notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-sm text-gray-600 hover:text-gray-800 p-1 rounded"
                  title="Notification preferences"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {stats.unread > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'unread', label: 'Unread', count: stats.unread },
                { key: 'urgent', label: 'Urgent', count: stats.urgent },
                { key: 'payment', label: 'Payments', count: 0 },
                { key: 'submission', label: 'Submissions', count: 0 }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`pb-2 text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                    activeFilter === filter.key
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600">Error loading notifications: {error}</p>
                <button 
                  onClick={() => fetchNotifications()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
                      !notification.isRead ? 'bg-blue-50' : 'bg-white'
                    } ${notification.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.category, notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                              <div className="flex items-center space-x-2">
                                {notification.priority === 'urgent' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    Urgent
                                  </span>
                                )}
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Dismiss"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            {notification.actionUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notification.actionUrl, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                {notification.actionText || 'View'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 5.5L9 10l-4.5 4.5L1 10l3.5-4.5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll notify you about payments, applications, and updates
                </p>
              </div>
            )}
          </div>

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      inAppNotifications: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">In-app notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      emailNotifications: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      pushNotifications: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                </label>
              </div>
            </div>
          )}

          {filteredNotifications && filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {/* Navigate to full notifications page */}}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
                <button
                  onClick={() => dismiss()}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Dismiss all
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
