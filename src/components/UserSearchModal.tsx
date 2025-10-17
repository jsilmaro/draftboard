import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface UserData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  type: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (userId: string) => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onUserSelect
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users (creators and brands)
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line no-console
        console.log('🔍 Fetching all users from API...');
        
        const response = await fetch('/api/users/all');

        if (response.ok) {
          const data = await response.json();
          // eslint-disable-next-line no-console
          console.log(`✅ Received ${data.users?.length || 0} users from API`);
          
          // If no users in database, show some mock data for testing
          if (data.users && data.users.length === 0) {
            const mockUsers = [
              {
                id: 'mock-creator-1',
                name: 'John Creator',
                handle: '@johncreator',
                avatar: 'J',
                type: 'creator'
              },
              {
                id: 'mock-brand-1',
                name: 'Tech Brand Co',
                handle: '@techbrand',
                avatar: 'T',
                type: 'brand'
              },
              {
                id: 'mock-creator-2',
                name: 'Sarah Designer',
                handle: '@sarahdesign',
                avatar: 'S',
                type: 'creator'
              },
              {
                id: 'mock-brand-2',
                name: 'Fashion House',
                handle: '@fashionhouse',
                avatar: 'F',
                type: 'brand'
              }
            ];
            setSuggestedUsers(mockUsers);
          } else {
            setSuggestedUsers(data.users || []);
          }
          setError(null);
        } else {
          // eslint-disable-next-line no-console
          console.error('❌ API request failed:', response.status, response.statusText);
          setError(`Failed to load users: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error fetching all users:', error);
        setError('Failed to connect to database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      // eslint-disable-next-line no-console
      console.log('🚀 Opening modal, fetching all users...');
      fetchAllUsers();
    }
  }, [isOpen]);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    onUserSelect(userId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Find Users to Message
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Search for creators and brands to start conversations
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search creators and brands..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className={`w-full pl-10 pr-4 py-3 text-base rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-accent' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-accent'
                }`}
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Search Results */}
            {searchTerm && (
              <div className="p-6">
                <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Search Results
                </h3>
                
                {searchLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                )}
                
                {!searchLoading && searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((user, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                        className="flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                          user.type === 'creator' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}>
                          {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-base font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {user.name}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.type === 'creator' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {user.type === 'creator' ? 'Creator' : 'Brand'}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.handle}
                          </p>
                        </div>
                        <button className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                          Message
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {!searchLoading && searchResults.length === 0 && searchTerm && (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No users found for &quot;{searchTerm}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* All Users */}
            {!searchTerm && (
              <div className="p-6">
                <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  All Creators & Brands
                </h3>
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                )}
                
                {!loading && suggestedUsers.length > 0 && (
                  <div className="space-y-3">
                    {suggestedUsers.map((user, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                        className="flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                          user.type === 'creator' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}>
                          {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-base font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {user.name}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.type === 'creator' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {user.type === 'creator' ? 'Creator' : 'Brand'}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.handle}
                          </p>
                        </div>
                        <button className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                          Message
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {error && (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-red-900/20' : 'bg-red-100'
                    }`}>
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      Database Connection Error
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-red-300' : 'text-red-500'}`}>
                      {error}
                    </p>
                    <button
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        // Retry fetching users
                        const retryFetch = async () => {
                          try {
                            const response = await fetch('/api/users/all');

                            if (response.ok) {
                              const data = await response.json();
                              
                              // If no users in database, show some mock data for testing
                              if (data.users && data.users.length === 0) {
                                const mockUsers = [
                                  {
                                    id: 'mock-creator-1',
                                    name: 'John Creator',
                                    handle: '@johncreator',
                                    avatar: 'J',
                                    type: 'creator'
                                  },
                                  {
                                    id: 'mock-brand-1',
                                    name: 'Tech Brand Co',
                                    handle: '@techbrand',
                                    avatar: 'T',
                                    type: 'brand'
                                  },
                                  {
                                    id: 'mock-creator-2',
                                    name: 'Sarah Designer',
                                    handle: '@sarahdesign',
                                    avatar: 'S',
                                    type: 'creator'
                                  },
                                  {
                                    id: 'mock-brand-2',
                                    name: 'Fashion House',
                                    handle: '@fashionhouse',
                                    avatar: 'F',
                                    type: 'brand'
                                  }
                                ];
                                setSuggestedUsers(mockUsers);
                              } else {
                                setSuggestedUsers(data.users || []);
                              }
                              setError(null);
                            } else {
                              setError(`Failed to load users: ${response.status} ${response.statusText}`);
                            }
                          } catch (error) {
                            setError('Failed to connect to database. Please try again.');
                          } finally {
                            setLoading(false);
                          }
                        };
                        retryFetch();
                      }}
                      className="mt-4 bg-accent text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!loading && !error && suggestedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No users found on the platform yet.
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Users will appear here once they register on the platform.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserSearchModal;
