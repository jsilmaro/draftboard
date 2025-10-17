import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketplaceNav from './MarketplaceNav';
import SuccessStories from './SuccessStories';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from './GlassCard';

const SuccessStoriesPage: React.FC = () => {
  const [showStories, setShowStories] = useState(false);
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
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent/30 rounded-full"
              animate={{
                x: [0, 70, -70, 0],
                y: [0, -70, 70, 0],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 7 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.15,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              <span className="text-accent text-sm font-medium">🏆 New: Success story video testimonials just launched</span>
            </motion.div>
            
            <h1 className={`text-6xl font-bold mb-6 leading-tight ${
              isDark 
                ? 'bg-gradient-to-r from-white via-green-500 to-white bg-clip-text text-transparent' 
                : 'text-gray-900'
            }`}>
              Success Stories – Win Smarter,<br />
              Achieve Better, Inspire Others
            </h1>
            <p className={`text-xl mb-12 max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Discover amazing collaborations between brands and creators, and see the incredible results they achieved together. Get inspired by real success stories and learn from the best.
            </p>
          </motion.div>
        </div>
        </div>
      </motion.div>

      {/* Success Story Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Creative Success */}
          <GlassCard delay={0.3} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/Campaign1.png" alt="Creative" className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Creative Projects</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Stunning visual campaigns, social media content, and creative collaborations
            </p>
            <div className="text-accent text-sm font-medium mb-4">45+ Success Stories</div>
            <button
              onClick={() => setShowStories(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              View Creative Stories
            </button>
          </GlassCard>

          {/* Technical Success */}
          <GlassCard delay={0.4} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/Dashboard1.png" alt="Technical" className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Technical Projects</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              App development, website creation, and technical solution implementations
            </p>
            <div className="text-accent text-sm font-medium mb-4">28+ Success Stories</div>
            <button
              onClick={() => setShowStories(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all"
            >
              View Technical Stories
            </button>
          </GlassCard>

          {/* Business Success */}
          <div className={`rounded-lg border p-6 transition-colors ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/Brief1.png" alt="Business" className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Business Projects</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Marketing strategies, business consulting, and growth-focused collaborations
              </p>
              <div className="text-green-400 text-sm font-medium mb-4">32+ Success Stories</div>
              <button
                onClick={() => setShowStories(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                View Business Stories
              </button>
            </div>
          </div>
        </div>

        {/* Featured Success Stories */}
        <div className={`rounded-lg border p-8 mb-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Success Stories</h2>
            <button
              onClick={() => setShowStories(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
            >
              View All Stories
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample Featured Story 1 */}
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <img src="/icons/Green_icons/Campaign1.png" alt="Creative" className="w-12 h-12" />
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <img src="/icons/Green_icons/Campaign1.png" alt="Creative" className="w-5 h-5" />
                  <span className="text-purple-400 text-sm">Creative</span>
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Viral Social Media Campaign</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>A creative campaign that reached 2M+ people and generated 500% ROI</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-400 font-bold">$15,000</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>2 weeks</span>
                </div>
              </div>
            </div>

            {/* Sample Featured Story 2 */}
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-4xl">⚙️</span>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-400 text-lg">⚙️</span>
                  <span className="text-blue-400 text-sm">Technical</span>
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>E-commerce Platform Development</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Complete platform build that increased sales by 300% in 3 months</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-400 font-bold">$25,000</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>6 weeks</span>
                </div>
              </div>
            </div>

            {/* Sample Featured Story 3 */}
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <img src="/icons/Green_icons/Brief1.png" alt="Business" className="w-12 h-12" />
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <img src="/icons/Green_icons/Brief1.png" alt="Business" className="w-5 h-5" />
                  <span className="text-green-400 text-sm">Business</span>
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Marketing Strategy Overhaul</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Complete marketing transformation that doubled customer acquisition</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-400 font-bold">$12,000</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>4 weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className={`rounded-lg border p-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Success Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">105+</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Success Stories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">$2.5M+</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Project Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">98%</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">250%</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Average ROI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Modal */}
      {/* Success Stories Modal - READ ONLY for public */}
      <SuccessStories isOpen={showStories} onClose={() => setShowStories(false)} isPublic={true} />
    </div>
  );
};

export default SuccessStoriesPage;
