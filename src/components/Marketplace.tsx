import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuth();

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

  const filteredBriefs = briefs
    .filter(brief => {
      const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brief.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brief.brand.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || brief.status === filterStatus;
      
      return matchesSearch && matchesStatus;
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <MarketplaceNav />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Marketplace
              </h1>
              <p className="text-gray-400 mt-2">
                Discover creative opportunities from top brands
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex space-x-4">
              {!user ? (
                <>
                  <Link
                    to="/creator/register"
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Join as Creator
                  </Link>
                  <Link
                    to="/login"
                    className="border border-gray-600 text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/creator/dashboard"
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
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
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search briefs, brands, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="reward-high">Highest Reward</option>
                <option value="reward-low">Lowest Reward</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Briefs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => {
            const daysRemaining = getDaysRemaining(brief.deadline);
            const isExpired = daysRemaining < 0;
            
            return (
              <div
                key={brief.id}
                className="bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-all duration-200 overflow-hidden group"
              >
                {/* Brand Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      {brief.brand.logo ? (
                        <img
                          src={brief.brand.logo}
                          alt={brief.brand.companyName}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {brief.brand.companyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{brief.brand.companyName}</h3>
                      <p className="text-sm text-gray-400">{formatDate(brief.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Brief Content */}
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                    {brief.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {brief.description}
                  </p>

                  {/* Reward and Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {brief.winnerRewards && brief.winnerRewards.length > 0 
                          ? formatCurrency(brief.winnerRewards.reduce((sum, r) => sum + (r.cashAmount || 0) + (r.creditAmount || 0), 0))
                          : formatCurrency(brief.reward)
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        {brief.amountOfWinners} winner{brief.amountOfWinners > 1 ? 's' : ''}
                      </div>
                      {brief.winnerRewards && brief.winnerRewards.length > 0 && (
                        <div className="text-xs text-blue-400">
                          Calculated amounts
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {brief.submissions.length} submissions
                      </div>
                      {brief.amountOfWinners > 1 && (
                        <div className="text-xs text-blue-400">
                          Tiered rewards
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Deadline</span>
                      <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                        {isExpired ? 'Expired' : `${daysRemaining} days left`}
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isExpired ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      brief.status === 'published' ? 'bg-green-100 text-green-800' :
                      brief.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/brief/${brief.id}`}
                    className="block w-full bg-gradient-to-r from-green-500 to-blue-600 text-white text-center py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
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
            <div className="text-gray-400 text-lg mb-4">
              No briefs found matching your criteria
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('newest');
              }}
              className="text-green-400 hover:text-green-300 transition-colors"
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
