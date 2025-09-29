import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface Submission {
  id: string;
  content: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  rewardAmount?: number;
  rewardedAt?: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
    hasStripeAccount?: boolean;
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

interface Winner {
  submissionId: string;
  creatorId: string;
  rewardType: 'cash' | 'credit' | 'prize';
  amount: number;
  description: string;
  prizeDetails?: {
    name?: string;
    description?: string;
    value?: number;
  };
}

const ManageRewardsPayments: React.FC = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'review' | 'winners' | 'payments'>('review');
  const [selectedWinners, setSelectedWinners] = useState<Winner[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
        
        // Show all briefs with submissions, not just funded ones
        const briefsWithSubmissions = data.filter((brief: Brief) => {
          return brief.submissions && brief.submissions.length > 0;
        });
        
        setBriefs(briefsWithSubmissions);
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

  const handleBriefSelect = (brief: Brief) => {
    setSelectedBrief(brief);
    setActiveSection('review');
    setSelectedWinners([]);
  };

  const handleAcceptSubmission = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccessToast('Submission accepted and shortlisted!');
        fetchBriefs(); // Refresh data
      } else {
        showErrorToast('Failed to accept submission');
      }
    } catch (error) {
      showErrorToast('Error accepting submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccessToast('Submission rejected');
        fetchBriefs(); // Refresh data
      } else {
        showErrorToast('Failed to reject submission');
      }
    } catch (error) {
      showErrorToast('Error rejecting submission');
    }
  };

  const handleWinnerToggle = (submission: Submission) => {
    const existingWinner = selectedWinners.find(w => w.submissionId === submission.id);
    
    if (existingWinner) {
      setSelectedWinners(prev => prev.filter(w => w.submissionId !== submission.id));
    } else {
      const newWinner: Winner = {
        submissionId: submission.id,
        creatorId: submission.creator.id,
        rewardType: 'cash',
        amount: 0,
        description: `Reward for winning brief: ${selectedBrief?.title}`
      };
      setSelectedWinners(prev => [...prev, newWinner]);
    }
  };

  const updateWinner = (submissionId: string, updates: Partial<Winner>) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.submissionId === submissionId 
          ? { ...winner, ...updates }
          : winner
      )
    );
  };

  const handleDistributeRewards = async () => {
    if (!selectedBrief || selectedWinners.length === 0) {
      showErrorToast('Please select winners first');
      return;
    }

    // Validate all winners have required data
    for (const winner of selectedWinners) {
      if (winner.rewardType === 'cash' && winner.amount <= 0) {
        showErrorToast(`Please set amount for cash reward`);
        return;
      }
      if (winner.rewardType === 'credit' && winner.amount <= 0) {
        showErrorToast(`Please set amount for credit reward`);
        return;
      }
      if (winner.rewardType === 'prize' && (!winner.prizeDetails?.name || !winner.prizeDetails?.description)) {
        showErrorToast(`Please provide prize details for prize reward`);
        return;
      }
    }

    setProcessingPayment(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/rewards/distribute-with-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          briefId: selectedBrief.id,
          winners: selectedWinners
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to distribute rewards');
      }

      const results = await response.json();
      showSuccessToast(`Rewards distributed successfully! ${results.results.successful} payments processed.`);
      
      // Reset state
      setSelectedWinners([]);
      setActiveSection('review');
      fetchBriefs(); // Refresh data

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Distribution failed';
      showErrorToast(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getShortlistedSubmissions = () => {
    if (!selectedBrief) return [];
    return selectedBrief.submissions.filter(sub => sub.status === 'approved');
  };

  const getFilteredSubmissions = () => {
    if (!selectedBrief) return [];
    
    let filtered = selectedBrief.submissions;
    
    // Filter by status
    if (submissionsFilter === 'pending') {
      filtered = filtered.filter(sub => sub.status === 'pending');
    } else if (submissionsFilter === 'approved') {
      filtered = filtered.filter(sub => sub.status === 'approved');
    } else if (submissionsFilter === 'rejected') {
      filtered = filtered.filter(sub => sub.status === 'rejected');
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Rewards & Payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review submissions, select winners, and distribute rewards
          </p>
        </div>
        <button
          onClick={fetchBriefs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Brief Selection */}
      {!selectedBrief && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {briefs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Briefs with Submissions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                To see briefs here, you need to:
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>1. Create a brief</p>
                <p>2. Wait for creators to submit work</p>
                <p>3. Review and manage submissions</p>
              </div>
            </div>
          ) : (
            briefs.map((brief) => (
              <div
                key={brief.id}
                onClick={() => handleBriefSelect(brief)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {brief.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {brief.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Reward:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${brief.reward.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Submissions:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {brief.submissions.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shortlisted:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {brief.submissions.filter(s => s.status === 'approved').length}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Brief Management */}
      {selectedBrief && (
        <div className="space-y-6">
          {/* Brief Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedBrief.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedBrief.description}
                </p>
                <div className="flex space-x-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Reward: <span className="font-medium text-gray-900 dark:text-white">${selectedBrief.reward.toFixed(2)}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Submissions: <span className="font-medium text-gray-900 dark:text-white">{selectedBrief.submissions.length}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Shortlisted: <span className="font-medium text-gray-900 dark:text-white">{getShortlistedSubmissions().length}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBrief(null);
                  setActiveSection('review');
                  setSelectedWinners([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setActiveSection('review')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'review'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Review Submissions
            </button>
            <button
              onClick={() => setActiveSection('winners')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'winners'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Select Winners
            </button>
            <button
              onClick={() => setActiveSection('payments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'payments'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Reward & Payment
            </button>
          </div>

          {/* Section Content */}
          {activeSection === 'review' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Submissions
              </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFilteredSubmissions().length} of {selectedBrief.submissions.length} submissions
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSubmissionsFilter(filter as 'all' | 'pending' | 'approved' | 'rejected')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      submissionsFilter === filter
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {getFilteredSubmissions().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedBrief.submissions.length === 0 
                      ? 'No submissions yet.' 
                      : 'No submissions found for the selected filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredSubmissions().map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center border bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <img src="/icons/profile.png" alt="User" className="w-10 h-10" />
                          </div>
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {submission.creator.fullName}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{submission.creator.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          submission.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                            : submission.status === 'rejected'
                            ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                            : 'bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission Content:</h6>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {submission.content}
                        </p>
                      </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptSubmission(submission.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                ✓ Accept & Shortlist
                            </button>
                            <button
                              onClick={() => handleRejectSubmission(submission.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                ✗ Reject
                            </button>
                          </>
                        )}
                          {submission.status === 'approved' && (
                            <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            ✓ Shortlisted
                          </span>
                        )}
                        {submission.status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            ✗ Rejected
                          </span>
                          )}
                        </div>
                        
                        {submission.status === 'pending' && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Awaiting review
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'winners' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Winners from Shortlisted Submissions
              </h4>
              {getShortlistedSubmissions().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No shortlisted submissions yet. Accept some submissions first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getShortlistedSubmissions().map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedWinners.some(w => w.submissionId === submission.id)}
                            onChange={() => handleWinnerToggle(submission)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Submission Content
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {submission.creator.fullName} (@{submission.creator.userName})
                            </p>
                          </div>
                        </div>
                        {selectedWinners.some(w => w.submissionId === submission.id) && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Reward:</span>
                            <input
                              type="number"
                              value={selectedWinners.find(w => w.submissionId === submission.id)?.amount || 0}
                              onChange={(e) => updateWinner(submission.id, { amount: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                              placeholder="0.00"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">USD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reward & Payment Distribution
              </h4>
              {selectedWinners.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No winners selected yet. Go to &quot;Select Winners&quot; tab first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Selected Winners ({selectedWinners.length})
                    </h5>
                    <div className="space-y-3">
                      {selectedWinners.map((winner) => {
                        const submission = selectedBrief.submissions.find(s => s.id === winner.submissionId);
                        return (
                          <div key={winner.submissionId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Submission Content
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                by {submission?.creator.fullName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                ${winner.amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {winner.rewardType}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          Total Reward Amount:
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ${selectedWinners.reduce((sum, winner) => sum + winner.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={handleDistributeRewards}
                        disabled={processingPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium"
                      >
                        {processingPayment ? 'Processing Payments...' : 'Distribute Rewards via Stripe'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageRewardsPayments;
