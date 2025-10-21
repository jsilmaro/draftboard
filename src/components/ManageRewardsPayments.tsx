import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface Submission {
  id: string;
  content: string;
  files?: string;
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
    isVerified?: boolean;
    stripeAccount?: {
      id: string;
      status: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    } | null;
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
  amountOfWinners?: number;
  submissions: Submission[];
  rewardTiers?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    amount: number;
  }>;
  winners?: Array<{
    id: string;
    position: number;
    submissionId: string;
    creatorId: string;
    selectedAt: string;
  }>;
  rewardAssignments?: Array<{
    id: string;
    position: number;
    creatorId: string;
    submissionId: string;
    status: string;
    payoutStatus: string;
  }>;
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
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
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
          const hasSubmissions = brief.submissions && brief.submissions.length > 0;
          return hasSubmissions;
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

  // Calculate remaining reward pool
  const calculateRemainingRewardPool = (brief: Brief) => {
    if (!brief.rewardTiers || brief.rewardTiers.length === 0) {
      return brief.reward || 0;
    }

    const totalRewardPool = brief.rewardTiers.reduce((sum, tier) => {
      let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
      // If amount is 0, try using the amount field
      if (amount === 0 && tier.amount) {
        amount = parseFloat(tier.amount.toString()) || 0;
      }
      return sum + amount;
    }, 0);

    const distributedAmount = (brief.winners || []).reduce((sum, winner) => {
      const tier = brief.rewardTiers?.find(t => t.position === winner.position);
      if (tier) {
        let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
        // If amount is 0, try using the amount field
        if (amount === 0 && tier.amount) {
          amount = parseFloat(tier.amount.toString()) || 0;
        }
        return sum + amount;
      }
      return sum;
    }, 0);

    return totalRewardPool - distributedAmount;
  };

  // Check if a position is already distributed
  const isPositionDistributed = (brief: Brief, position: number) => {
    return (brief.winners || []).some(winner => winner.position === position);
  };

  // Get available positions (not yet distributed)
  const getAvailablePositions = (brief: Brief) => {
    if (!brief.rewardTiers || brief.rewardTiers.length === 0) {
      const maxWinners = brief.amountOfWinners || 1;
      return Array.from({ length: maxWinners }, (_, i) => i + 1);
    }

    return brief.rewardTiers
      .filter(tier => !isPositionDistributed(brief, tier.position))
      .map(tier => tier.position)
      .sort((a, b) => a - b);
  };

  const handleBriefSelect = (brief: Brief) => {
    console.log('📋 Selected brief:', brief.title);
    console.log('📋 Reward tiers:', brief.rewardTiers);
    console.log('📋 Legacy reward:', brief.reward);
    console.log('📋 Winners:', brief.winners);
    console.log('📋 Remaining reward pool:', calculateRemainingRewardPool(brief));
    console.log('📋 Full brief object:', brief);
    
    // Debug reward tier calculations
    if (brief.rewardTiers && brief.rewardTiers.length > 0) {
      console.log('📋 Reward tier calculations:');
      brief.rewardTiers.forEach((tier, index) => {
        console.log(`  Tier ${index + 1}:`, {
          position: tier.position,
          cashAmount: tier.cashAmount,
          creditAmount: tier.creditAmount,
          amount: tier.amount,
          total: (tier.cashAmount || 0) + (tier.creditAmount || 0)
        });
      });
    }
    
    setSelectedBrief(brief);
    setActiveSection('review');
    setSelectedWinners([]);
    setSubmissionsFilter('pending');
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
      // Find the next available position (first unclaimed position)
      const claimedPositions = selectedWinners.map(w => {
        // Extract position from description if it exists
        const match = w.description.match(/Reward (\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      let nextPosition = 1;
      while (claimedPositions.includes(nextPosition)) {
        nextPosition++;
      }
      
      // Get the reward tier for this position
      const rewardTier = selectedBrief?.rewardTiers?.find(tier => tier.position === nextPosition);
      
      console.log(`🔍 Looking for reward tier at position ${nextPosition}`);
      console.log(`🔍 Available reward tiers:`, selectedBrief?.rewardTiers);
      console.log(`🔍 Found reward tier:`, rewardTier);
      
      // Calculate the total amount (cash + credit) from the tier
      let tierAmount = 0;
      if (rewardTier) {
        // Try multiple ways to get the amount
        tierAmount = (rewardTier.cashAmount || 0) + (rewardTier.creditAmount || 0);
        if (tierAmount === 0 && rewardTier.amount) {
          tierAmount = parseFloat(rewardTier.amount.toString()) || 0;
        }
        console.log(`💰 Found reward tier for position ${nextPosition}:`, tierAmount);
        console.log(`💰 Reward tier details:`, {
          position: rewardTier.position,
          cashAmount: rewardTier.cashAmount,
          creditAmount: rewardTier.creditAmount,
          amount: rewardTier.amount
        });
      } else {
        // Fallback: If no reward tiers, divide the legacy reward by number of winners
        const amountOfWinners = selectedBrief?.amountOfWinners || 1;
        tierAmount = (selectedBrief?.reward || 0) / amountOfWinners;
        console.log(`💰 Using legacy reward divided by winners: ${tierAmount} (${selectedBrief?.reward} / ${amountOfWinners})`);
      }
      
      const newWinner: Winner = {
        submissionId: submission.id,
        creatorId: submission.creator.id,
        rewardType: 'cash',
        amount: tierAmount, // Automatically set from reward tier or legacy reward
        description: `Reward ${nextPosition} for ${selectedBrief?.title || 'brief'}`
      };
      setSelectedWinners(prev => [...prev, newWinner]);
    }
  };

  const handlePositionChange = (submissionId: string, newPosition: number) => {
    const rewardTier = selectedBrief?.rewardTiers?.find(tier => tier.position === newPosition);
    
    let tierAmount = 0;
    if (rewardTier) {
      // Try multiple ways to get the amount
      tierAmount = (rewardTier.cashAmount || 0) + (rewardTier.creditAmount || 0);
      if (tierAmount === 0 && rewardTier.amount) {
        tierAmount = parseFloat(rewardTier.amount.toString()) || 0;
      }
    } else {
      // Fallback: If no reward tiers, divide the legacy reward by number of winners
      const amountOfWinners = selectedBrief?.amountOfWinners || 1;
      tierAmount = (selectedBrief?.reward || 0) / amountOfWinners;
    }

    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.submissionId === submissionId 
          ? { 
              ...winner, 
              amount: tierAmount,
              description: `Reward ${newPosition} for ${selectedBrief?.title || 'brief'}`
            }
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
      setActiveSection('winners');
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
        <div className="flex space-x-2">
          <button
            onClick={fetchBriefs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
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
                <p>1. Create a brief and publish it</p>
                <p>2. Wait for creators to submit work</p>
                <p>3. Review submissions in the &quot;Review Submissions&quot; tab</p>
                <p>4. Shortlist (approve) submissions</p>
                <p>5. Select winners and distribute rewards</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Debug Tip:</strong> Check the browser console for detailed logs about briefs and submissions data.
                </p>
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
                  {brief.rewardTiers && brief.rewardTiers.length > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Reward Pool:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${(() => {
                            const total = brief.rewardTiers.reduce((sum, t) => sum + (t.cashAmount || 0) + (t.creditAmount || 0), 0);
                            console.log(`💰 Brief "${brief.title}" total calculation:`, {
                              rewardTiers: brief.rewardTiers,
                              total: total
                            });
                            // If total is 0, try using the amount field
                            if (total === 0) {
                              const amountTotal = brief.rewardTiers.reduce((sum, t) => sum + (parseFloat(t.amount?.toString()) || 0), 0);
                              console.log(`💰 Using amount field instead:`, amountTotal);
                              return amountTotal;
                            }
                            return total;
                          })().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                        <span className={`font-medium ${calculateRemainingRewardPool(brief) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          ${calculateRemainingRewardPool(brief).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {brief.rewardTiers.map((tier, idx) => {
                          const isDistributed = isPositionDistributed(brief, tier.position);
                          return (
                            <div key={idx} className={`flex justify-between ${isDistributed ? 'line-through text-gray-400' : ''}`}>
                              <span>
                                Reward {tier.position} {isDistributed ? '(Distributed)' : ''}:
                              </span>
                              <span className={isDistributed ? 'text-gray-400' : ''}>
                                ${(() => {
                                  let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                                  console.log(`💰 Tier ${tier.position} calculation:`, {
                                    tier: tier,
                                    cashAmount: tier.cashAmount,
                                    creditAmount: tier.creditAmount,
                                    amount: tier.amount,
                                    calculated: amount
                                  });
                                  // If amount is 0, try using the amount field
                                  if (amount === 0 && tier.amount) {
                                    amount = parseFloat(tier.amount.toString()) || 0;
                                    console.log(`💰 Using amount field for tier ${tier.position}:`, amount);
                                  }
                                  return amount;
                                })().toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Reward:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${brief.reward.toFixed(2)}
                      </span>
                    </div>
                  )}
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
              Distribute Rewards
            </button>
          </div>

          {/* Section Content */}
          {activeSection === 'review' && (
            <div className="space-y-4">
              {/* Reward Pool Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Reward Pool Status
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Track remaining rewards for this brief
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${calculateRemainingRewardPool(selectedBrief).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Remaining
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Review All Submissions
                </h4>
                {/* Filter Tabs */}
                <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSubmissionsFilter(filter as typeof submissionsFilter)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        submissionsFilter === filter
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
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
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center">
                            <img src="/icons/profile.png" alt="User" className="w-10 h-10" />
                          </div>
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {submission.creator.fullName}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{submission.creator.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          submission.status === 'approved' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                            : submission.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Submission Content:
                        </h6>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                          {submission.files && (
                            <div className="flex items-center space-x-3">
                              <a 
                                href={submission.files} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Submitted Content
                              </a>
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs" title={submission.files}>
                                {submission.files}
                              </span>
                            </div>
                          )}
                          {submission.content && submission.content.trim() && (
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {submission.content}
                              </p>
                            </div>
                          )}
                          {!submission.files && (!submission.content || !submission.content.trim()) && (
                            <p className="text-sm italic text-gray-500 dark:text-gray-400">
                              No content submitted
                            </p>
                          )}
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
                            <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                              ✓ Shortlisted
                            </span>
                          )}
                          {submission.status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
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
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const winner = selectedWinners.find(w => w.submissionId === submission.id);
                              const positionMatch = winner?.description.match(/Reward (\d+)/);
                              const position = positionMatch ? parseInt(positionMatch[1]) : 1;
                              
                              // Get available positions (not yet distributed)
                              const availablePositions = getAvailablePositions(selectedBrief);
                              
                              return (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Position:</span>
                                    <select
                                      value={position}
                                      onChange={(e) => handlePositionChange(submission.id, parseInt(e.target.value))}
                                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {availablePositions.map(pos => {
                                        const tier = selectedBrief?.rewardTiers?.find(t => t.position === pos);
                                        const emoji = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '🏅';
                                        
                                        // Calculate amount for this position
                                        let amount = 0;
                                        if (tier) {
                                          // Try multiple ways to get the amount
                                          amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                                          if (amount === 0 && tier.amount) {
                                            amount = parseFloat(tier.amount.toString()) || 0;
                                          }
                                          console.log(`🎯 Position ${pos} tier found:`, tier, 'amount:', amount);
                                        } else {
                                          // Fallback: Use legacy reward divided by winners
                                          const amountOfWinners = selectedBrief?.amountOfWinners || 1;
                                          amount = (selectedBrief?.reward || 0) / amountOfWinners;
                                          console.log(`🎯 Position ${pos} using fallback:`, amount);
                                        }
                                        
                                        return (
                                          <option key={pos} value={pos}>
                                            {emoji} Reward {pos} (${amount.toFixed(2)})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-700">
                                    <span className="text-sm text-green-700 dark:text-green-300 font-semibold">
                                      ${winner?.amount?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
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
