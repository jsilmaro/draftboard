import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ 
          y: -8,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        style={{ willChange: 'transform' }}
        className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
          isDark
            ? `bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-2 ${isHovered ? 'border-accent-green/60 shadow-2xl shadow-accent-green/25' : 'border-gray-700/50'}`
            : `bg-gradient-to-br from-white to-gray-50/50 border-2 ${isHovered ? 'border-accent-green/60 shadow-2xl shadow-accent-green/20' : 'border-gray-200'}`
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Premium gradient overlay on hover */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isHovered 
              ? "linear-gradient(135deg, rgba(0, 255, 132, 0.08) 0%, rgba(0, 158, 96, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(0, 255, 132, 0) 0%, rgba(0, 158, 96, 0) 100%)"
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isDark ? 'bg-gradient-to-br from-accent-green to-accent-green-hover' : 'bg-gradient-to-br from-accent-green to-accent-green-hover'
                }`}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 20px rgba(0, 255, 132, 0.4)"
                }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
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

          {/* Premium Reward Display */}
          <motion.div 
            className={`p-5 rounded-xl mb-4 ${
              isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-700/40 border border-gray-600/30' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200'
            }`}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 8px 25px rgba(0, 255, 132, 0.1)"
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-medium mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Reward Pool
                </div>
                <motion.div 
                  className={`text-2xl font-bold ${
                    isDark ? 'text-accent-green' : 'text-accent-green'
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {formatCurrency(totalReward)}
                </motion.div>
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
          </motion.div>

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

          {/* Premium Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/brief/${brief.id}`}
                className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-all duration-300 block ${
                  isDark
                    ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50 hover:border-accent-green/30'
                    : 'bg-white/80 text-gray-700 hover:bg-gray-50/80 border border-gray-300/50 hover:border-accent-green/30'
                }`}
              >
                View Details
              </Link>
            </motion.div>
            {user?.type === 'creator' && (
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleApplyClick}
                  disabled={isExpired}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                    isExpired
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : userSubmission
                      ? 'bg-gradient-to-r from-accent-green to-accent-green-hover hover:from-accent-green-hover hover:to-accent-green-dark text-white shadow-lg hover:shadow-xl hover:shadow-accent-green/25'
                      : 'bg-gradient-to-r from-accent-green to-accent-green-hover hover:from-accent-green-hover hover:to-accent-green-dark text-white shadow-lg hover:shadow-xl hover:shadow-accent-green/25'
                  }`}
                >
                  {isExpired ? 'Expired' : userSubmission ? 'Update' : 'Apply Now'}
                </button>
              </motion.div>
            )}
            {!user && (
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleApplyClick}
                  className="w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-accent-green to-accent-green-hover hover:from-accent-green-hover hover:to-accent-green-dark text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-accent-green/25"
                >
                  Apply Now
                </button>
              </motion.div>
            )}
          </div>

          {/* Premium Quick Info Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {brief.rewardTiers && brief.rewardTiers.length > 0 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  isDark ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                }`}
              >
                🏆 {brief.rewardTiers.length} Tiers
              </motion.span>
            )}
            {brief.submissions && brief.submissions.length > 10 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  isDark ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}
              >
                🔥 Popular
              </motion.span>
            )}
            {daysRemaining <= 3 && !isExpired && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  isDark ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                ⚡ Urgent
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

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



