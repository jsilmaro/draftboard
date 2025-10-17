import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <MarketplaceNav />
      
      {/* Whop-style Clean Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-4 flex justify-center">
            <img 
              src={isDark ? "/logo-light2.svg" : "/logo.svg"} 
              alt="DraftBoard" 
              className="h-12 w-auto"
            />
          </div>
          <p className={`text-lg mb-12 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Where creators find their next opportunity
          </p>
          
          {/* Whop-style Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <motion.input
              type="text"
              placeholder="Search briefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-accent' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-accent'
              }`}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {filteredBriefs.length} Briefs Found
          </h2>
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Categories</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="business">Business</option>
              <option value="content">Content</option>
              <option value="influencer">Influencer</option>
              <option value="video">Video</option>
              <option value="photography">Photography</option>
              <option value="writing">Writing</option>
              <option value="design">Design</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="reward-high">Highest Reward</option>
              <option value="reward-low">Lowest Reward</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
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
      </div>
    </div>
  );
};

export default Marketplace;
