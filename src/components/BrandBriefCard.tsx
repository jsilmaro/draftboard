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
    isFunded?: boolean;
    reward?: number;
    totalRewardValue?: number;
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
    requirements?: string;
    location?: string;
    additionalFields?: Record<string, unknown>;
  };
  onViewClick?: (brief: BrandBriefCardProps['brief']) => void;
  onEditClick?: (_brief: BrandBriefCardProps['brief']) => void;
  onEditRewardsClick?: (brief: BrandBriefCardProps['brief']) => void;
  onSelectWinnersClick?: (brief: BrandBriefCardProps['brief']) => void;
  onViewSubmissionsClick?: (brief: BrandBriefCardProps['brief']) => void;
  onDeleteClick?: (briefId: string) => void;
  onPublishClick?: (briefId: string) => void;
  onDraftClick?: (briefId: string) => void;
  onArchiveClick?: (briefId: string) => void;
}

const BrandBriefCard: React.FC<BrandBriefCardProps> = ({ 
  brief, 
  onViewClick, 
  onEditClick, 
  onEditRewardsClick: _onEditRewardsClick, 
  onSelectWinnersClick: _onSelectWinnersClick,
  onViewSubmissionsClick,
  onDeleteClick,
  onPublishClick,
  onDraftClick,
  onArchiveClick
}) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

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

        {/* Requirements Preview */}
        {brief.requirements && (
          <div className="mb-3 sm:mb-4">
            <h4 className={`text-xs font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Requirements Preview:
            </h4>
            <p className={`text-xs line-clamp-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {brief.requirements}
            </p>
          </div>
        )}

        {/* Location (if available) */}
        {brief.location && (
          <div className="mb-3 sm:mb-4">
            <h4 className={`text-xs font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Location:
            </h4>
            <p className={`text-xs ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {brief.location}
            </p>
          </div>
        )}

        {/* Funding Status - Prominent for Creators */}
        {brief.isFunded && (
          <div className="mb-3 sm:mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={`text-sm font-semibold ${
                isDark ? 'text-green-400' : 'text-green-700'
              }`}>
                ✓ Fully Funded & Verified
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              isDark ? 'text-green-300' : 'text-green-600'
            }`}>
              This brief is backed by real funding and ready for submissions
            </p>
          </div>
        )}

        {/* Reward Information */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-semibold ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Total Reward Pool:
            </h4>
            <span className={`text-sm font-bold ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              ${(totalRewardValue || 0).toLocaleString()}
            </span>
          </div>
          
          {/* Reward Structure */}
          {brief.rewardTiers && brief.rewardTiers.length > 0 && (
            <div className="space-y-1">
              <h5 className={`text-xs font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Reward Structure:
              </h5>
              {brief.rewardTiers.slice(0, 3).map((tier) => (
                <div key={tier.position} className="flex justify-between items-center">
                  <span className={`text-xs ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Reward {tier.position}
                  </span>
                  <span className={`text-xs font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${((tier.cashAmount || 0) + (tier.creditAmount || 0)).toLocaleString()}
                  </span>
                </div>
              ))}
              {brief.rewardTiers.length > 3 && (
                <p className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  +{brief.rewardTiers.length - 3} more rewards
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {submissionsCount}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Submissions
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {brief.amountOfWinners || 1}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Winners
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="mb-4 space-y-2">
          {/* Submissions Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={`${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Applications Progress
              </span>
              <span className={`font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {submissionsCount}/{targetSubmissions}
              </span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${submissionsProgress}%` }}
              />
            </div>
          </div>

          {/* Rewards Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={`${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Rewards Progress
              </span>
              <span className={`font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ${(rewardsPaid || 0).toLocaleString()}/${(totalRewardValue || 0).toLocaleString()}
              </span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${rewardsProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="mb-4">
          <div className={`text-xs ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Deadline: {new Date(brief.deadline).toLocaleDateString()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {onViewClick && (
            <button
              onClick={() => onViewClick(brief)}
              className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors"
            >
              👁️ View
            </button>
          )}
          {onEditClick && (
            <button
              onClick={() => onEditClick(brief)}
              className="px-3 py-2 bg-yellow-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-yellow-700 transition-colors"
            >
              ✏️ Edit
            </button>
          )}
          {onPublishClick && brief.status === 'draft' && (
            <button
              onClick={() => onPublishClick(brief.id)}
              className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors"
            >
              📢 Publish
            </button>
          )}
          {onDraftClick && brief.status === 'published' && (
            <button
              onClick={() => onDraftClick(brief.id)}
              className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-gray-700 transition-colors"
            >
              📝 Draft
            </button>
          )}
          {onArchiveClick && (
            <button
              onClick={() => onArchiveClick(brief.id)}
              className="px-3 py-2 bg-orange-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-orange-700 transition-colors"
            >
              📦 Archive
            </button>
          )}
          {onViewSubmissionsClick && (
            <button
              onClick={() => onViewSubmissionsClick(brief)}
              className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-purple-700 transition-colors"
            >
              📋 Submissions
            </button>
          )}
        </div>
        
        {/* Additional Action Buttons */}
        <div className="grid grid-cols-1 gap-2 mt-2">
          <button
            onClick={() => {
              // Get the current user ID from localStorage or use the brief's brandId
              // const currentUserId = localStorage.getItem('userId') || brief.brand?.id || 'unknown';
              const shareUrl = `${window.location.origin}/brief/${brief.id}`;
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Brief link copied to clipboard!');
              });
            }}
            className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors"
            title="Copy shareable link"
          >
            📤 Share
          </button>
          {onDeleteClick && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${brief.title}"? This action cannot be undone.`)) {
                  onDeleteClick(brief.id);
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