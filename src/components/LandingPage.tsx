import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 3D Green Background Elements */}
      <div className="absolute inset-0">
        {/* Main 3D green beam */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-gradient-to-tl from-green-500/20 via-green-400/30 to-transparent blur-3xl animate-pulse"></div>
        
        {/* Secondary 3D green accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/2 w-64 h-64 bg-green-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        {/* 3D green grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-green-500/10 to-transparent"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center">
          <div className="flex items-center justify-center p-1">
            <img 
              src="/logo-light2.svg" 
              alt="DraftBoard Logo" 
              className="w-28 h-14 object-contain object-center drop-shadow-2xl"
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))'
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 sm:px-8 pt-20 pb-16">
        {/* Hero Section */}
        <div className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* 3D Tagline */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-lg shadow-green-500/50 animate-pulse"></div>
            <p className="text-green-400 text-sm font-medium drop-shadow-lg">
              Connecting brands with talented creators worldwide
            </p>
          </div>

          {/* 3D Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
            Choose Your
            <span className="block text-green-500 drop-shadow-lg">Path</span>
          </h1>

          {/* 3D Description */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Join DraftBoard and connect with amazing opportunities. Are you a brand looking for creators, or a creator looking for brands?
          </p>
        </div>

        {/* 3D Registration Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* 3D Brand Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-green-500/10 group-hover:shadow-green-400/20">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/20">
                  <svg className="w-10 h-10 text-green-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">For Brands</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Find talented creators to bring your brand vision to life. Connect with influencers, designers, and content creators.
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Company profile with logo</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Contact information</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Banking verification</span>
                </div>
              </div>

              <Link
                to="/brand/register"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 text-center block shadow-lg shadow-green-500/20"
              >
                Register as Brand
              </Link>
            </div>
          </div>

          {/* 3D Creator Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-green-500/10 group-hover:shadow-green-400/20">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/20">
                  <svg className="w-10 h-10 text-green-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">For Creators</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Showcase your talent and connect with amazing brands. Grow your career with exciting opportunities.
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Professional profile</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Work showcase</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Social media integration</span>
                </div>
              </div>

              <Link
                to="/creator/register"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 text-center block shadow-lg shadow-green-500/20"
              >
                Register as Creator
              </Link>
            </div>
          </div>
        </div>

        {/* 3D Sign In Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 shadow-2xl shadow-green-500/10">
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Already have an account?</h3>
            <p className="text-gray-300 mb-6">
              Sign in to access your dashboard and continue your journey
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/login"
                className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 border border-green-500/50 hover:border-green-400/50 shadow-lg shadow-green-500/20"
              >
                Sign In
              </Link>
              <Link 
                to="/admin/login" 
                className="text-gray-400 hover:text-green-400 transition-colors text-sm font-mono drop-shadow-lg"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>

        {/* 3D Bottom Wave Graphic */}
        <div className="relative h-32 max-w-4xl mx-auto mt-16">
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-green-500 to-green-400 animate-pulse rounded-full shadow-lg shadow-green-500/30"></div>
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
        </div>
      </main>

      {/* 3D Footer */}
      <footer className="relative z-10 border-t border-green-500/30 mt-16">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0 drop-shadow-lg">
              © 2024 DraftBoard. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-green-400 transition-colors text-sm drop-shadow-lg">
                Sign In
              </Link>
              <Link to="/admin/login" className="text-gray-500 hover:text-green-400 transition-colors text-xs font-mono drop-shadow-lg">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 