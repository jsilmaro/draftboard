import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BriefDetailsModalProps {
  brief: {
  id: string;
  title: string;
    description?: string;
    requirements?: string;
  reward: number;
    amountOfWinners?: number;
    totalRewardsPaid?: number;
  deadline: string;
  status: string;
  isPrivate: boolean;
  isFunded?: boolean;
  fundedAt?: string;
  additionalFields?: Record<string, unknown>;
    rewardTiers?: Array<{
      position: number;
      cashAmount: number;
      creditAmount: number;
      prizeDescription: string;
    }>;
    winnerRewards?: Array<{
      position: number;
      cashAmount: number;
      creditAmount: number;
      prizeDescription: string;
      calculatedAmount?: number;
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
      fullName: string;
    };
    status: string;
    submittedAt: string;
  }>;
  };
  isOpen: boolean;
  onClose: () => void;
}

const BriefDetailsModal: React.FC<BriefDetailsModalProps> = ({ brief, isOpen, onClose }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    const baseClasses = "px-3 py-1 text-xs rounded-full font-medium";
    switch (brief.status) {
      case 'published':
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const getStatusText = () => {
    return brief.status.charAt(0).toUpperCase() + brief.status.slice(1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
        {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                {brief.brand?.logo ? (
                  <img 
                    src={brief.brand.logo} 
                    alt={brief.brand.companyName}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {brief.brand?.companyName?.charAt(0).toUpperCase() || 'B'}
                  </span>
                )}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {brief.title}
                </h2>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  by {brief.brand?.companyName || 'Your Brand'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={getStatusBadge()}>
                {getStatusText()}
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
        </div>

        {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {brief.description && (
                                                             <div>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Description
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {brief.description}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                {brief.requirements && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Requirements
                    </h3>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <p className={`text-sm leading-relaxed ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {brief.requirements}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Fields */}
                {brief.additionalFields && Object.keys(brief.additionalFields).length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Additional Information
                    </h3>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      {Object.entries(brief.additionalFields).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <span className={`font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}:
                          </span>
                          <span className={`ml-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submissions */}
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Submissions ({brief.submissions.length})
                  </h3>
                  {brief.submissions.length > 0 ? (
                    <div className="space-y-3">
                      {brief.submissions.map((submission) => (
                        <div key={submission.id} className={`p-4 rounded-lg border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {submission.creator.fullName || submission.creator.userName}
                              </p>
                              <p className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                Submitted on {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              submission.status === 'approved' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : submission.status === 'rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No submissions yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Key Details */}
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Key Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Reward:
                      </span>
                      <p className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${brief.reward.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Winners:
                      </span>
                      <p className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {brief.amountOfWinners || 1}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Deadline:
                      </span>
                      <p className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatDate(brief.deadline)}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Visibility:
                      </span>
                      <p className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {brief.isPrivate ? 'Private' : 'Public'}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Funding Status:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          brief.isFunded 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {brief.isFunded ? 'Funded' : 'Not Funded'}
                        </span>
                        {brief.fundedAt && (
                          <span className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {formatDate(brief.fundedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                    </div>
                    
                {/* Reward Tiers */}
                {(brief.rewardTiers && brief.rewardTiers.length > 0 || (brief as { winnerRewards?: Array<unknown> }).winnerRewards?.length > 0) && (
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Reward Distribution
                    </h3>
                    <div className="space-y-3">
                      {(brief.rewardTiers && brief.rewardTiers.length > 0 ? brief.rewardTiers : (brief as { winnerRewards?: Array<unknown> }).winnerRewards).map((tier: Record<string, unknown>) => {
                        const totalTierValue =
                          Number(tier.cashAmount || 0) +
                          Number(tier.creditAmount || 0) ||
                          Number(tier.amount || 0) || 0;
                        return (
                        <div key={tier.position} className="flex justify-between items-center">
                          <span className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {`Reward ${tier.position}`}
                              </span>
                          <span className={`font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            ${Number(totalTierValue).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}

                {/* Brand Social Links */}
                {brief.brand && (
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Brand Links
                    </h3>
                    <div className="space-y-2">
                      {brief.brand.socialWebsite && (
                        <a 
                          href={brief.brand.socialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 text-sm ${
                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Website</span>
                        </a>
                      )}
                      {brief.brand.socialInstagram && (
                        <a 
                          href={brief.brand.socialInstagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 text-sm ${
                            isDark ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H7.721c-.49 0-.807.317-.807.807v8.449c0 .49.317.807.807.807h8.449c.49 0 .807-.317.807-.807V8.514c0-.49-.317-.807-.807-.807z"/>
                          </svg>
                          <span>Instagram</span>
                        </a>
                      )}
                      {brief.brand.socialTwitter && (
                        <a 
                          href={brief.brand.socialTwitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 text-sm ${
                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          <span>Twitter</span>
                        </a>
                      )}
                      {brief.brand.socialLinkedIn && (
                        <a 
                          href={brief.brand.socialLinkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 text-sm ${
                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

          {/* Footer */}
          <div className={`flex items-center justify-end space-x-3 p-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
                <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Close
                </button>
                  <button
                    onClick={() => {
                // TODO: Implement edit functionality
                // console.log('Edit brief:', brief.id);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Brief
                  </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefDetailsModal;