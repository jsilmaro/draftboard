import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketplaceNav from './MarketplaceNav';
import CommunityForums from './CommunityForums';
import { useTheme } from '../contexts/ThemeContext';

const CommunityPage: React.FC = () => {
  const [showForums, setShowForums] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <MarketplaceNav />
      
      {/* Premium Header */}
      <motion.div 
        className={`border-b ${isDark ? 'bg-gradient-to-br from-gray-950 to-gray-900 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-accent-green to-accent-green-hover bg-clip-text text-transparent mb-6">
              Community
            </h1>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Connect with fellow creators and brands, share knowledge, and grow together in our vibrant community
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Premium Community Features */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Premium Forums Card */}
          <motion.div 
            className={`rounded-2xl border-2 p-8 transition-all duration-500 ${
              isDark 
                ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 hover:border-accent-green/60 hover:shadow-2xl hover:shadow-accent-green/20' 
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-accent-green/60 hover:shadow-2xl hover:shadow-accent-green/10'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-accent-green to-accent-green-hover rounded-2xl flex items-center justify-center mx-auto mb-6"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 30px rgba(0, 255, 132, 0.4)"
                }}
                transition={{ duration: 0.2 }}
              >
                <img src="/icons/Green_icons/Dashboard1.png" alt="Forums" className="w-10 h-10" />
              </motion.div>
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Forums</h3>
              <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Join discussions, ask questions, and share insights with the community
              </p>
              <motion.button
                onClick={() => setShowForums(true)}
                className="w-full marketplace-button-premium py-3 px-6 text-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Open Forums
              </motion.button>
            </div>
          </motion.div>

          {/* Premium Networking Card */}
          <motion.div 
            className={`rounded-2xl border-2 p-8 transition-all duration-500 ${
              isDark 
                ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-500/20' 
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-500/10'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)"
                }}
                transition={{ duration: 0.2 }}
              >
                <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-10 h-10" />
              </motion.div>
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Networking</h3>
              <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Connect with brands and creators for potential collaborations
              </p>
              <motion.button
                onClick={() => setShowForums(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Networking
              </motion.button>
            </div>
          </motion.div>

          {/* Premium Support Card */}
          <motion.div 
            className={`rounded-2xl border-2 p-8 transition-all duration-500 ${
              isDark 
                ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/20' 
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/10'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 30px rgba(249, 115, 22, 0.4)"
                }}
                transition={{ duration: 0.2 }}
              >
                <img src="/icons/Green_icons/NotificationBell.png" alt="Support" className="w-10 h-10" />
              </motion.div>
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Support</h3>
              <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Get help from the community and platform support team
              </p>
              <motion.button
                onClick={() => setShowForums(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Support
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Premium Community Stats */}
        <motion.div 
          className={`rounded-2xl border-2 p-10 ${isDark ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50' : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <motion.h2 
            className={`text-3xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Community Stats
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "1,200+", label: "Active Members", color: "text-accent-green" },
              { value: "500+", label: "Forum Posts", color: "text-blue-400" },
              { value: "2,000+", label: "Replies", color: "text-purple-400" },
              { value: "95%", label: "Helpful Responses", color: "text-orange-400" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              >
                <motion.div 
                  className={`text-4xl font-bold mb-3 ${stat.color}`}
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Community Forums Modal - READ ONLY for public */}
      <CommunityForums isOpen={showForums} onClose={() => setShowForums(false)} isPublic={true} />
    </div>
  );
};

export default CommunityPage;
