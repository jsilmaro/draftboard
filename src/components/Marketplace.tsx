import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import MarketplaceNav from './MarketplaceNav';
import EnhancedMarketplaceBriefCard from './EnhancedMarketplaceBriefCard';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
          <button
            onClick={fetchBriefs}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <MarketplaceNav />
      
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Marketplace
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                Discover creative opportunities from top brands
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex space-x-4">
              {!user ? (
                <>
                  <Link
                    to="/creator/register"
                    className="marketplace-button"
                  >
                    Join as Creator
                  </Link>
                  <Link
                    to="/login"
                    className="marketplace-button-secondary"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/creator/dashboard"
                  className="marketplace-button"
                >
                  My Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 mb-8 shadow-sm`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search briefs, brands, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBriefs.map((brief) => (
              <EnhancedMarketplaceBriefCard
                key={brief.id}
                brief={brief}
                onSubmissionSuccess={fetchBriefs}
              />
            ))}
          </div>
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
      </div>
    </div>
  );
};

export default Marketplace;
