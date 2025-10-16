import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import MarketplaceNav from './MarketplaceNav';
import EnhancedMarketplaceBriefCard from './EnhancedMarketplaceBriefCard';
import SkeletonCard from './SkeletonCard';

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  deadline: string;
  status: string;
  createdAt: string;
  brand: {
    id: string;
    companyName: string;
    logo?: string;
  };
  submissions: Array<{
    id: string;
    status: string;
    submittedAt: string;
  }>;
  amountOfWinners: number;
  winnerRewards?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>;
}

const Marketplace = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { user } = useAuth();
  const { isDark } = useTheme();

  const fetchBriefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/briefs/public');
      if (response.ok) {
        const data = await response.json();
        setBriefs(data);
      } else {
        setError('Failed to load briefs. Please try again.');
        setBriefs([]);
      }
    } catch (error) {
      // Error fetching briefs
      setError('Unable to connect to the server. Please check your connection.');
      setBriefs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  // Function to determine brief type based on content
  const getBriefType = (brief: Brief) => {
    const content = (brief.title + ' ' + brief.description).toLowerCase();
    
    // Technical keywords
    if (content.includes('code') || content.includes('development') || content.includes('programming') || 
        content.includes('api') || content.includes('software') || content.includes('technical') ||
        content.includes('backend') || content.includes('frontend') || content.includes('database')) {
      return 'technical';
    }
    
    // Business keywords
    if (content.includes('strategy') || content.includes('business') || content.includes('consulting') ||
        content.includes('marketing') || content.includes('sales') || content.includes('analysis') ||
        content.includes('research') || content.includes('planning')) {
      return 'business';
    }
    
    // Default to creative for design, content, and other creative work
    return 'creative';
  };

  const filteredBriefs = briefs
    .filter(brief => {
      const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brief.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brief.brand.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || getBriefType(brief) === filterType;
      
      // Budget range filter
      const matchesBudget = (() => {
        if (!budgetRange.min && !budgetRange.max) return true;
        const minBudget = budgetRange.min ? parseFloat(budgetRange.min) : 0;
        const maxBudget = budgetRange.max ? parseFloat(budgetRange.max) : Infinity;
        return brief.reward >= minBudget && brief.reward <= maxBudget;
      })();
      
      // Deadline filter
      const matchesDeadline = (() => {
        if (deadlineFilter === 'all') return true;
        const now = new Date();
        const deadline = new Date(brief.deadline);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (deadlineFilter) {
          case 'urgent': return daysUntilDeadline <= 3;
          case 'week': return daysUntilDeadline <= 7;
          case 'month': return daysUntilDeadline <= 30;
          case 'long-term': return daysUntilDeadline > 30;
          default: return true;
        }
      })();
      
      // Only show published briefs in public marketplace
      const isPublished = brief.status === 'published';
      
      return matchesSearch && matchesType && matchesBudget && matchesDeadline && isPublished;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'reward-high':
          return b.reward - a.reward;
        case 'reward-low':
          return a.reward - b.reward;
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <MarketplaceNav />
        
        {/* Premium Header */}
        <motion.div 
          className={`${isDark ? 'bg-gradient-to-br from-gray-950 to-gray-900 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border-b`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-3 animate-pulse" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skeleton Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="min-h-screen bg-background flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center p-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="text-6xl mb-6"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            ⚠️
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h2>
          <motion.button
            onClick={fetchBriefs}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-accent-green to-accent-green-hover text-white rounded-xl hover:from-accent-green-hover hover:to-accent-green-dark font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <MarketplaceNav />
      
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${isDark ? 'bg-gradient-to-br from-gray-950 to-gray-900 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className={`text-4xl font-bold bg-gradient-to-r ${
                isDark ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'
              } bg-clip-text text-transparent`}>
                Marketplace
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-3 text-lg`}>
                Discover creative opportunities from top brands
              </p>
            </motion.div>
            <motion.div 
              className="mt-4 lg:mt-0 flex space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {!user ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/creator/register"
                      className="marketplace-button-premium"
                    >
                      Join as Creator
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className="marketplace-button-secondary"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/creator/dashboard"
                    className="marketplace-button-premium"
                  >
                    My Dashboard
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Premium Filters and Search */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className={`${isDark ? 'bg-gradient-to-br from-gray-950/80 to-gray-900/80 border-gray-800' : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200'} border rounded-2xl p-8 mb-8 shadow-lg backdrop-blur-sm`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Premium Search */}
            <div className="md:col-span-2">
              <motion.input
                type="text"
                placeholder="Search briefs, brands, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isDark ? 'bg-gray-900/80 border-gray-700 text-white placeholder-gray-400' : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-xl px-5 py-4 w-full focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green/50 transition-all duration-300 backdrop-blur-sm`}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Brief Template Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <option value="all">All Templates</option>
                <option value="creative">Social Media Campaign</option>
                <option value="technical">Product Review</option>
                <option value="business">Brand Partnership</option>
                <option value="content">Content Creation</option>
                <option value="influencer">Influencer Marketing</option>
                <option value="video">Video Production</option>
                <option value="photography">Photography</option>
                <option value="writing">Copywriting</option>
                <option value="design">Graphic Design</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="reward-high">Highest Reward</option>
                <option value="reward-low">Lowest Reward</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} text-sm font-medium flex items-center transition-colors`}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              <span className="ml-1">{showAdvancedFilters ? '▲' : '▼'}</span>
            </button>
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              {filteredBriefs.length} briefs found
            </span>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Budget Range */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Budget Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={budgetRange.min}
                      onChange={(e) => setBudgetRange({...budgetRange, min: e.target.value})}
                      className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                    <input
                      type="number"
                      placeholder="Max $"
                      value={budgetRange.max}
                      onChange={(e) => setBudgetRange({...budgetRange, max: e.target.value})}
                      className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>
                </div>

                {/* Deadline Filter */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Deadline</label>
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className="marketplace-input text-sm"
                  >
                    <option value="all">Any Deadline</option>
                    <option value="urgent">Urgent (&le;3 days)</option>
                    <option value="week">This Week (&le;7 days)</option>
                    <option value="month">This Month (&le;30 days)</option>
                      <option value="long-term">Long-term (&gt;30 days)</option>
                  </select>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Briefs Grid */}
        {filteredBriefs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Briefs Available</h3>
            <p className={`text-lg mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterType !== 'all' || budgetRange.min || budgetRange.max || deadlineFilter !== 'all'
                ? 'No briefs match your current filters. Try adjusting your search criteria.'
                : 'There are no active briefs at the moment. Check back soon for new opportunities!'}
            </p>
            {(searchTerm || filterType !== 'all' || budgetRange.min || budgetRange.max || deadlineFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setBudgetRange({ min: '', max: '' });
                  setDeadlineFilter('all');
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {filteredBriefs.map((brief, index) => (
              <motion.div
                key={brief.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <EnhancedMarketplaceBriefCard
                  brief={brief}
                  onSubmissionSuccess={fetchBriefs}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {filteredBriefs.length === 0 && (
          <div className="text-center py-12">
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-lg mb-4`}>
              No briefs found matching your criteria
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSortBy('newest');
              }}
              className={`${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} transition-colors`}
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Marketplace;
