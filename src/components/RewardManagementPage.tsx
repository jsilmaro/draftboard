import React, { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface Brief {
  id: string;
  title: string;
  description: string;
  status: string;
  isFunded: boolean;
  fundedAt?: string;
  totalBudget?: number;
  rewardTiers: RewardTier[];
  rewardAssignments: RewardAssignment[];
  submissions: Submission[];
}

interface RewardTier {
  id: string;
  tierNumber: number;
  name: string;
  description: string;
  amount: number;
  position: number;
  isActive: boolean;
  rewardAssignments?: RewardAssignment[];
}

interface RewardAssignment {
  id: string;
  briefId: string;
  rewardTierId: string;
  creatorId: string;
  submissionId: string;
  assignedAt: string;
  assignedBy: string;
  status: string;
  payoutStatus: string;
  stripeTransferId?: string;
  paidAt?: string;
  creator: {
    id: string;
    userName: string;
    fullName: string;
  };
  submission: {
    id: string;
    content: string;
    submittedAt: string;
  };
  rewardTier: RewardTier;
}

interface Submission {
  id: string;
  briefId: string;
  creatorId: string;
  content: string;
  files?: string;
  amount: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  creator: {
    id: string;
    userName: string;
    fullName: string;
  };
  rewardAssignment?: RewardAssignment;
}

const RewardManagementPage: React.FC = () => {
  // const { user } = useAuth();
  const { isDark } = useTheme();
  const { showErrorToast, showSuccessToast } = useToast();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [activeTab, setActiveTab] = useState<'funded' | 'winners_selected' | 'payouts_completed'>('funded');

  const fetchBriefs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/briefs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter briefs that are funded and have reward tiers
        const fundedBriefs = data.filter((brief: Brief) => 
          brief.isFunded && brief.rewardTiers && brief.rewardTiers.length > 0
        );
        setBriefs(fundedBriefs);
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

  const handleAssignReward = async (tierId: string, submissionId: string, creatorId: string) => {
    if (!selectedBrief) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/briefs/${selectedBrief.id}/assign-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rewardTierId: tierId,
          submissionId: submissionId,
          creatorId: creatorId
        })
      });

      if (response.ok) {
        showSuccessToast('Reward assigned successfully');
        fetchBriefs(); // Refresh data
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to assign reward');
      }
    } catch (error) {
      showErrorToast('Failed to assign reward');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reward-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccessToast('Assignment removed successfully');
        fetchBriefs(); // Refresh data
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to remove assignment');
      }
    } catch (error) {
      showErrorToast('Failed to remove assignment');
    }
  };

  const handleProcessPayouts = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/briefs/${briefId}/process-payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccessToast('Payouts processed successfully');
        fetchBriefs(); // Refresh data
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to process payouts');
      }
    } catch (error) {
      showErrorToast('Failed to process payouts');
    }
  };

  const getBriefStatus = (brief: Brief) => {
    if (!brief.isFunded) return 'draft';
    if (brief.rewardAssignments.length === 0) return 'funded';
    if (brief.rewardAssignments.every(ra => ra.payoutStatus === 'paid')) return 'payouts_completed';
    return 'winners_selected';
  };

  const filteredBriefs = briefs.filter(brief => {
    const status = getBriefStatus(brief);
    return status === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading reward management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reward Management</h1>
          <p className="text-gray-400">
            Assign creators to reward tiers and manage payouts for your funded briefs.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {[
              { key: 'funded', label: 'Funded Briefs', count: briefs.filter(b => getBriefStatus(b) === 'funded').length },
              { key: 'winners_selected', label: 'Winners Selected', count: briefs.filter(b => getBriefStatus(b) === 'winners_selected').length },
              { key: 'payouts_completed', label: 'Payouts Completed', count: briefs.filter(b => getBriefStatus(b) === 'payouts_completed').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'all' | 'ready' | 'completed' | 'payouts_completed')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Briefs List */}
        <div className="space-y-6">
          {filteredBriefs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                No {activeTab.replace('_', ' ')} briefs found
              </div>
              <p className="text-gray-500">
                {activeTab === 'funded' 
                  ? 'Fund some briefs to start managing rewards'
                  : 'Assign winners to funded briefs to see them here'
                }
              </p>
            </div>
          ) : (
            filteredBriefs.map((brief) => (
              <div
                key={brief.id}
                className={`border rounded-lg p-6 ${
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{brief.title}</h3>
                    <p className="text-gray-400 mb-2">{brief.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Budget: ${brief.totalBudget?.toFixed(2) || '0.00'}</span>
                      <span>•</span>
                      <span>Status: {getBriefStatus(brief).replace('_', ' ')}</span>
                      {brief.fundedAt && (
                        <>
                          <span>•</span>
                          <span>Funded: {new Date(brief.fundedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBrief(selectedBrief?.id === brief.id ? null : brief)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedBrief?.id === brief.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedBrief?.id === brief.id ? 'Hide Details' : 'Manage Rewards'}
                  </button>
                </div>

                {/* Brief Details */}
                {selectedBrief?.id === brief.id && (
                  <div className="mt-6 space-y-6">
                    {/* Reward Tiers */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Reward Tiers</h4>
                      <div className="grid gap-4">
                        {brief.rewardTiers.map((tier) => {
                          const assignment = brief.rewardAssignments.find(ra => ra.rewardTierId === tier.id);
                          return (
                            <div
                              key={tier.id}
                              className={`border rounded-lg p-4 ${
                                assignment
                                  ? 'border-green-500 bg-green-900/20'
                                  : 'border-gray-600 bg-gray-700/50'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-medium">{tier.name}</h5>
                                  <p className="text-sm text-gray-400">{tier.description}</p>
                                  <p className="text-lg font-bold text-green-400">${(tier.amount || 0).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                  {assignment ? (
                                    <div className="text-sm">
                                      <p className="text-green-400">✓ Assigned</p>
                                      <p className="text-gray-400">{assignment.creator.fullName}</p>
                                      <p className="text-xs text-gray-500">
                                        Status: {assignment.payoutStatus}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Unassigned</span>
                                  )}
                                </div>
                              </div>

                              {assignment && (
                                <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                                  <div className="text-sm">
                                    <p>Creator: {assignment.creator.fullName} (@{assignment.creator.userName})</p>
                                    <p>Submitted: {new Date(assignment.submission.submittedAt).toLocaleDateString()}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remove Assignment
                                  </button>
                                </div>
                              )}

                              {!assignment && brief.submissions.length > 0 && (
                                <div className="pt-3 border-t border-gray-600">
                                  <p className="text-sm text-gray-400 mb-2">Available Submissions:</p>
                                  <div className="space-y-2">
                                    {brief.submissions
                                      .filter(sub => !brief.rewardAssignments.some(ra => ra.submissionId === sub.id))
                                      .map((submission) => (
                                        <div
                                          key={submission.id}
                                          className="flex justify-between items-center p-2 bg-gray-600 rounded"
                                        >
                                          <div>
                                            <p className="text-sm">{submission.creator.fullName}</p>
                                            <p className="text-xs text-gray-400">
                                              {submission.content.substring(0, 100)}...
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => handleAssignReward(tier.id, submission.id, submission.creatorId)}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                          >
                                            Assign
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {getBriefStatus(brief) === 'winners_selected' && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleProcessPayouts(brief.id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Process Payouts
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardManagementPage;
