import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import MarketplaceNav from './MarketplaceNav';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      const response = await fetch('/api/briefs/public');
      if (response.ok) {
        const data = await response.json();
        setBriefs(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching briefs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
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
        <div className="marketplace-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search briefs, brands, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="marketplace-search w-full"
              />
            </div>

            {/* Brief Template Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="marketplace-input"
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
                className="marketplace-input"
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
              className="text-accent-green hover:text-accent-green/80 text-sm font-medium flex items-center"
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              <span className="ml-1">{showAdvancedFilters ? '▲' : '▼'}</span>
            </button>
            <span className="text-foreground-muted text-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => {
            const daysRemaining = getDaysRemaining(brief.deadline);
            const isExpired = daysRemaining < 0;
            
            return (
              <div
                key={brief.id}
                className="product-card"
              >
                {/* Brand Header */}
                <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${
                      isDark 
                        ? 'bg-gray-900 border-gray-800' 
                        : 'bg-gray-50 border-gray-200'
                    } border rounded-xl flex items-center justify-center`}>
                      {brief.brand.logo ? (
                        <img
                          src={brief.brand.logo}
                          alt={brief.brand.companyName}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        <span className={`font-bold text-sm ${
                          isDark ? 'text-white' : 'text-gray-700'
                        }`}>
                          {brief.brand.companyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brand.companyName}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(brief.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Brief Content */}
                <div className="p-4">
                  <h2 className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors`}>
                    {brief.title}
                  </h2>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4 line-clamp-3`}>
                    {brief.description}
                  </p>

                  {/* Reward and Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="product-card-price">
                        {brief.winnerRewards && brief.winnerRewards.length > 0 
                          ? formatCurrency(brief.winnerRewards.reduce((sum, r) => sum + (r.cashAmount || 0) + (r.creditAmount || 0), 0))
                          : formatCurrency(brief.reward)
                        }
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {brief.amountOfWinners} winner{brief.amountOfWinners > 1 ? 's' : ''}
                      </div>
                      {brief.winnerRewards && brief.winnerRewards.length > 0 && (
                        <div className="text-xs text-accent-blue">
                          Calculated amounts
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground-muted">
                        {brief.submissions.length} submissions
                      </div>
                      {brief.amountOfWinners > 1 && (
                        <div className="text-xs text-accent-blue">
                          Tiered rewards
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-muted">Deadline</span>
                      <span className={`text-sm font-medium ${
                        isExpired 
                          ? (isDark ? 'text-red-400' : 'text-red-600')
                          : (isDark ? 'text-green-400' : 'text-green-600')
                      }`}>
                        {isExpired ? 'Expired' : `${daysRemaining} days left`}
                      </span>
                    </div>
                    <div className={`mt-2 rounded-full h-2 ${
                      isDark ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-2 rounded-full ${
                          isExpired 
                            ? (isDark ? 'bg-red-500' : 'bg-red-500')
                            : (isDark ? 'bg-green-400' : 'bg-green-500')
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Brief Type Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getBriefType(brief) === 'creative' ? 'badge-light' :
                      getBriefType(brief) === 'technical' ? 'badge-light' :
                      getBriefType(brief) === 'business' ? 'badge-light' :
                      'badge-light'
                    }`}>
                      {getBriefType(brief).charAt(0).toUpperCase() + getBriefType(brief).slice(1)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/brief/${brief.id}`}
                    className="marketplace-button w-full text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBriefs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-foreground-muted text-lg mb-4">
              No briefs found matching your criteria
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSortBy('newest');
              }}
              className="text-accent-green hover:text-accent-green/80 transition-colors"
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
