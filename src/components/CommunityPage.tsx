import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketplaceNav from './MarketplaceNav';
import CommunityForums from './CommunityForums';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from './GlassCard';
import MockClip from './MockClip';

const CommunityPage: React.FC = () => {
  const [showForums, setShowForums] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <MarketplaceNav />
      
      {/* Tripzy-inspired Header */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent/20 rounded-full"
              animate={{
                x: [0, 80, -80, 0],
                y: [0, -80, 80, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 6 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        <div className={`relative backdrop-blur-md border-b ${
          isDark 
            ? 'bg-gray-900/40 border-gray-800/50' 
            : 'bg-white/60 border-gray-200/50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* New feature banner */}
            <motion.div 
              className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="text-accent text-sm font-medium">🎉 New: Live community discussions just launched</span>
            </motion.div>
            <h1 className={`text-6xl font-bold mb-6 leading-tight ${
              isDark 
                ? 'bg-gradient-to-r from-white via-green-500 to-white bg-clip-text text-transparent' 
                : 'text-gray-900'
            }`}>
              Community Hub – Connect Smarter,<br />
              Collaborate Better, Grow Together
            </h1>
            <p className={`text-xl mb-12 max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Connect, collaborate, and grow with fellow creators and brands. Share insights, get feedback, and build lasting professional relationships in our vibrant community.
            </p>
          </motion.div>
        </div>
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
          {/* Forums Card */}
          <GlassCard delay={0.4} className="p-8 text-center">
            <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <img src="/icons/Green_icons/Dashboard1.png" alt="Forums" className="w-10 h-10" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Forums</h3>
            <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Join discussions, ask questions, and share insights with the community
            </p>
            <motion.button
              onClick={() => setShowForums(true)}
              className="w-full bg-accent text-black py-3 px-6 text-lg font-semibold rounded-xl hover:bg-accent/90 transition-all duration-300 shadow-glow hover:shadow-glow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Forums
            </motion.button>
          </GlassCard>

          {/* Networking Card */}
          <GlassCard delay={0.5} className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-10 h-10" />
            </div>
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
          </GlassCard>

          {/* Support Card */}
          <GlassCard delay={0.6} className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <img src="/icons/Green_icons/NotificationBell.png" alt="Support" className="w-10 h-10" />
            </div>
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
          </GlassCard>
        </div>

        {/* Mock Community Activity */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Trending Discussions */}
          <GlassCard className="p-6">
            <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-accent mr-2">🔥</span>
              Trending Discussions
            </h3>
            <div className="space-y-4">
              {/* TODO: Replace with real forum discussions from API */}
              {[
                { title: "Best practices for social media campaigns", author: "Sarah Chen", replies: 23, time: "2h ago" },
                { title: "How to price your creative services", author: "Mike Rodriguez", replies: 18, time: "4h ago" },
                { title: "Building long-term brand relationships", author: "Emma Thompson", replies: 15, time: "6h ago" }
              ].map((discussion, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-dark-card/30 rounded-xl hover:bg-dark-card/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                >
                  <h4 className={`font-medium mb-2 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{discussion.title}</h4>
                  <div className={`flex items-center justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>by {discussion.author}</span>
                    <div className="flex items-center space-x-3">
                      <span>{discussion.replies} replies</span>
                      <span>{discussion.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Community Mock Clip */}
          <GlassCard className="p-6">
            <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-accent mr-2">🎥</span>
              Community Spotlight
            </h3>
            {/* TODO: Replace with real live community session data */}
            <MockClip 
              type="video" 
              aspectRatio="16/9"
              label="Live community discussion: Creative collaboration tips"
              className="w-full h-48"
            />
            <div className={`mt-4 flex items-center justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>Live discussion with 127 participants</span>
              <span>2h 15m duration</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Community Stats */}
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
