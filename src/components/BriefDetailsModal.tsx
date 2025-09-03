import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface BriefDetails {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  amountOfWinners: number;
  totalRewardsPaid: number;
  deadline: string;
  status: string;
  isPrivate: boolean;
  location?: string;
  additionalFields?: Record<string, unknown>;
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
  rewardTiers?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>;
}

interface BriefDetailsModalProps {
  briefId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const BriefDetailsModal: React.FC<BriefDetailsModalProps> = ({ 
  briefId, 
  isOpen, 
  onClose 
}) => {
  const { user } = useAuth();
  const [brief, setBrief] = useState<BriefDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyFormData, setApplyFormData] = useState({
    contentUrl: ''
  });

  const fetchBriefDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/briefs/${briefId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const briefData = await response.json();
        setBrief(briefData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load brief details');
      }
    } catch (error) {
      setError('Error loading brief details');
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    if (isOpen && briefId) {
      fetchBriefDetails();
      setSubmissionError(null); // Clear any previous submission errors
    }
  }, [isOpen, briefId, fetchBriefDetails]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brief || !user) return;

    try {
      setSubmissionError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setSubmissionError('Authentication required');
        return;
      }

      const response = await fetch('/api/creators/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          briefId: brief.id,
          contentUrl: applyFormData.contentUrl
        })
      });

      if (response.ok) {
        setShowApplyModal(false);
        setApplyFormData({ contentUrl: '' });
        setSubmissionError(null);
        // Show success message
        alert('Application submitted successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        setSubmissionError(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      setSubmissionError('Error submitting application');
    }
  };

  const calculateTimeRemaining = () => {
    if (!brief) return '';
    
    const deadline = new Date(brief.deadline);
    const now = new Date();
    const timeRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  const getStatusColor = () => {
    if (!brief) return 'text-gray-300';
    
    const deadline = new Date(brief.deadline);
    const now = new Date();
    const timeRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    return 'text-emerald-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
                  <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Brief Details</h2>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {calculateTimeRemaining()}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" color="blue" text="Loading brief details..." />
            </div>
          ) : error || !brief ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-4">Brief Not Found</h3>
              <p className="text-gray-300 mb-6">{error || 'The brief you are looking for does not exist.'}</p>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Brand Information */}
                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      {brief.brand.logo ? (
                        <img 
                          src={brief.brand.logo} 
                          alt={brief.brand.companyName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {brief.brand.companyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                                                             <div>
                      <h3 className="text-lg font-bold text-white">{brief.brand.companyName}</h3>
                       
                       {/* Social Media Links */}
                       {(brief.brand.socialInstagram || brief.brand.socialTwitter || brief.brand.socialLinkedIn || brief.brand.socialWebsite) && (
                         <div className="flex items-center space-x-3 mt-3">
                           {brief.brand.socialInstagram && (
                             <a 
                               href={brief.brand.socialInstagram.startsWith('http') ? brief.brand.socialInstagram : `https://instagram.com/${brief.brand.socialInstagram}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-pink-500 hover:text-pink-600 text-lg"
                             >
                               📷 Instagram
                             </a>
                           )}
                           {brief.brand.socialTwitter && (
                             <a 
                               href={brief.brand.socialTwitter.startsWith('http') ? brief.brand.socialTwitter : `https://twitter.com/${brief.brand.socialTwitter}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-500 text-lg"
                             >
                               🐦 Twitter
                             </a>
                           )}
                           {brief.brand.socialLinkedIn && (
                             <a 
                               href={brief.brand.socialLinkedIn.startsWith('http') ? brief.brand.socialLinkedIn : `https://linkedin.com/company/${brief.brand.socialLinkedIn}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-700 text-lg"
                             >
                               💼 LinkedIn
                             </a>
                           )}
                           {brief.brand.socialWebsite && (
                             <a 
                               href={brief.brand.socialWebsite.startsWith('http') ? brief.brand.socialWebsite : `https://${brief.brand.socialWebsite}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-gray-300 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 text-lg"
                             >
                               🌐 Website
                             </a>
                           )}
                         </div>
                       )}
                     </div>
                  </div>
                </div>

                {/* Brief Title and Description */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h1 className="text-2xl font-bold text-white mb-4">{brief.title}</h1>
                  <div className="prose max-w-none">
                    <p className="text-gray-300 leading-relaxed">{brief.description}</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{brief.requirements}</p>
                  </div>
                </div>

                {/* Additional Fields */}
                {brief.additionalFields && Object.keys(brief.additionalFields).length > 0 && (
                  <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      {Object.entries(brief.additionalFields).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="font-medium text-white mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="text-gray-300">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Reward Information */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Reward Information</h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-100 dark:border-green-700">
                      <p className="text-sm text-gray-400 mb-1">Total Reward</p>
                      <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">${brief.reward.toLocaleString()}</p>
                                             <p className="text-sm text-gray-400 mt-1">for {brief.amountOfWinners} reward{brief.amountOfWinners > 1 ? 's' : ''}</p>
                    </div>

                    {brief.rewardTiers && brief.rewardTiers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-3">Reward Tiers</h4>
                        <div className="space-y-3">
                          {brief.rewardTiers.map((tier) => (
                            <div key={tier.position} className="p-3 bg-gray-700 rounded-lg">
                                                             <div className="flex justify-between items-center mb-2">
                                 <span className="font-medium text-white">Reward {tier.position}</span>
                                 <span className="text-emerald-500 dark:text-emerald-400 font-semibold">${tier.cashAmount}</span>
                               </div>
                              {tier.creditAmount > 0 && (
                                <p className="text-sm text-gray-400">+ {tier.creditAmount} credits</p>
                              )}
                              {tier.prizeDescription && (
                                <p className="text-sm text-gray-400">+ {tier.prizeDescription}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Campaign Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Creators Applied</span>
                      <span className="font-semibold text-white">{brief.submissions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Rewards Given</span>
                      <span className="font-semibold text-white">{brief.totalRewardsPaid}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-semibold ${getStatusColor()}`}>
                        {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                      </span>
                    </div>
                    {brief.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Location</span>
                        <span className="font-semibold text-white">{brief.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Deadline</h3>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">
                      {new Date(brief.deadline).toLocaleDateString()}
                    </p>
                    <p className={`text-lg font-medium mt-1 ${getStatusColor()}`}>
                      {calculateTimeRemaining()}
                    </p>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Apply to Brief</h3>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSubmissionError(null);
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={applyFormData.contentUrl}
                    onChange={(e) => setApplyFormData({...applyFormData, contentUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    placeholder="https://..."
                  />
                </div>
                
                {submissionError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{submissionError}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setSubmissionError(null);
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BriefDetailsModal;
