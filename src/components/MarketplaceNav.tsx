import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MarketplaceNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-white font-bold text-xl">DraftBoard</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/marketplace"
              className={`text-sm font-medium transition-colors ${
                isActive('/marketplace') 
                  ? 'text-green-400' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-green-400' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            
            {/* User-specific links */}
            {user ? (
              <>
                {user.userType === 'brand' && (
                  <Link
                    to="/brand/dashboard"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {user.userType === 'creator' && (
                  <Link
                    to="/creator/dashboard"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/brand/register"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  For Brands
                </Link>
                <Link
                  to="/creator/register"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  For Creators
                </Link>
              </>
            )}
          </div>

          {/* Right side - Auth buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-300 text-sm hidden lg:block">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Handle logout
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/creator/register"
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                >
                  Join as Creator
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 border-t border-gray-800">
            <Link
              to="/marketplace"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/marketplace') 
                  ? 'text-green-400 bg-gray-800' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'text-green-400 bg-gray-800' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {user ? (
              <>
                {user.userType === 'brand' && (
                  <Link
                    to="/brand/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {user.userType === 'creator' && (
                  <Link
                    to="/creator/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
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
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/brand/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  For Brands
                </Link>
                <Link
                  to="/creator/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  For Creators
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketplaceNav;
