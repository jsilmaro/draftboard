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
  const [isHovered, setIsHovered] = useState(false);

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
  const totalReward = brief.reward * brief.amountOfWinners;

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

  const getStatusBadge = () => {
    if (userSubmission) {
      const status = userSubmission.status;
      if (status === 'approved' || status === 'winner') {
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✓ {status === 'winner' ? 'Winner' : 'Approved'}
          </div>
        );
      } else if (status === 'rejected') {
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            ✗ Rejected
          </div>
        );
      } else {
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            ⏳ Pending
          </div>
        );
      }
    }
    return null;
  };

  const getTimeRemainingColor = () => {
    if (isExpired) return 'text-red-500';
    if (daysRemaining <= 3) return 'text-yellow-500';
    if (daysRemaining <= 7) return 'text-orange-500';
    return isDark ? 'text-green-400' : 'text-green-600';
  };

  return (
    <>
      <div
        className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
          isDark
            ? `bg-gray-900/90 backdrop-blur-sm border-2 ${isHovered ? 'border-green-500/50 shadow-xl shadow-green-500/20' : 'border-gray-700/50'}`
            : `bg-white border-2 ${isHovered ? 'border-green-500/50 shadow-xl shadow-green-500/10' : 'border-gray-200'}`
        } ${isHovered ? 'transform -translate-y-1' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br from-green-500/0 to-blue-600/0 ${
          isHovered ? 'from-green-500/5 to-blue-600/5' : ''
        } transition-all duration-300 pointer-events-none`} />

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                isHovered ? 'scale-110' : ''
              } ${isDark ? 'bg-gradient-to-br from-green-500 to-blue-600' : 'bg-gradient-to-br from-green-400 to-blue-500'}`}>
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
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm truncate ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {brief.brand.companyName}
                </h3>
                {brief.location && (
                  <p className={`text-xs truncate ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    📍 {brief.location}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Title */}
          <Link to={`/brief/${brief.id}`}>
            <h2 className={`text-xl font-bold mb-3 line-clamp-2 transition-colors ${
              isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'
            }`}>
              {brief.title}
            </h2>
          </Link>

          {/* Description */}
          <p className={`text-sm line-clamp-3 mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {brief.description}
          </p>

          {/* Reward Display */}
          <div className={`p-4 rounded-xl mb-4 ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Reward Pool
                </div>
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {formatCurrency(totalReward)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Winners
                </div>
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {brief.amountOfWinners}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-lg text-center ${
              isDark ? 'bg-gray-800/30' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {brief.submissions?.length || 0}
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Applications
              </div>
            </div>
            <div className={`p-3 rounded-lg text-center ${
              isDark ? 'bg-gray-800/30' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-bold ${getTimeRemainingColor()}`}>
                {isExpired ? 'Expired' : `${daysRemaining}d`}
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Remaining
              </div>
            </div>
          </div>

          {/* Deadline Progress Bar */}
          <div className="mb-4">
            <div className={`h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <div
                className={`h-full transition-all duration-300 ${
                  isExpired
                    ? 'bg-red-500'
                    : daysRemaining <= 3
                    ? 'bg-yellow-500'
                    : 'bg-gradient-to-r from-green-500 to-blue-600'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%`
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Link
              to={`/brief/${brief.id}`}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-center transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              View Details
            </Link>
            {user?.type === 'creator' && (
              <button
                onClick={handleApplyClick}
                disabled={isExpired}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                  isExpired
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : userSubmission
                    ? isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isExpired ? 'Expired' : userSubmission ? 'Update' : 'Apply Now'}
              </button>
            )}
            {!user && (
              <button
                onClick={handleApplyClick}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {brief.rewardTiers && brief.rewardTiers.length > 0 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
              }`}>
                🏆 {brief.rewardTiers.length} Tiers
              </span>
            )}
            {brief.submissions && brief.submissions.length > 10 && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
              }`}>
                🔥 Popular
              </span>
            )}
            {daysRemaining <= 3 && !isExpired && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
              }`}>
                ⚡ Urgent
              </span>
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


