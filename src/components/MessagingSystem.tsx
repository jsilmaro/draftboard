import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  isRead: boolean;
}

interface User {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  type: 'brand' | 'creator';
  avatar?: string;
}

interface Conversation {
  id: string;
  participant1: {
    id: string;
    name: string;
    type: 'brand' | 'creator';
    avatar?: string;
  };
  participant2: {
    id: string;
    name: string;
    type: 'brand' | 'creator';
    avatar?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  briefId?: string;
  briefTitle?: string;
}

interface MessagingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
  embedded?: boolean;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  isOpen, 
  onClose, 
  initialConversationId,
  embedded = false
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStartChat, setShowStartChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Error marking messages as read - could implement proper error handling here
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Mark messages as read
        markMessagesAsRead(conversationId);
      }
    } catch (error) {
      // Error fetching messages - could implement proper error handling here
    } finally {
      setIsLoading(false);
    }
  }, [markMessagesAsRead]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    if (initialConversationId) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [initialConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      // Error fetching conversations - could implement proper error handling here
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/messages/available-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      // Error fetching available users - could implement proper error handling here
    }
  };

  const startNewConversation = async () => {
    if (!selectedUser || !initialMessage.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          initialMessage: initialMessage.trim()
        })
      });

      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setShowStartChat(false);
        setSelectedUser(null);
        setInitialMessage('');
        setSearchQuery('');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to start conversation'}`);
      }
    } catch (error) {
      // Error starting conversation - could implement proper error handling here
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      conversationId: selectedConversation.id,
      content: newMessage.trim(),
      type: 'text'
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation.id);
        fetchConversations(); // Refresh conversations to update last message
      }
    } catch (error) {
      // Error sending message - could implement proper error handling here
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', selectedConversation.id);

    try {
      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      // Error uploading file - could implement proper error handling here
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant1.id === user?.id ? conversation.participant2 : conversation.participant1;
  };

  if (!isOpen) return null;

  const containerClass = embedded 
    ? "w-full h-full flex" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  
  const contentClass = embedded
    ? "bg-gray-900 w-full h-full flex"
    : "bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-white">Messages</h2>
              {!embedded && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setShowStartChat(true);
                fetchAvailableUsers();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all font-medium"
            >
              + Start New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${
                    selectedConversation?.id === conversation.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {otherParticipant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-white font-medium truncate">
                          {otherParticipant.name}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">
                        {conversation.briefTitle && (
                          <span className="text-blue-400">📋 {conversation.briefTitle}</span>
                        )}
                      </p>
                      {conversation.lastMessage && (
                        <p className={`text-xs truncate ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage.type === 'file' 
                            ? `📎 ${conversation.lastMessage.fileName}`
                            : conversation.lastMessage.content
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getOtherParticipant(selectedConversation).name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {getOtherParticipant(selectedConversation).name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {getOtherParticipant(selectedConversation).type === 'brand' ? '🏢 Brand' : '👤 Creator'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-gray-400">Loading messages...</div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {message.type === 'file' ? (
                          <div>
                            <div className="flex items-center space-x-2">
                              <span>📎</span>
                              <span className="font-medium">{message.fileName}</span>
                            </div>
                            <p className="text-xs opacity-75 mt-1">
                              {formatFileSize(message.fileSize || 0)}
                            </p>
                            {message.fileUrl && (
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-blue-200 text-sm underline"
                              >
                                Download
                              </a>
                            )}
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Attach file"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Chat Modal */}
      {showStartChat && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Start New Chat</h3>
                <button
                  onClick={() => {
                    setShowStartChat(false);
                    setSelectedUser(null);
                    setInitialMessage('');
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search Users */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Available Users List */}
              <div className="mb-4 max-h-48 overflow-y-auto">
                {availableUsers
                  .filter(availableUser => 
                    availableUser.id !== user?.id && 
                    (availableUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     availableUser.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((availableUser) => (
                    <div
                      key={availableUser.id}
                      onClick={() => setSelectedUser(availableUser)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === availableUser.id 
                          ? 'bg-green-600/20 border border-green-500' 
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {availableUser.fullName?.charAt(0).toUpperCase() || availableUser.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{availableUser.fullName || 'Unknown'}</p>
                          <p className="text-gray-400 text-sm">{availableUser.email}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            availableUser.type === 'brand' 
                              ? 'bg-blue-900/20 text-blue-400' 
                              : 'bg-purple-900/20 text-purple-400'
                          }`}>
                            {availableUser.type === 'brand' ? 'Brand' : 'Creator'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Initial Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Message
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your first message..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>


              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowStartChat(false);
                    setSelectedUser(null);
                    setInitialMessage('');
                    setSearchQuery('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startNewConversation}
                  disabled={!selectedUser || !initialMessage.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Starting...' : 'Start Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
