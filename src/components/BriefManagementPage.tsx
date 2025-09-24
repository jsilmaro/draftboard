import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import WinnerSelectionFlow from './WinnerSelectionFlow';
import BriefFundingModal from './BriefFundingModal';
import CreateBrief from './CreateBrief';

interface Submission {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
}

interface Brief {
  id: string;
  title: string;
  description: string;
  reward: number;
  isFunded: boolean;
  fundedAt?: string;
  deadline: string;
  status: string;
  createdAt: string;
  submissions: Submission[];
  _count?: {
    submissions: number;
  };
}

const BriefManagementPage: React.FC = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [createBriefModalOpen, setCreateBriefModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'funded' | 'unfunded'>('all');
  const { showErrorToast, showSuccessToast } = useToast();

  const fetchBriefs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/briefs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns briefs directly as an array, not wrapped in a briefs property
        setBriefs(Array.isArray(data) ? data : []);
      } else {
        showErrorToast('Failed to fetch briefs');
      }
    } catch (error) {
      showErrorToast('Failed to fetch briefs');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const handleFundBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setFundingModalOpen(true);
  };

  const handleCloseFundingModal = () => {
    setFundingModalOpen(false);
    setSelectedBrief(null);
    fetchBriefs(); // Refresh the data
  };

  const handleCloseCreateBriefModal = () => {
    setCreateBriefModalOpen(false);
    showSuccessToast('Brief created successfully!');
    // Add a small delay to ensure the database has been updated
    setTimeout(() => {
      fetchBriefs(); // Refresh the data
      // Switch to unfunded tab to show the newly created brief
      setActiveTab('unfunded');
    }, 500);
  };

  const handleWinnerSelection = (brief: Brief) => {
    setSelectedBrief(brief);
  };

  const handleCloseWinnerSelection = () => {
    setSelectedBrief(null);
    fetchBriefs(); // Refresh the data
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredBriefs = briefs.filter(brief => {
    switch (activeTab) {
      case 'funded':
        return brief.isFunded;
      case 'unfunded':
        return !brief.isFunded;
      default:
        return true;
    }
  });

  const fundedCount = briefs.filter(b => b.isFunded).length;
  const unfundedCount = briefs.filter(b => !b.isFunded).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Brief Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fund your briefs and select winners for funded briefs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-green-600">{fundedCount}</span> funded • 
            <span className="font-medium text-orange-600">{unfundedCount}</span> unfunded
          </div>
          <button
            onClick={() => setCreateBriefModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Create Brief
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          All Briefs ({briefs.length})
        </button>
        <button
          onClick={() => setActiveTab('funded')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'funded'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Funded ({fundedCount})
        </button>
        <button
          onClick={() => setActiveTab('unfunded')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'unfunded'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Unfunded ({unfundedCount})
        </button>
      </div>

      {filteredBriefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeTab === 'funded' ? 'No Funded Briefs Yet' : 
             activeTab === 'unfunded' ? 'No Unfunded Briefs' : 'No Briefs Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {activeTab === 'funded' ? 'Fund your briefs first to start selecting winners and transferring rewards.' :
             activeTab === 'unfunded' ? 'All your briefs are funded! Great job!' :
             'Create some briefs to get started.'}
          </p>
          <button
            onClick={() => setCreateBriefModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create New Brief
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => (
            <div
              key={brief.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {brief.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {brief.description}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {brief.isFunded ? (
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full">
                      💰 Funded
                    </div>
                  ) : (
                    <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-xs font-medium px-2 py-1 rounded-full">
                      ⏳ Unfunded
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Reward Amount:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${brief.reward.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Submissions:</span>
                  <span className="font-medium">{brief.submissions ? brief.submissions.length : 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium capitalize">{brief.status}</span>
                </div>
                {brief.isFunded && brief.fundedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Funded Date:</span>
                    <span className="font-medium">
                      {new Date(brief.fundedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
                  <span className="font-medium">
                    {new Date(brief.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Submissions Preview */}
              {brief.submissions && brief.submissions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Recent Submissions:
                  </h4>
                  <div className="space-y-2">
                    {brief.submissions && brief.submissions.slice(0, 3).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white truncate">
                            {submission.title}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 truncate">
                            by {submission.creator.fullName}
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                    ))}
                    {brief.submissions && brief.submissions.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{(brief.submissions?.length || 0) - 3} more submission(s)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {brief.isFunded ? (
                  <button
                    onClick={() => handleWinnerSelection(brief)}
                    disabled={!brief.submissions || brief.submissions.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {!brief.submissions || brief.submissions.length === 0 ? 'No Submissions' : 'Select Winners'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFundBrief(brief)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    💰 Fund Brief (${brief.reward.toFixed(2)})
                  </button>
                )}
                
                {/* View Submissions Button */}
                {brief.submissions && brief.submissions.length > 0 && (
                  <button
                    onClick={() => window.location.href = `/brand/dashboard?tab=submissions&briefId=${brief.id}`}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    View All Submissions
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Funding Modal */}
      {fundingModalOpen && selectedBrief && (
        <BriefFundingModal
          isOpen={fundingModalOpen}
          onClose={handleCloseFundingModal}
          briefId={selectedBrief.id}
          briefTitle={selectedBrief.title}
          onFundingSuccess={handleCloseFundingModal}
        />
      )}

      {/* Winner Selection Modal */}
      {selectedBrief && selectedBrief.isFunded && (
        <WinnerSelectionFlow
          brief={selectedBrief}
          onClose={handleCloseWinnerSelection}
          onWinnerSelected={fetchBriefs}
        />
      )}

      {/* Create Brief Modal */}
      {createBriefModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Brief
                </h3>
                <button
                  onClick={() => setCreateBriefModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                <CreateBrief 
                  isSideModal={true} 
                  onClose={handleCloseCreateBriefModal}
                  onSuccess={handleCloseCreateBriefModal}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefManagementPage;
