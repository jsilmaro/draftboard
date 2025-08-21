import React, { useState } from 'react';

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
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 cursor-pointer group ${
        isHovered ? 'shadow-lg transform -translate-y-1' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Header with Brand Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {brief.brand.logo ? (
                <img 
                  src={brief.brand.logo} 
                  alt={brief.brand.companyName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {brief.brand.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {brief.brand.companyName}
              </h3>

            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              daysRemaining < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
              daysRemaining <= 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
              'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {getTimeRemainingText()}
            </div>
          </div>
        </div>

        {/* Brief Title and Description */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {brief.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {brief.description}
          </p>
        </div>

        {/* Reward Information */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reward</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              ${brief.reward.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Target: {brief.amountOfWinners} creators</span>
            <span>{brief.submissions.length} applied</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Rewards Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyClick}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={daysRemaining < 0}
        >
          {daysRemaining < 0 ? 'Expired' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
};

export default BriefCard;

