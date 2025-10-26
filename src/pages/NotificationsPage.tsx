import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface Notification {
  id: string;
  userId: string;
  userType: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load notifications');
        setNotifications([]);
      }
    } catch (err) {
      setError('Error loading notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#2b9875';
      case 'error':
        return '#e53e3e';
      case 'warning':
        return '#f6ad55';
      case 'info':
        return '#3182ce';
      default:
        return '#3182ce';
    }
  };

  const getIcon = (type: string) => {
    const color = getIconColor(type);
    
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        );
    }
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

  const filteredNotifications = Array.isArray(notifications) ? notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  }) : [];

  const handleNotificationClick = (notification: Notification) => {
    // If notification has actionUrl, redirect there, otherwise go to detail page
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate(`/notifications/${notification.id}`);
    }
    
    // Mark as read if not already
    if (!notification.isRead) {
      fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Silently handle error
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar - Hidden on mobile, full screen on desktop */}
      <div className={`hidden lg:flex ${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r w-64 min-h-screen fixed left-0 top-0 z-40 flex-col overflow-y-auto transition-all duration-300 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stay updated</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/creator/dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/brand/dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">Brand Dashboard</span>
          </button>
        </div>

        {/* Account Navigation */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 w-full">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-30`}>
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Array.isArray(notifications) ? notifications.length : 0} total notifications
                </span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <ThemeToggle size="md" />
                <button
                  onClick={() => navigate(-1)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto ${
                    isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Filter Tabs */}
          <div className="mb-6 sm:mb-8">
            <div className={`flex flex-wrap gap-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} p-1 rounded-xl w-full sm:w-fit`}>
              {[
                { key: 'all', label: 'All', count: Array.isArray(notifications) ? notifications.length : 0 },
                { key: 'unread', label: 'Unread', count: Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0 },
                { key: 'read', label: 'Read', count: Array.isArray(notifications) ? notifications.filter(n => n.isRead).length : 0 }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'unread' | 'read')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    filter === tab.key
                      ? isDark
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 5.5L9 10l-4.5 4.5L1 10l3.5-4.5z" />
                  </svg>
                </div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>No notifications found</p>
                <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-sm mt-2`}>
                  {filter === 'all' 
                    ? "You don't have any notifications yet"
                    : `No ${filter} notifications`
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    !notification.isRead ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <div className={`w-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-200`}>
                    <div
                      className={`cursor-default flex items-center justify-between w-full min-h-[80px] rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} px-4 py-3 transition-colors duration-200`}
                    >
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg flex-shrink-0`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} text-base sm:text-lg font-medium leading-tight mb-2 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                                  notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                                  notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {notification.type}
                                </span>
                                <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
