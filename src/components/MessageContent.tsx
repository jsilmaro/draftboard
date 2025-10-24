import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  type: string;
}

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  type: string;
}

interface ConversationInfo {
  participantName?: string;
  participantHandle?: string;
  participantType?: string;
}

interface MessageContentProps {
  selectedConversation: string | null;
  user: User;
}

const MessageContent: React.FC<MessageContentProps> = ({
  selectedConversation,
  user: _user
}) => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        setConversationInfo(null);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`/api/messages/conversations/${selectedConversation}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setConversationInfo(data.conversationInfo);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/messages/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Select a message
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Choose from your existing conversations, start a new one, or just keep swimming.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      } flex-shrink-0`}>
        {conversationInfo && (
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white ${
              conversationInfo.participantType === 'creator' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}>
              {conversationInfo.participantName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {conversationInfo.participantName || 'Unknown User'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {conversationInfo.participantHandle || '@unknown'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}

      {/* Messages */}
      {!loading && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                message.senderId === currentUser?.id ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {message.senderId !== currentUser?.id && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 ${
                    conversationInfo?.participantType === 'creator' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}>
                    {conversationInfo?.participantName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className={`px-4 py-2 rounded-2xl ${
                  message.senderId === currentUser?.id
                    ? 'bg-accent text-black'
                    : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === currentUser?.id
                      ? 'text-gray-600' 
                      : (isDark ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.senderId === currentUser?.id && (
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className={`p-4 border-t transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      } flex-shrink-0`}>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-accent' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-accent'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-full transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-accent text-black hover:bg-accent/90'
                : (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageContent;
