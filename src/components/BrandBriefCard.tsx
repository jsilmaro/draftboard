import React, { useState, useRef, useEffect } from 'react';
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
  onFundClick?: (brief: BrandBriefCardProps['brief']) => void;
}

const BrandBriefCard: React.FC<BrandBriefCardProps> = ({ 
  brief, 
  onViewClick, 
  onEditClick, 
  onEditRewardsClick, 
  onSelectWinnersClick,
  onViewSubmissionsClick,
  onDeleteClick,
  onPublishClick,
  onDraftClick,
  onArchiveClick,
  onFundClick
}) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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

  // Use the same approach as the detailed modal - brief.reward is already the total reward pool
  const totalRewardValue = brief.reward || 0;
  
  const rewardsPaid = brief.totalRewardsPaid || 0;
  const rewardsProgress = totalRewardValue > 0 ? (rewardsPaid / totalRewardValue) * 100 : 0;


  const getStatusBadge = () => {
    const baseClasses = "px-3 py-1 text-xs rounded-full font-medium";
    
    // Check if deadline is approaching (within 24 hours)
    const now = new Date();
    const deadline = new Date(brief.deadline);
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Show funding status if brief is funded
    if (brief.isFunded) {
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
        return `${baseClasses} bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400`;
      }
      return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400`;
    }
    
    // Show unfunded status for any unfunded brief
    if (!brief.isFunded) {
      return `${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400`;
    }
    
    // Check if deadline has passed
    if (hoursUntilDeadline <= 0) {
      return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400`;
    }
    
    // Check if deadline is approaching
    if (hoursUntilDeadline <= 24) {
      return `${baseClasses} bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400`;
    }
    
    switch (brief.status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400`;
      default:
        return `${baseClasses} bg-black/20 text-gray-400`;
    }
  };

  const getStatusText = () => {
    // Check if deadline is approaching or has passed
    const now = new Date();
    const deadline = new Date(brief.deadline);
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 0) {
      return 'Expired';
    }
    
    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      const hours = Math.floor(hoursUntilDeadline);
      return `Due in ${hours}h`;
    }
    
    if (brief.isFunded) {
      return 'Funded';
    }
    
    // Show "Unfunded" for any unfunded brief
    if (!brief.isFunded) {
      return 'Unfunded';
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
          <div className="flex items-center space-x-2">
            <div className={getStatusBadge()}>
              {getStatusText()}
            </div>
            {/* 3-dots menu button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="More options"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showMenu && (
                <div className={`absolute right-0 top-8 w-48 rounded-lg shadow-lg border z-50 ${
                  isDark 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    {onEditClick && (
                      <button
                        onClick={() => {
                          onEditClick(brief);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Edit
                      </button>
                    )}
                    {!brief.isFunded && onFundClick && (
                      <button
                        onClick={() => {
                          onFundClick(brief);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-green-300 hover:bg-green-800 hover:text-white' 
                            : 'text-green-700 hover:bg-green-100 hover:text-green-900'
                        }`}
                      >
                        💰 Fund Brief
                      </button>
                    )}
                    {onArchiveClick && (
                      <button
                        onClick={() => {
                          onArchiveClick(brief.id);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Archive
                      </button>
                    )}
                    {onViewSubmissionsClick && (
                      <button
                        onClick={() => {
                          onViewSubmissionsClick(brief);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Submissions
                      </button>
                    )}
                    {onEditRewardsClick && (
                      <button
                        onClick={() => {
                          onEditRewardsClick(brief);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Edit Rewards
                      </button>
                    )}
                    {onSelectWinnersClick && (
                      <button
                        onClick={() => {
                          onSelectWinnersClick(brief);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Select Winners
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/brief/${brief.id}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          alert('Brief link copied to clipboard!');
                        }).catch(() => {
                          alert('Failed to copy link');
                        });
                        setShowMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      Share
                    </button>
                    {onPublishClick && brief.status === 'draft' && (
                      <button
                        onClick={() => {
                          onPublishClick(brief.id);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Publish
                      </button>
                    )}
                    {onDraftClick && brief.status === 'published' && (
                      <button
                        onClick={() => {
                          onDraftClick(brief.id);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Move to Draft
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              {brief.rewardTiers.slice(0, 3).map((tier) => {
                // Calculate tier amount from available fields
                let tierAmount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                // If amount is 0, try using the amount field
                if (tierAmount === 0 && (tier as unknown as { amount?: number }).amount) {
                  tierAmount = parseFloat(String((tier as unknown as { amount: number }).amount)) || 0;
                }
                
                return (
                  <div key={tier.position} className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Reward {tier.position}
                    </span>
                    <span className={`text-xs font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${tierAmount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
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
        {!brief.isFunded && onFundClick ? (
          // Show Fund button prominently for unfunded briefs
          <div className="space-y-2">
            <button
              onClick={() => onFundClick(brief)}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              💰 Fund This Brief
            </button>
            <div className="grid grid-cols-2 gap-2">
              {onViewClick && (
                <button
                  onClick={() => onViewClick(brief)}
                  className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors"
                >
                  👁️ View
                </button>
              )}
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
        ) : (
          // Show normal View and Delete for funded briefs
          <div className="grid grid-cols-2 gap-2">
            {onViewClick && (
              <button
                onClick={() => onViewClick(brief)}
                className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors"
              >
                👁️ View
              </button>
            )}
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
        )}
      </div>
    </div>
  );
};

export default BrandBriefCard;