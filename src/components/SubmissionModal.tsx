import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface SubmissionModalProps {
  brief: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    reward: number;
    amountOfWinners: number;
    deadline: string;
    brand: {
      id: string;
      companyName: string;
      logo?: string;
    };
    rewardTiers?: Array<{
      position: number;
      name: string;
      amount: number;
      description?: string;
    }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  existingSubmission?: {
    id: string;
    content: string;
    files: string;
    status: string;
  };
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  brief,
  isOpen,
  onClose,
  onSubmit,
  existingSubmission
}) => {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [contentUrl, setContentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setContentUrl(existingSubmission.files || '');
    } else {
      setContentUrl('');
    }
  }, [existingSubmission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentUrl.trim()) {
      showToast('Please provide a content URL', 'error');
      return;
    }

    // Validate URL format
    try {
      new URL(contentUrl);
    } catch {
      showToast('Please enter a valid URL (e.g., https://example.com)', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/creators/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          briefId: brief.id,
          content: contentUrl.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Application submitted successfully! 🎉', 'success');
        setContentUrl('');
        if (onSubmit) onSubmit();
        onClose();
      } else {
        showToast(data.error || 'Failed to submit application', 'error');
      }
    } catch (error) {
      showToast('Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const deadlineDate = new Date(brief.deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining < 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl transform transition-all ${
          isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <h2 className={`text-xl font-bold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {existingSubmission ? 'Update Application' : 'Apply to Brief'}
                </h2>
                <p className={`text-sm truncate ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {brief.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ml-4 ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Brief Summary */}
            <div className={`p-4 rounded-xl mb-6 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className={`text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Reward
                  </div>
                  <div className={`text-2xl font-bold ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {formatCurrency(brief.reward)}
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-medium mb-1 ${
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
                <div>
                  <div className={`text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Time Remaining
                  </div>
                  <div className={`text-2xl font-bold ${
                    isExpired
                      ? 'text-red-500'
                      : daysRemaining <= 3
                      ? 'text-yellow-500'
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isExpired ? 'Expired' : `${daysRemaining}d`}
                  </div>
                </div>
              </div>
            </div>

            {/* Reward Tiers */}
            {brief.rewardTiers && brief.rewardTiers.length > 0 && (
              <div className={`p-4 rounded-xl mb-6 ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Reward Structure
                </h3>
                <div className="space-y-2">
                  {brief.rewardTiers.map((tier) => (
                    <div key={tier.position} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          tier.position === 1
                            ? 'bg-yellow-500 text-white'
                            : tier.position === 2
                            ? 'bg-gray-400 text-white'
                            : tier.position === 3
                            ? 'bg-amber-600 text-white'
                            : isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                        }`}>
                          {tier.position}
                        </div>
                        <div>
                          <div className={`font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {tier.name}
                          </div>
                          {tier.description && (
                            <div className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {tier.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {formatCurrency(tier.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Toggle */}
            <button
              onClick={() => setShowRequirements(!showRequirements)}
              className={`w-full p-4 rounded-xl mb-6 flex items-center justify-between transition-colors ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                📋 View Requirements
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  showRequirements ? 'rotate-180' : ''
                } ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRequirements && (
              <div className={`p-4 rounded-xl mb-6 ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`text-sm whitespace-pre-wrap ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {brief.requirements}
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Content URL *
                </label>
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://dropbox.com/..."
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
                <p className={`mt-2 text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Provide a link to your work (Google Drive, Dropbox, YouTube, etc.)
                </p>
              </div>

              {/* Submission Tips */}
              <div className={`p-4 rounded-xl mb-6 ${
                isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 flex items-center ${
                  isDark ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Submission Tips
                </h4>
                <ul className={`text-xs space-y-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  <li>• Make sure your link is publicly accessible</li>
                  <li>• Double-check that you&apos;ve met all requirements</li>
                  <li>• High-quality submissions have better chances of winning</li>
                  <li>• You can update your submission before the deadline</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isExpired}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSubmitting || isExpired
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : existingSubmission ? (
                    'Update Application'
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>

            {existingSubmission && (
              <div className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm flex items-center ${
                  isDark ? 'text-yellow-400' : 'text-yellow-700'
                }`}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  You already have a {existingSubmission.status} application for this brief
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;


