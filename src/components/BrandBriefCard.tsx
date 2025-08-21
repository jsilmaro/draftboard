import React, { useState } from 'react';

interface BrandBriefCardProps {
  brief: {
    id: string;
    title: string;
    description: string;
    reward: number;
    amountOfWinners: number;
    totalRewardsPaid: number;
    deadline: string;
    status: 'active' | 'draft' | 'completed';
    location?: string;
    brand?: {
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
        fullName: string;
      };
      status: string;
      submittedAt: string;
    }>;
  };
  onEdit?: (briefId: string) => void;
  onViewSubmissions?: (briefId: string) => void;
  onViewDetails?: (briefId: string) => void;
  onDelete?: (briefId: string) => void;
}

const BrandBriefCard: React.FC<BrandBriefCardProps> = ({ 
  brief, 
  onEdit, 
  onViewSubmissions, 
  onViewDetails,
  onDelete 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
    if (brief.status === 'completed') return 'text-green-600';
    if (brief.status === 'draft') return 'text-gray-600';
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBadgeColor = () => {
    switch (brief.status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = () => {
    if (onViewSubmissions) {
      onViewSubmissions(brief.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(brief.id);
    }
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(brief.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this brief? This action cannot be undone.')) {
      onDelete(brief.id);
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
      {/* Header with Status Badge */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {brief.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Your Brief</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
              {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Brief Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
          {brief.title}
        </h2>
        
        {/* Reward Information */}
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

        {/* Brief Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Applications:</span>
            <span className="font-medium text-gray-900">
              {(() => {
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
              })()}
            </span>
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

      {/* Progress Section - Rewards Given */}
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
            {(() => {
              try {
                if (typeof brief.submissions === 'number') {
                  return `${brief.submissions} creators applied`;
                } else if (Array.isArray(brief.submissions)) {
                  return `${brief.submissions.length} creators applied`;
                } else {
                  return '0 creators applied';
                }
              } catch (error) {
                return '0 creators applied';
              }
            })()}
          </span>
        </div>
      </div>

      {/* Footer with Action Buttons */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewSubmissions) {
                onViewSubmissions(brief.id);
              }
            }}
          >
            View Submissions
          </button>
          <button
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            onClick={handleViewDetailsClick}
          >
            View Details
          </button>
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            onClick={handleEditClick}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Actions Dropdown */}
      {showActions && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
          <button
            onClick={handleEditClick}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit Brief
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onViewSubmissions) {
                onViewSubmissions(brief.id);
              }
              setShowActions(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            View Submissions
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete Brief
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandBriefCard;
