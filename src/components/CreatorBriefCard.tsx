import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CreatorBriefCardProps {
  brief: {
    id: string;
    title: string;
    description: string;
    reward: number;
    amountOfWinners: number;
    totalRewardsPaid: number;
    deadline: string;
    status: string;
    isFunded?: boolean;
    fundedAt?: string;
    requirements?: string;
    location?: string;
    additionalFields?: Record<string, unknown>;
    rewardTiers?: Array<{
      position: number;
      amount: number;
      cashAmount: number;
      creditAmount: number;
    }>;

    brand: {
      id: string;
      companyName: string;
      logo?: string;
      socialInstagram?: string;
      socialTwitter?: string;
      socialLinkedIn?: string;
      socialWebsite?: string;
    };
    submissions: Array<{
      id: string;
      creator: {
        userName: string;
      };
    }>;
  };
  onApplyClick?: (brief: CreatorBriefCardProps['brief']) => void;
  hasApplied?: boolean;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
}

const CreatorBriefCard: React.FC<CreatorBriefCardProps> = ({ 
  brief, 
  onApplyClick, 
  hasApplied = false, 
  applicationStatus 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  // Calculate total reward value
  const totalRewardValue = brief.reward * brief.amountOfWinners;

  // Calculate submissions count
  const submissionsCount = brief.submissions?.length || 0;

  // Calculate time remaining
  const deadlineDate = new Date(brief.deadline);
  const now = new Date();
  const timeDiff = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const getTimeRemainingText = () => {
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  const handleCardClick = () => {
    if (onApplyClick) {
      onApplyClick(brief);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApplyClick) {
      onApplyClick(brief);
    }
  };

  const getStatusColor = () => {
    if (applicationStatus === 'approved') return 'bg-emerald-900/20 text-emerald-400';
    if (applicationStatus === 'rejected') return 'bg-red-900/20 text-red-400';
    return 'bg-yellow-900/20 text-yellow-400';
  };

  const getStatusText = () => {
    if (applicationStatus === 'approved') return 'Approved';
    if (applicationStatus === 'rejected') return 'Rejected';
    return 'Pending Review';
  };

  return (
    <div
      className={`${
        isDark 
          ? `bg-gray-900/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border-2 border-gray-500/80 overflow-hidden transition-all duration-300 cursor-pointer group ${
              isHovered ? 'shadow-2xl transform -translate-y-1 bg-gray-800/95 border-gray-400/90 shadow-green-500/20' : 'hover:shadow-xl hover:bg-gray-850/95 hover:border-gray-400/70'
            }`
          : `bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 cursor-pointer group ${
              isHovered ? 'shadow-md transform -translate-y-1 border-gray-300' : 'hover:shadow-md hover:border-gray-300'
            }`
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Header with Brand Info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${
              isDark 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                : 'bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200'
            } rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              {brief.brand.logo ? (
                <img 
                  src={brief.brand.logo} 
                  alt={brief.brand.companyName}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover"
                />
              ) : (
                <span className={`font-bold text-sm sm:text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {brief.brand.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-xs sm:text-sm truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {brief.brand.companyName}
              </h3>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`px-3 py-1 text-xs rounded-full font-medium ${
              brief.isFunded 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : brief.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {brief.isFunded ? 'Funded' : brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
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
              ${totalRewardValue.toLocaleString()}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <div className={`text-lg sm:text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {submissionsCount}
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Applications
              </div>
            </div>
          </div>
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <div className={`text-lg sm:text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {brief.amountOfWinners}
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Winners
              </div>
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
          <div className={`text-xs font-medium ${
            daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 3 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {getTimeRemainingText()}
          </div>
        </div>

        {/* Application Status or Apply Button */}
        <div className="text-center">
          {hasApplied ? (
            <div className="space-y-2">
              <div className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              <div>
                <button
                  onClick={handleApplyClick}
                  className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View/Update Application
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleApplyClick}
              disabled={brief.status !== 'published' || daysRemaining < 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                brief.status !== 'published' || daysRemaining < 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {brief.status !== 'published' 
                ? 'Not Available' 
                : daysRemaining < 0 
                ? 'Expired' 
                : 'Apply to This Brief'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorBriefCard;
