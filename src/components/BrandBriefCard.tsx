import React, { useState } from 'react';

interface BrandBriefCardProps {
  brief: {
    id: string;
    title: string;
    description?: string;
    rewardType?: string;
    amountOfWinners?: number;
    deadline: string;
    status: string;
    submissions: number | Array<unknown>;
    totalRewardsPaid?: number;
    location?: string;
    displayLocation?: string; // Country only for display
    reward?: number;
    totalRewardValue?: number; // Calculated total from reward tiers
    rewardTiers?: Array<{
      position: number;
      cashAmount: number;
      creditAmount: number;
      prizeDescription: string;
    }>;
    brand?: {
      id: string;
      companyName: string;
      logo?: string;
    };
  };
  onViewClick?: (brief: BrandBriefCardProps['brief']) => void;
  onEditClick?: (_brief: BrandBriefCardProps['brief']) => void;
  onEditRewardsClick?: (brief: BrandBriefCardProps['brief']) => void;
  onSelectWinnersClick?: (brief: BrandBriefCardProps['brief']) => void;
  onViewSubmissionsClick?: (brief: BrandBriefCardProps['brief']) => void;
}

const BrandBriefCard: React.FC<BrandBriefCardProps> = ({ 
  brief, 
  onViewClick, 
  onEditClick: _onEditClick, 
  onEditRewardsClick, 
  onSelectWinnersClick,
  onViewSubmissionsClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate submissions count
  const getSubmissionsCount = () => {
    try {
      if (typeof brief.submissions === 'number') {
        return brief.submissions;
      } else if (Array.isArray(brief.submissions)) {
        return brief.submissions.length;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  };

  const submissionsCount = getSubmissionsCount();

  // Calculate progress percentage for submissions vs target
  const targetSubmissions = 10; // You can make this configurable
  const submissionsProgress = Math.min((submissionsCount / targetSubmissions) * 100, 100);

  // Calculate rewards progress using actual reward tiers
  const totalRewardValue = brief.totalRewardValue || 0;
  const rewardsPaid = brief.totalRewardsPaid || 0;
  const rewardsProgress = totalRewardValue > 0 ? (rewardsPaid / totalRewardValue) * 100 : 0;

  // Calculate time remaining
  const deadline = new Date(brief.deadline);
  const now = new Date();
  const timeRemaining = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const getTimeRemainingText = () => {
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  const getStatusColor = () => {
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    switch (brief.status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-lg transform -translate-y-1' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Brand Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {brief.brand?.logo ? (
                <img 
                  src={brief.brand.logo} 
                  alt={brief.brand.companyName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {brief.brand?.companyName?.charAt(0).toUpperCase() || 'B'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {brief.brand?.companyName || 'Your Brand'}
              </h3>
              <span className={getStatusBadge()}>
                {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
          {brief.title}
        </h2>
        
        {/* Reward Information - Prominently Displayed */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount of Rewards</p>
              <p className="text-lg font-bold text-green-600">
                {brief.amountOfWinners || 1}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Submissions</p>
              <p className="text-lg font-semibold text-gray-900">
                {submissionsCount}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Deadline:</span>
            <span className={`font-medium text-xs ${getStatusColor()}`}>
              {getTimeRemainingText()}
            </span>
          </div>
          {brief.displayLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Location:</span>
              <span className="font-medium text-gray-900 text-xs">{brief.displayLocation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section - Submissions Progress */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Submissions Progress
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(submissionsProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ 
                width: `${Math.min(submissionsProgress, 100)}%`,
                backgroundSize: '200% 100%',
                animation: submissionsProgress > 0 ? 'shimmer 2s ease-in-out infinite' : 'none'
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {submissionsCount} creators applied
          </span>
          <span className="text-gray-600">
            Target: {brief.amountOfWinners || 1}
          </span>
        </div>
      </div>

      {/* Rewards Progress Section */}
      {brief.amountOfWinners && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Rewards Progress
              </span>
              <span className="text-sm font-bold text-green-600">
                {Math.round(rewardsProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ 
                  width: `${Math.min(rewardsProgress, 100)}%`,
                  backgroundSize: '200% 100%',
                  animation: rewardsProgress > 0 ? 'shimmer 2s ease-in-out infinite' : 'none'
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              ${rewardsPaid} rewards paid
            </span>
            <span className="text-gray-600">
              ${totalRewardValue} total value
            </span>
          </div>
        </div>
      )}

      {/* Footer with Action Buttons */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            onClick={() => onViewClick?.(brief)}
          >
            View
          </button>
          <button
            className="bg-green-600 text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
            onClick={() => onEditRewardsClick?.(brief)}
          >
            Edit Rewards
          </button>
        </div>
        
        {brief.status === 'active' && submissionsCount > 0 && brief.amountOfWinners && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              className="bg-purple-600 text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
              onClick={() => onViewSubmissionsClick?.(brief)}
            >
              View Submissions
            </button>
            {new Date(brief.deadline) <= new Date() && (
              <button
                className="bg-orange-600 text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-orange-700 transition-colors"
                onClick={() => onSelectWinnersClick?.(brief)}
              >
                Select Winners
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandBriefCard;
