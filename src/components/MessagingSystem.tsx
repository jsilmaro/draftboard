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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Sidebar - Hidden on mobile when conversation is selected */}
        <div className={`${
          selectedConversation ? 'hidden lg:block' : 'block'
        } w-full lg:w-1/3 border-r transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } min-h-0`}>
          <MessageSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            user={user}
          />
        </div>

        {/* Right Content Area */}
        <div className={`flex-1 transition-colors duration-300 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } ${selectedConversation ? 'block' : 'hidden lg:block'} min-h-0 flex flex-col`}>
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