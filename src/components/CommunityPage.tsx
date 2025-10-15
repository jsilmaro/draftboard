import React, { useState } from 'react';
import MarketplaceNav from './MarketplaceNav';
import CommunityForums from './CommunityForums';
import { useTheme } from '../contexts/ThemeContext';

const CommunityPage: React.FC = () => {
  const [showForums, setShowForums] = useState(true);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <MarketplaceNav />
      
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-gradient-to-r from-gray-900 to-black border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
              Community
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Connect with fellow creators and brands, share knowledge, and grow together in our vibrant community
            </p>
          </div>
        </div>
      </div>

      {/* Community Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Forums Card */}
          <div className={`rounded-lg border p-6 transition-colors ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/Dashboard1.png" alt="Forums" className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Forums</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Join discussions, ask questions, and share insights with the community
              </p>
              <button
                onClick={() => setShowForums(true)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
              >
                Open Forums
              </button>
            </div>
          </div>

          {/* Networking Card */}
          <div className={`rounded-lg border p-6 transition-colors ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Networking</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Connect with brands and creators for potential collaborations
              </p>
              <button
                onClick={() => setShowForums(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
              >
                Start Networking
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className={`rounded-lg border p-6 transition-colors ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/NotificationBell.png" alt="Support" className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Support</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get help from the community and platform support team
              </p>
              <button
                onClick={() => setShowForums(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
              >
                Get Support
              </button>
            </div>
          </div>
        </div>

        {/* Community Stats */}
        <div className={`rounded-lg border p-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">1,200+</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Forum Posts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">2,000+</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Replies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">95%</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Helpful Responses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Forums Modal - READ ONLY for public */}
      <CommunityForums isOpen={showForums} onClose={() => setShowForums(false)} isPublic={true} />
    </div>
  );
};

export default CommunityPage;
