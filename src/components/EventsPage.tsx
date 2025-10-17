import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketplaceNav from './MarketplaceNav';
import EventsWebinars from './EventsWebinars';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from './GlassCard';
import MockClip from './MockClip';

const EventsPage: React.FC = () => {
  const [showEvents, setShowEvents] = useState(false);
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
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent/25 rounded-full"
              animate={{
                x: [0, 60, -60, 0],
                y: [0, -60, 60, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 5 + i * 0.4,
                repeat: Infinity,
                delay: i * 0.2,
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
              <span className="text-accent text-sm font-medium">🎯 New: Interactive live events just launched</span>
            </motion.div>
            
            <h1 className={`text-6xl font-bold mb-6 leading-tight ${
              isDark 
                ? 'bg-gradient-to-r from-white via-green-500 to-white bg-clip-text text-transparent' 
                : 'text-gray-900'
            }`}>
              Events & Webinars – Learn Smarter,<br />
              Network Better, Grow Faster
            </h1>
            <p className={`text-xl mb-12 max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join educational sessions, networking events, and workshops hosted by our community. Learn from experts, connect with peers, and accelerate your creative journey.
            </p>
          </motion.div>
        </div>
        </div>
      </motion.div>

      {/* Event Types */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Webinars Card */}
          <GlassCard delay={0.3} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/Video1.png" alt="Webinars" className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Webinars</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Educational sessions on industry trends and best practices
            </p>
            <div className="text-accent text-sm font-medium">12 upcoming</div>
          </GlassCard>

          {/* Workshops Card */}
          <GlassCard delay={0.4} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/Task1.png" alt="Workshops" className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Workshops</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Hands-on learning sessions with practical exercises
            </p>
            <div className="text-accent text-sm font-medium">8 upcoming</div>
          </GlassCard>

          {/* Networking Card */}
          <GlassCard delay={0.5} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Networking</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Connect with industry professionals and potential collaborators
            </p>
            <div className="text-accent text-sm font-medium">6 upcoming</div>
          </GlassCard>

          {/* Conferences Card */}
          <GlassCard delay={0.6} className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/icons/Green_icons/Dashboard1.png" alt="Conferences" className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Conferences</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Large-scale events with multiple speakers and sessions
            </p>
            <div className="text-accent text-sm font-medium">3 upcoming</div>
          </GlassCard>
        </div>

        {/* Mock Event Video Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Featured Event Mock Clip */}
          <GlassCard className="p-6">
            <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-accent mr-2">🎬</span>
              Featured Event Preview
            </h3>
            {/* TODO: Replace with real featured event data */}
            <MockClip 
              type="video" 
              aspectRatio="16/9"
              label="Creative Masterclass: Advanced Design Techniques"
              className="w-full h-48"
            />
            <div className={`mt-4 flex items-center justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>Live event • 2,500+ registered</span>
              <span>Starts in 2 days</span>
            </div>
          </GlassCard>

          {/* Upcoming Events List */}
          <GlassCard className="p-6">
            <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-accent mr-2">📅</span>
              Upcoming Events
            </h3>
            <div className="space-y-4">
              {/* TODO: Replace with real upcoming events from API */}
              {[
                { title: "Social Media Strategy Workshop", date: "Feb 15", time: "2:00 PM", attendees: 180 },
                { title: "Brand Collaboration Masterclass", date: "Feb 18", time: "10:00 AM", attendees: 95 },
                { title: "Creative Portfolio Review", date: "Feb 22", time: "3:30 PM", attendees: 45 }
              ].map((event, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-dark-card/30 rounded-xl hover:bg-dark-card/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
                      <div className={`flex items-center space-x-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>{event.date}</span>
                        <span>{event.time}</span>
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>
                    <div className="text-accent">→</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Featured Events */}
        <GlassCard className="p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Events</h2>
            <button
              onClick={() => setShowEvents(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
            >
              View All Events
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample Featured Event 1 */}
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/Video1.png" alt="Webinar" className="w-5 h-5" />
                <span className="text-blue-400 text-sm font-medium">Webinar</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Content Creation Masterclass</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Learn advanced techniques for creating engaging content that converts</p>
              <div className="flex justify-between items-center text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Jan 25, 2024</span>
                <span className="text-green-400 font-medium">FREE</span>
              </div>
            </div>

            {/* Sample Featured Event 2 */}
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/Task1.png" alt="Workshop" className="w-5 h-5" />
                <span className="text-green-400 text-sm font-medium">Workshop</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Brand-Creator Collaboration Workshop</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Master the art of successful brand-creator partnerships</p>
              <div className="flex justify-between items-center text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Feb 2, 2024</span>
                <span className="text-yellow-400 font-medium">$25</span>
              </div>
            </div>

            {/* Sample Featured Event 3 */}
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-5 h-5" />
                <span className="text-purple-400 text-sm font-medium">Networking</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Creative Industry Mixer</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connect with fellow creators and industry professionals</p>
              <div className="flex justify-between items-center text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Feb 8, 2024</span>
                <span className="text-green-400 font-medium">FREE</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Event Categories */}
        <div className={`rounded-lg border p-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Event Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Education', icon: '/icons/Green_icons/Dashboard1.png', count: '15 events' },
              { name: 'Networking', icon: '/icons/Green_icons/UserProfile1.png', count: '8 events' },
              { name: 'Business', icon: '/icons/Green_icons/Brief1.png', count: '12 events' },
              { name: 'Creative', icon: '/icons/Green_icons/Campaign1.png', count: '10 events' },
              { name: 'Technical', icon: '/icons/Green_icons/Task1.png', count: '6 events' }
            ].map((category, index) => (
              <div key={index} className={`text-center p-4 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <img src={category.icon} alt={category.name} className="w-8 h-8 mx-auto mb-2" />
                <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{category.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events Modal - READ ONLY for public */}
      <EventsWebinars isOpen={showEvents} onClose={() => setShowEvents(false)} isPublic={true} />
    </div>
  );
};

export default EventsPage;
