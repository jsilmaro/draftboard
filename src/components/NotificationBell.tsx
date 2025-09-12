import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    return true;
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

  const handleNotificationClick = (notificationId: string) => {
    navigate(`/notifications/${notificationId}`);
    setIsOpen(false); // Close the dropdown
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setIsOpen(false); // Close the dropdown
  };

  const getNotificationIcon = (category: string, priority: string) => {
    const getIconColor = (category: string, priority: string) => {
      if (priority === 'urgent') return '#e53e3e';
      if (priority === 'high') return '#f6ad55';
      if (priority === 'low') return '#3182ce';
      
      switch (category) {
        case 'payment': return '#2b9875';
        case 'wallet': return '#3182ce';
        case 'submission': return '#9333ea';
        case 'brief': return '#f6ad55';
        case 'winner': return '#f6ad55';
        case 'invitation': return '#ec4899';
        case 'security': return '#e53e3e';
        case 'reward': return '#6366f1';
        case 'system': return '#6b7280';
        default: return '#3182ce';
      }
    };

    const getIconSVG = (category: string) => {
      const color = getIconColor(category, priority);
      
      switch (category) {
        case 'payment':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'wallet':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v3m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18 0V3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 3v3" />
            </svg>
          );
        case 'submission':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          );
        case 'brief':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2 2 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          );
        case 'winner':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M15.75 4.5c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M15.75 4.5l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 4.5l3 3m-3-3l-3 3" />
            </svg>
          );
        case 'invitation':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          );
        case 'security':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          );
        case 'reward':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m-3.375.375a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
            </svg>
          );
        case 'system':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 0a1.5 1.5 0 013 0m-3 0a1.5 1.5 0 00-3 0m0 0h3.75m-9 0h9.75m0 0a1.5 1.5 0 013 0m-3 0a1.5 1.5 0 00-3 0m0 0h3.75m-9 0h9.75m0 0a1.5 1.5 0 013 0m-3 0a1.5 1.5 0 00-3 0m0 0h3.75" />
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

    return getIconSVG(category);
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
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                {stats.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {stats.unread} unread
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateTestNotification}
                  className="text-sm text-green-400 hover:text-green-300 p-1 rounded"
                  title="Create test notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-sm text-gray-400 hover:text-gray-300 p-1 rounded"
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
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-4 border-b border-gray-700">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'unread', label: 'Unread', count: stats.unread }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`pb-2 text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                    activeFilter === filter.key
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-400">Error loading notifications: {error}</p>
                <button 
                  onClick={() => fetchNotifications()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              <div className="p-3">
                {filteredNotifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className="w-full mb-3 last:mb-0"
                  >
                    <div
                      className="cursor-pointer flex items-center justify-between w-full min-h-[60px] rounded-lg bg-[#232531] px-3 py-2 hover:bg-[#2a2e3a] transition-colors duration-200"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="bg-white/5 backdrop-blur-xl p-2 rounded-lg flex-shrink-0">
                          {getNotificationIcon(notification.category, notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium leading-tight mb-1">{notification.title}</p>
                          <p className="text-gray-500 text-xs leading-relaxed mb-1">{notification.message}</p>
                          <p className="text-gray-400 text-xs">{formatTimeAgo(notification.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="text-gray-600 hover:text-white hover:bg-white/10 p-2 rounded-md transition-all duration-200 flex-shrink-0 ml-2"
                        title="Dismiss notification"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
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
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll notify you about payments, applications, and updates
                </p>
              </div>
            )}
          </div>

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <h4 className="text-sm font-medium text-white mb-3">Notification Preferences</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      inAppNotifications: e.target.checked
                    })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-400 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">In-app notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      emailNotifications: e.target.checked
                    })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-400 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      pushNotifications: e.target.checked
                    })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-400 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">Push notifications</span>
                </label>
              </div>
            </div>
          )}

          {filteredNotifications && filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleViewAllNotifications}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  View all notifications
                </button>
                <button
                  onClick={() => dismiss()}
                  className="text-sm text-gray-400 hover:text-gray-300 font-medium"
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
