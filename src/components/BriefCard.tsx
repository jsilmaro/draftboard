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
    location?: string;
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

  const getStatusColor = () => {
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    return 'text-green-600';
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
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 cursor-pointer ${
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {brief.brand.logo ? (
                <img 
                  src={brief.brand.logo} 
                  alt={brief.brand.companyName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {brief.brand.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {brief.brand.companyName}
              </h3>
              
              {/* Social Media Links */}
              {(brief.brand.socialInstagram || brief.brand.socialTwitter || brief.brand.socialLinkedIn || brief.brand.socialWebsite) && (
                <div className="flex items-center space-x-2 mt-1">
                  {brief.brand.socialInstagram && (
                    <a 
                      href={brief.brand.socialInstagram.startsWith('http') ? brief.brand.socialInstagram : `https://instagram.com/${brief.brand.socialInstagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📷
                    </a>
                  )}
                  {brief.brand.socialTwitter && (
                    <a 
                      href={brief.brand.socialTwitter.startsWith('http') ? brief.brand.socialTwitter : `https://twitter.com/${brief.brand.socialTwitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-500 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🐦
                    </a>
                  )}
                  {brief.brand.socialLinkedIn && (
                    <a 
                      href={brief.brand.socialLinkedIn.startsWith('http') ? brief.brand.socialLinkedIn : `https://linkedin.com/company/${brief.brand.socialLinkedIn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      💼
                    </a>
                  )}
                  {brief.brand.socialWebsite && (
                    <a 
                      href={brief.brand.socialWebsite.startsWith('http') ? brief.brand.socialWebsite : `https://${brief.brand.socialWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🌐
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
          {brief.title}
        </h2>
        
        {/* Payout Information - Prominently Displayed */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reward</p>
              <p className="text-2xl font-bold text-green-600">
                ${brief.reward.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Rewards</p>
              <p className="text-lg font-semibold text-gray-900">
                {brief.amountOfWinners}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Joined:</span>
            <span className="font-medium text-gray-900">{brief.submissions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Deadline:</span>
            <span className={`font-medium text-xs ${getStatusColor()}`}>
              {getTimeRemainingText()}
            </span>
          </div>
          {brief.location && (
            <div className="flex items-center justify-between col-span-2">
              <span className="text-sm text-gray-600">Location:</span>
              <span className="font-medium text-gray-900 text-xs">{brief.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section - Rewards Given Progress */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Rewards Given
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ 
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundSize: '200% 100%',
                animation: progressPercentage > 0 ? 'shimmer 2s ease-in-out infinite' : 'none'
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {brief.totalRewardsPaid > 0 ? `${brief.totalRewardsPaid} rewards given` : 'No rewards given yet'}
          </span>
          <span className="text-gray-600">
            {brief.submissions.length} creators applied
          </span>
        </div>
      </div>

      {/* Footer with Action Button */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <button
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
          onClick={handleApplyClick}
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default BriefCard;

