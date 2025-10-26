import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const MarketplaceNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <motion.nav 
      className="marketplace-header sticky top-0 z-50 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo size="sm" className="mr-2" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/marketplace"
                className={`marketplace-nav-item ${
                  isActive('/marketplace') ? 'active text-accent-green border-accent-green/30' : ''
                }`}
              >
                Marketplace
              </Link>
            </motion.div>
            <Link
              to="/"
              className={`marketplace-nav-item ${
                isActive('/') ? 'active' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/messages"
              className={`marketplace-nav-item ${
                isActive('/messages') ? 'active' : ''
              }`}
            >
              Messages
            </Link>
            
            {/* User-specific links */}
            {user && (
              <>
                {user.type === 'brand' && (
                  <Link
                    to="/brand/dashboard"
                    className="marketplace-nav-item"
                  >
                    Dashboard
                  </Link>
                )}
                {user.type === 'creator' && (
                  <Link
                    to="/creator/dashboard"
                    className="marketplace-nav-item"
                  >
                    Dashboard
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side - Auth buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
            
            {user ? (
              <div className="flex items-center space-x-4">

                <div className="hidden sm:flex items-center space-x-2">
                  <div className={`w-8 h-8 ${
                    isDark 
                      ? 'bg-gradient-to-r from-green-500 to-blue-600' 
                      : 'bg-gradient-to-r from-green-100 to-blue-100 border border-gray-200'
                  } rounded-full flex items-center justify-center`}>
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm hidden lg:block ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Handle logout
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className={`text-sm font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="marketplace-button-secondary text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/creator/register"
                  className="marketplace-button-premium text-sm"
                >
                  Join as Creator
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700 focus:ring-white' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t ${
            isDark 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <Link
              to="/marketplace"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/marketplace') 
                  ? (isDark ? 'text-green-400 bg-gray-800' : 'text-blue-600 bg-blue-50')
                  : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? (isDark ? 'text-green-400 bg-gray-800' : 'text-blue-600 bg-blue-50')
                  : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/messages"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/messages') 
                  ? (isDark ? 'text-green-400 bg-gray-800' : 'text-blue-600 bg-blue-50')
                  : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Messages
            </Link>
            
            {user && (
              <>
                {user.type === 'brand' && (
                  <Link
                    to="/brand/dashboard"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {user.type === 'creator' && (
                  <Link
                    to="/creator/dashboard"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Sign Out
                </button>
              </>
            )}
            
            {!user && (
              <Link
                to="/login"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        )}
      </motion.nav>
  );
};

export default MarketplaceNav;
