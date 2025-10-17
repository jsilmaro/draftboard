import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import UserSearchModal from './UserSearchModal';

interface User {
  id: string;
  email: string;
  type: string;
}

interface MessageSidebarProps {
  activeTab: 'unread' | 'requests';
  setActiveTab: (tab: 'unread' | 'requests') => void;
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
  user: User;
}

const MessageSidebar: React.FC<MessageSidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedConversation,
  setSelectedConversation,
  user: _user
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Array<{
    id: string;
    name?: string;
    handle?: string;
    lastMessage?: string;
    timestamp?: string;
    unread?: boolean;
    avatar?: string;
    type?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);

  // Fetch conversations from database
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/messages/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);


  // Search conversations
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    return conversation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Create conversation with user
  const createConversation = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participantId: userId })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversationId);
        setShowUserSearchModal(false);
        // Refresh conversations
        window.location.reload();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-accent' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-accent'
            }`}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'unread'
              ? (isDark 
                  ? 'text-accent bg-gray-700 border-b-2 border-accent' 
                  : 'text-accent bg-gray-50 border-b-2 border-accent')
              : (isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? (isDark 
                  ? 'text-accent bg-gray-700 border-b-2 border-accent' 
                  : 'text-accent bg-gray-50 border-b-2 border-accent')
              : (isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
          }`}
        >
          Requests
        </button>
      </div>

      {/* Welcome Message */}
      {!loading && conversations.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-sm"
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to DraftBoard DMs!
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Connect with creators and brands on DraftBoard. Start meaningful conversations!
            </p>
            <button 
              onClick={() => setShowUserSearchModal(true)}
              className="w-full bg-accent text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Search for a user
            </button>
          </motion.div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}

      {/* Conversations List */}
      {!loading && filteredConversations.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              whileHover={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                selectedConversation === conversation.id
                  ? (isDark ? 'bg-gray-700' : 'bg-gray-50')
                  : ''
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  conversation.type === 'creator' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                }`}>
                  {conversation.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {conversation.name}
                    </h4>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {conversation.handle}
                  </p>
                  <p className={`text-sm truncate mt-1 ${
                    conversation.unread 
                      ? (isDark ? 'text-white font-medium' : 'text-gray-900 font-medium')
                      : (isDark ? 'text-gray-400' : 'text-gray-600')
                  }`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearchModal}
        onClose={() => setShowUserSearchModal(false)}
        onUserSelect={createConversation}
      />
    </div>
  );
};

export default MessageSidebar;
