import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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
  onDeleteClick?: (brief: BrandBriefCardProps['brief']) => void;

}

const BrandBriefCard: React.FC<BrandBriefCardProps> = ({ 
  brief, 
  onViewClick, 
  onEditClick: _onEditClick, 
  onEditRewardsClick: _onEditRewardsClick, 
  onSelectWinnersClick: _onSelectWinnersClick,
  onViewSubmissionsClick,
  onDeleteClick
}) => {
  const { isDark } = useTheme();
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
  const targetSubmissions = brief.amountOfWinners || 1;
  const submissionsProgress = Math.min((submissionsCount / targetSubmissions) * 100, 100);

  // Calculate rewards progress using actual reward tiers
  const totalRewardValue = brief.totalRewardValue || 0;
  const rewardsPaid = brief.totalRewardsPaid || 0;
  const rewardsProgress = totalRewardValue > 0 ? (rewardsPaid / totalRewardValue) * 100 : 0;





  const getStatusBadge = () => {
    const baseClasses = "px-3 py-1 text-xs rounded-full font-medium";
    
    // Show funding status if brief is funded
    if (brief.isFunded) {
      return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400`;
    }
    
    switch (brief.status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-black/20 text-gray-400`;
    }
  };

  const getStatusText = () => {
    if (brief.isFunded) {
      return 'Funded';
    }
    return brief.status.charAt(0).toUpperCase() + brief.status.slice(1);
  };

  return (
    <div
      className={`backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border-2 overflow-hidden transition-all duration-300 group ${
        isDark 
          ? `bg-black/95 border-gray-700/80 ${
              isHovered ? 'shadow-2xl transform -translate-y-1 bg-gray-950/95 border-gray-600/90 shadow-green-500/20' : 'hover:shadow-xl hover:bg-gray-950/95 hover:border-gray-600/70'
            }`
          : `bg-white border-gray-200 ${
              isHovered ? 'shadow-2xl transform -translate-y-1 bg-gray-50 border-gray-300 shadow-blue-500/20' : 'hover:shadow-xl hover:bg-gray-50 hover:border-gray-300'
            }`
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {brief.brand?.logo ? (
                <img 
                  src={brief.brand.logo} 
                  alt={brief.brand.companyName}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm sm:text-lg">
                  {brief.brand?.companyName?.charAt(0).toUpperCase() || 'B'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-xs sm:text-sm truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {brief.brand?.companyName || 'Your Brand'}
              </h3>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={getStatusBadge()}>
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* Brief Title and Description */}
        <div className="mb-3 sm:mb-4">
          <h2 className={`text-base sm:text-lg font-bold mb-2 line-clamp-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {brief.title}
          </h2>
          {brief.description && (
            <p className={`text-xs sm:text-sm line-clamp-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {brief.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 ${
            isDark ? 'bg-gray-900/50' : 'bg-gray-100'
          }`}>
            <div className={`text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Target</div>
            <div className={`text-sm sm:text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {brief.amountOfWinners || 1}
            </div>
          </div>
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 ${
            isDark ? 'bg-gray-900/50' : 'bg-gray-100'
          }`}>
            <div className={`text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Applied</div>
            <div className={`text-sm sm:text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {submissionsCount}
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {/* Submissions Progress */}
          <div>
            <div className={`flex items-center justify-between text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>Submissions Progress</span>
              <span>{submissionsProgress.toFixed(1)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              isDark ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${submissionsProgress}%` }}
              />
            </div>
          </div>

          {/* Rewards Progress */}
          <div>
            <div className={`flex items-center justify-between text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>Rewards Progress</span>
              <span>{rewardsProgress.toFixed(1)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              isDark ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${rewardsProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Value */}
        {totalRewardValue > 0 && (
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 ${
            isDark ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <div className={`text-xs mb-1 ${
              isDark ? 'text-green-400' : 'text-green-700'
            }`}>Total Value</div>
            <div className={`text-sm sm:text-lg font-bold ${
              isDark ? 'text-green-300' : 'text-green-800'
            }`}>
              ${totalRewardValue.toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => onViewClick?.(brief)}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-colors ${
              isDark 
                ? 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View
          </button>
          <button
            onClick={() => onViewSubmissionsClick?.(brief)}
            className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors"
          >
            Submissions ({submissionsCount})
          </button>
        </div>
        
        {/* Additional Action Buttons */}
        <div className="grid grid-cols-1 gap-2 mt-2">
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/brand/${brief.brand?.id || 'unknown'}/briefs`;
              window.open(shareUrl, '_blank');
            }}
            className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors"
            title="Open shareable link"
          >
            📤 Share
          </button>
          {onDeleteClick && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${brief.title}"? This action cannot be undone.`)) {
                  onDeleteClick(brief);
                }
              }}
              className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors"
              title="Delete brief"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandBriefCard;
