import React, { useState } from 'react';
import MarketplaceNav from './MarketplaceNav';
import EventsWebinars from './EventsWebinars';

const EventsPage: React.FC = () => {
  const [showEvents, setShowEvents] = useState(true);

  return (
    <div className="min-h-screen bg-black text-white">
      <MarketplaceNav />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
              Events & Webinars
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join educational sessions, networking events, and workshops hosted by our community
            </p>
          </div>
        </div>
      </div>

      {/* Event Types */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Webinars Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/Video1.png" alt="Webinars" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Webinars</h3>
              <p className="text-gray-400 text-sm mb-4">
                Educational sessions on industry trends and best practices
              </p>
              <div className="text-blue-400 text-sm font-medium">12 upcoming</div>
            </div>
          </div>

          {/* Workshops Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/Task1.png" alt="Workshops" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Workshops</h3>
              <p className="text-gray-400 text-sm mb-4">
                Hands-on learning sessions with practical exercises
              </p>
              <div className="text-green-400 text-sm font-medium">8 upcoming</div>
            </div>
          </div>

          {/* Networking Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Networking</h3>
              <p className="text-gray-400 text-sm mb-4">
                Connect with industry professionals and potential collaborators
              </p>
              <div className="text-purple-400 text-sm font-medium">6 upcoming</div>
            </div>
          </div>

          {/* Conferences Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/icons/Green_icons/Dashboard1.png" alt="Conferences" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Conferences</h3>
              <p className="text-gray-400 text-sm mb-4">
                Large-scale events with multiple speakers and sessions
              </p>
              <div className="text-orange-400 text-sm font-medium">3 upcoming</div>
            </div>
          </div>
        </div>

        {/* Featured Events */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Featured Events</h2>
            <button
              onClick={() => setShowEvents(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
            >
              View All Events
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample Featured Event 1 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/Video1.png" alt="Webinar" className="w-5 h-5" />
                <span className="text-blue-400 text-sm font-medium">Webinar</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Content Creation Masterclass</h3>
              <p className="text-gray-400 text-sm mb-4">Learn advanced techniques for creating engaging content that converts</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Jan 25, 2024</span>
                <span className="text-green-400 font-medium">FREE</span>
              </div>
            </div>

            {/* Sample Featured Event 2 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/Task1.png" alt="Workshop" className="w-5 h-5" />
                <span className="text-green-400 text-sm font-medium">Workshop</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Brand-Creator Collaboration Workshop</h3>
              <p className="text-gray-400 text-sm mb-4">Master the art of successful brand-creator partnerships</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Feb 2, 2024</span>
                <span className="text-yellow-400 font-medium">$25</span>
              </div>
            </div>

            {/* Sample Featured Event 3 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <img src="/icons/Green_icons/UserProfile1.png" alt="Networking" className="w-5 h-5" />
                <span className="text-purple-400 text-sm font-medium">Networking</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">Featured</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Creative Industry Mixer</h3>
              <p className="text-gray-400 text-sm mb-4">Connect with fellow creators and industry professionals</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Feb 8, 2024</span>
                <span className="text-green-400 font-medium">FREE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Categories */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Event Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Education', icon: '/icons/Green_icons/Dashboard1.png', count: '15 events' },
              { name: 'Networking', icon: '/icons/Green_icons/UserProfile1.png', count: '8 events' },
              { name: 'Business', icon: '/icons/Green_icons/Brief1.png', count: '12 events' },
              { name: 'Creative', icon: '/icons/Green_icons/Campaign1.png', count: '10 events' },
              { name: 'Technical', icon: '/icons/Green_icons/Task1.png', count: '6 events' }
            ].map((category, index) => (
              <div key={index} className="text-center p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <img src={category.icon} alt={category.name} className="w-8 h-8 mx-auto mb-2" />
                <div className="text-white font-medium mb-1">{category.name}</div>
                <div className="text-gray-400 text-sm">{category.count}</div>
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
