import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SubmissionModal from './SubmissionModal';

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

interface EnhancedMarketplaceBriefCardProps {
  brief: Brief;
  onSubmissionSuccess?: () => void;
  userSubmission?: {
    id: string;
    content: string;
    files: string;
    status: string;
  };
}

const EnhancedMarketplaceBriefCard: React.FC<EnhancedMarketplaceBriefCardProps> = ({
  brief,
  onSubmissionSuccess,
  userSubmission
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const getDaysRemaining = () => {
    const now = new Date();
    const deadlineDate = new Date(brief.deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining < 0;

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = `/login?return=/marketplace`;
      return;
    }

    if (user.type !== 'creator') {
      alert('Only creators can apply to briefs');
      return;
    }

    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    if (onSubmissionSuccess) {
      onSubmissionSuccess();
    }
  };


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

  return (
    <>
      <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-105 ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        
        {/* Header with Brand Info and Payout Rate */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              {brief.brand.logo ? (
                <img
                  src={brief.brand.logo}
                  alt={brief.brand.companyName}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {brief.brand.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {brief.brand.companyName}
              </h3>
            </div>
          </div>
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            {formatCurrency(brief.reward)} / Winner
          </div>
        </div>

        {/* Campaign Details */}
        <div className="p-4">
          <h4 className={`font-semibold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {brief.title}
          </h4>
          
          {/* Payout Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                ${brief.reward * brief.amountOfWinners} total reward pool
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {brief.amountOfWinners} winners
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((brief.submissions?.length || 0) / brief.amountOfWinners) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Type</p>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getBriefType(brief).charAt(0).toUpperCase() + getBriefType(brief).slice(1)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Platforms</p>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">I</span>
                </div>
                <div className="w-4 h-4 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs">T</span>
                </div>
                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">Y</span>
                </div>
              </div>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Applications</p>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {brief.submissions?.length || 0}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Link
              to={`/brief/${brief.id}`}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-center transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              View Details
            </Link>
            {user?.type === 'creator' && (
              <button
                onClick={handleApplyClick}
                disabled={isExpired}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isExpired
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-accent text-black hover:bg-accent/90'
                }`}
              >
                {isExpired ? 'Expired' : userSubmission ? 'Update' : 'Apply Now'}
              </button>
            )}
            {!user && (
              <button
                onClick={handleApplyClick}
                className="flex-1 py-2 px-4 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 transition-all duration-300"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      <SubmissionModal
        brief={brief}
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onSubmit={handleSubmissionSuccess}
        existingSubmission={userSubmission}
      />
    </>
  );
};

export default EnhancedMarketplaceBriefCard;



