import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import MessageSidebar from './MessageSidebar';
import MessageContent from './MessageContent';

const MessagingSystem: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unread' | 'requests'>('unread');
  const { isDark } = useTheme();
  const { user } = useAuth();

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className={`w-1/3 border-r ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <MessageSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            user={user}
          />
        </div>

        {/* Right Content Area */}
        <div className={`flex-1 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}>
          <MessageContent
            selectedConversation={selectedConversation}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;