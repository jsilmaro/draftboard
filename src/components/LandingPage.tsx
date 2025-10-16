import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center">
            <img 
              src={isDark ? "/logo-light2.svg" : "/logo.svg"} 
              alt="DraftBoard Logo" 
              className="w-36 h-18 object-contain object-center"
            />
        </div>
        
        {/* Theme Toggle & Navigation */}
        <div className="flex items-center space-x-6">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <Link 
            to="/login" 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 sm:px-8 pt-8 pb-16">
        {/* Hero Section */}
        <div className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to{' '}
            <span className="text-green-500">DraftBoard</span>
          </h1>
          <p className={`text-lg sm:text-xl mb-12 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Connect brands with talented creators. Choose your path to success.
          </p>
        </div>

        {/* Registration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Marketplace Card */}
          <div className={`group relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
            isDark 
              ? 'bg-gray-800 border border-gray-700 hover:border-green-500' 
              : 'bg-white border border-gray-200 hover:border-green-500 shadow-lg hover:shadow-xl'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-green-500/20' : 'bg-green-50'
              }`}>
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Marketplace
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Browse available briefs and discover opportunities from top brands
              </p>
              <Link
                to="/marketplace"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 text-center block"
              >
                Explore Briefs
              </Link>
            </div>
          </div>

          {/* Login Card */}
          <div className={`group relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
            isDark 
              ? 'bg-gray-800 border border-gray-700 hover:border-blue-500' 
              : 'bg-white border border-gray-200 hover:border-blue-500 shadow-lg hover:shadow-xl'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
              }`}>
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Sign In
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Access your dashboard and continue your journey
              </p>
              <Link
                to="/login"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 text-center block"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Admin Login Card */}
          <div className={`group relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
            isDark 
              ? 'bg-gray-800 border border-gray-700 hover:border-purple-500' 
              : 'bg-white border border-gray-200 hover:border-purple-500 shadow-lg hover:shadow-xl'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-purple-500/20' : 'bg-purple-50'
              }`}>
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
        </div>
              <h3 className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Admin Access
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Administrative panel for system management
              </p>
              <Link
                to="/admin/login"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 text-center block"
              >
                Admin Login
              </Link>
            </div>
          </div>
            </div>

        {/* Registration Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className={`text-2xl font-bold mb-8 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            New to DraftBoard?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brand Registration */}
            <div className={`rounded-2xl p-8 ${
              isDark 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-lg'
            }`}>
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-green-500/20' : 'bg-green-50'
                }`}>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  For Brands
                </h3>
                <p className={`text-sm mb-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Find talented creators to bring your brand vision to life
                </p>
                <Link
                  to="/brand/register"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 text-center block"
                >
                  Register as Brand
                </Link>
              </div>
            </div>

            {/* Creator Registration */}
            <div className={`rounded-2xl p-8 ${
              isDark 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-lg'
            }`}>
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                }`}>
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  For Creators
                </h3>
                <p className={`text-sm mb-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Showcase your talent and connect with amazing brands
                </p>
                <Link 
                  to="/creator/register"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 text-center block"
                >
                  Register as Creator
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className={`text-2xl font-bold mb-8 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Why Choose DraftBoard?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-green-500/20' : 'bg-green-50'
              }`}>
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Secure Platform
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Safe and secure transactions with verified users
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
              }`}>
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Fast Matching
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Quick and efficient matching between brands and creators
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-purple-500/20' : 'bg-purple-50'
              }`}>
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Fair Payments
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Transparent and fair payment system for all users
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className={`text-sm mb-4 md:mb-0 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              © 2024 DraftBoard. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link 
                to="/login" 
                className={`text-sm transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </Link>
              <Link 
                to="/admin/login" 
                className={`text-sm transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
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