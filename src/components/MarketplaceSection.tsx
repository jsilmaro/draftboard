import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import EnhancedMarketplaceBriefCard from './EnhancedMarketplaceBriefCard';

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  deadline: string;
  status: string;
  location?: string;
  amountOfWinners: number;
  brand: {
    id: string;
    companyName: string;
    logo?: string;
  };
  submissions: Array<{
    id: string;
    creatorId?: string;
  }>;
  rewardTiers?: Array<{
    position: number;
    name: string;
    amount: number;
    description?: string;
  }>;
}

interface MarketplaceSectionProps {
  marketplaceBriefs: Brief[];
  marketplaceLoading: boolean;
  onRefresh: () => void;
  onSubmissionSuccess: () => void;
  userSubmissions: Array<{
    id: string;
    briefId: string;
    status: string;
  }>;
}

const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({
  marketplaceBriefs,
  marketplaceLoading,
  onRefresh,
  onSubmissionSuccess,
  userSubmissions
}) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* Marketplace Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Discover Opportunities
        </h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
          Find briefs that match your skills and start earning
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className={`${isDark ? 'bg-gray-900/90 border-gray-800/50' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-xl border p-6 mb-8 shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            Marketplace
          </button>
          <Link 
            to="/community" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Community
          </Link>
          <Link 
            to="/events" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Events
          </Link>
          <Link 
            to="/success-stories" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Success Stories
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 mb-8 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search briefs, brands, or keywords..."
              className={`w-full ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
          </div>
          <div>
            <select className={`w-full ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500`}>
              <option value="all">All Types</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marketplace Briefs Grid */}
      {marketplaceLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
      ) : marketplaceBriefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No briefs available</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Check back later for new opportunities!
          </p>
          <button 
            onClick={onRefresh}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceBriefs.map((brief) => {
            const userSubmission = userSubmissions.find(sub => sub.briefId === brief.id);
            
            return (
              <EnhancedMarketplaceBriefCard
                key={brief.id}
                brief={brief}
                onSubmissionSuccess={onSubmissionSuccess}
                userSubmission={userSubmission ? {
                  id: userSubmission.id,
                  content: '',
                  files: '',
                  status: userSubmission.status
                } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MarketplaceSection;














