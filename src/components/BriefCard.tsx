import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BriefCardProps {
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
  onApplyClick?: (brief: BriefCardProps['brief']) => void;
}

const BriefCard: React.FC<BriefCardProps> = ({ brief, onApplyClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  // Calculate progress percentage for rewards given
  const totalRewardValue = brief.reward * brief.amountOfWinners;
  const progressPercentage = totalRewardValue > 0 ? (brief.totalRewardsPaid / totalRewardValue) * 100 : 0;

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
                  isDark ? 'text-white' : 'text-gray-700'
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
          <div className="text-right flex-shrink-0 space-y-1">
            {/* Funding Status */}
            {brief.isFunded && (
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                isDark 
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                💰 Funded
              </div>
            )}
            
            {/* Time Remaining */}
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDark 
                ? (daysRemaining < 0 ? 'bg-red-900/20 text-red-400' :
                   daysRemaining <= 3 ? 'bg-orange-900/20 text-orange-400' :
                   'bg-emerald-900/20 text-emerald-400')
                : (daysRemaining < 0 ? 'bg-red-50 text-red-600 border border-red-200' :
                   daysRemaining <= 3 ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                   'bg-emerald-50 text-emerald-600 border border-emerald-200')
            }`}>
              {getTimeRemainingText()}
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
          <p className={`text-xs sm:text-sm line-clamp-3 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {brief.description}
          </p>
        </div>

        {/* Reward Information */}
        <div className={`${
          isDark 
            ? 'bg-gray-700/50' 
            : 'bg-gray-50 border border-gray-200'
        } rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs sm:text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>Reward</span>
            <span className={`text-base sm:text-lg font-bold ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              ${brief.reward.toLocaleString()}
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs sm:text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>Target: {brief.amountOfWinners} creators</span>
            <span>{brief.submissions.length} applied</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className={`flex items-center justify-between text-xs mb-1 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>Rewards Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${
            isDark ? 'bg-gray-600' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyClick}
          className={`w-full font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
            isDark 
              ? (brief.isFunded ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white')
              : (brief.isFunded ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 hover:border-emerald-700' : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700')
          }`}
          disabled={daysRemaining < 0}
        >
          {daysRemaining < 0 ? 'Expired' : brief.isFunded ? 'Apply to Funded Brief' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
};

export default BriefCard;

