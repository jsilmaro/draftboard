import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const NotificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/${notificationId}`);
      if (response.ok) {
        const data = await response.json();
        setNotification(data);
        
        // Mark as read when detail page is opened
        if (!data.isRead) {
          await markAsRead(notificationId);
        }
      } else {
        setError('Notification not found');
      }
    } catch (err) {
      setError('Error loading notification');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      // Silently handle error - notification will still be displayed
    }
  };

  useEffect(() => {
    if (id) {
      fetchNotification(id);
    }
  }, [id, fetchNotification]);

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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading notification...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-lg mb-2">Notification Not Found</p>
          <p className="text-gray-400 mb-6">The notification you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => navigate('/notifications')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <div className={`${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r w-64 min-h-screen fixed left-0 top-0 z-40 flex flex-col overflow-y-auto transition-all duration-300 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Detail view</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/notifications')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Notifications</span>
          </button>
          
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
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-30`}>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Details</h1>
                {notification && (
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                      notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                      notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {notification.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      notification.isRead 
                        ? 'bg-gray-500/20 text-gray-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {notification.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm p-8`}>
          {/* Notification Header */}
          <div className="flex items-start space-x-6 mb-8">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-xl flex-shrink-0`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 leading-tight`}>
                {notification.title}
              </h1>
              <div className={`flex items-center space-x-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{formatTimeAgo(notification.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{formatDateTime(notification.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

            {/* Notification Content */}
            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-8`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Description</h2>
              <div className="prose prose-invert max-w-none">
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg leading-relaxed whitespace-pre-wrap`}>
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-8 mt-8`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/notifications')}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    All Notifications
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Back
                  </button>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Notification ID: {notification.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage;
