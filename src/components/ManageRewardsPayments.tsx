import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface Submission {
  id: string;
  content: string;
  files?: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  distributedAt?: string;
  winner?: {
    id: string;
    position: number;
    selectedAt: string;
  } | null;
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
    isAvailable?: boolean;
    distributedAt?: string;
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
  const [activeSection, setActiveSection] = useState<'review' | 'winners' | 'payments' | 'finish'>('review');
  const [selectedWinners, setSelectedWinners] = useState<Winner[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'distributed'>('pending');
  const [usedRewardTiers, setUsedRewardTiers] = useState<Set<number>>(new Set());
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

    // CRITICAL: Calculate distributed amount from multiple sources to prevent double counting
    // 1. From database winners (confirmed payments)
    const distributedFromWinners = (brief.winners || []).reduce((sum, winner) => {
      const tier = brief.rewardTiers?.find(t => t.position === winner.position);
      if (tier) {
        let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
        if (amount === 0 && tier.amount) {
          amount = parseFloat(tier.amount.toString()) || 0;
        }
        return sum + amount;
      }
      return sum;
    }, 0);

    // 2. From disabled reward tiers (distributed but not yet in winners table)
    const distributedFromDisabledTiers = brief.rewardTiers
      .filter(tier => !tier.isAvailable)
      .reduce((sum, tier) => {
        let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
        if (amount === 0 && tier.amount) {
          amount = parseFloat(tier.amount.toString()) || 0;
        }
        return sum + amount;
      }, 0);

    // 3. From distributed submissions (final confirmation)
    const distributedFromSubmissions = brief.submissions
      .filter(sub => sub.status === 'distributed')
      .reduce((sum, sub) => {
        // Find the winner record for this submission
        const winner = brief.winners?.find(w => w.submissionId === sub.id);
        if (winner) {
          const tier = brief.rewardTiers?.find(t => t.position === winner.position);
          if (tier) {
            let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
            if (amount === 0 && tier.amount) {
              amount = parseFloat(tier.amount.toString()) || 0;
            }
            return sum + amount;
          }
        }
        return sum;
      }, 0);

    // Use the maximum of the three calculations to ensure we don't undercount
    const totalDistributed = Math.max(distributedFromWinners, distributedFromDisabledTiers, distributedFromSubmissions);


    return totalRewardPool - totalDistributed;
  };

  // Calculate remaining reward pool in real-time (including selected winners)
  const calculateRealTimeRemainingRewardPool = (brief: Brief) => {
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

    // Calculate distributed amount from existing winners
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

    // Also subtract from disabled reward tiers (distributed but not yet in winners table)
    const disabledTierAmount = brief.rewardTiers
      .filter(tier => !tier.isAvailable)
      .reduce((sum, tier) => {
        let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
        if (amount === 0 && tier.amount) {
          amount = parseFloat(tier.amount.toString()) || 0;
        }
        return sum + amount;
      }, 0);

    // Calculate selected winners amount
    const selectedWinnersAmount = selectedWinners.reduce((sum, winner) => {
      return sum + winner.amount;
    }, 0);

    return totalRewardPool - distributedAmount - disabledTierAmount - selectedWinnersAmount;
  };

  // Check if a position is already distributed
  const isPositionDistributed = (brief: Brief, position: number) => {
    return (brief.winners || []).some(winner => winner.position === position);
  };

  // Get ALL used reward tier positions (database winners + current selection)
  const getAllUsedRewardTiers = (brief: Brief): number[] => {
    const usedPositions = new Set<number>();
    
    // Add positions from database winners
    (brief.winners || []).forEach(winner => {
      if (winner.position) {
        usedPositions.add(winner.position);
      }
    });
    
    // Add positions from current selection
    usedRewardTiers.forEach(pos => usedPositions.add(pos));
    
    return Array.from(usedPositions).sort((a, b) => a - b);
  };


  const handleBriefSelect = (brief: Brief) => {
    // CRITICAL: Reset all state when selecting a new brief
    // This prevents state pollution between different briefs
    setSelectedBrief(brief);
    setActiveSection('review');
    setSelectedWinners([]);
    setUsedRewardTiers(new Set()); // Reset used reward tiers when selecting new brief
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
      // Remove winner and free up the reward tier
      const positionMatch = existingWinner.description.match(/Reward (\d+)/);
      const position = positionMatch ? parseInt(positionMatch[1]) : 0;
      
      setSelectedWinners(prev => prev.filter(w => w.submissionId !== submission.id));
      setUsedRewardTiers(prev => {
        const newSet = new Set(prev);
        newSet.delete(position);
        return newSet;
      });
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
      
      // CRITICAL: Validate that the reward tier is still available
      if (rewardTier && !rewardTier.isAvailable) {
        showErrorToast('This reward tier is no longer available');
        return;
      }
      
      // Calculate the total amount (cash + credit) from the tier
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
      
      const newWinner: Winner = {
        submissionId: submission.id,
        creatorId: submission.creator.id,
        rewardType: 'cash',
        amount: tierAmount, // Automatically set from reward tier or legacy reward
        description: `Reward ${nextPosition} for ${selectedBrief?.title || 'brief'}`
      };
      setSelectedWinners(prev => [...prev, newWinner]);
      
      // Mark this reward tier as used
      setUsedRewardTiers(prev => new Set(prev).add(nextPosition));
    }
  };

  const handlePositionChange = (submissionId: string, newPosition: number) => {
    const rewardTier = selectedBrief?.rewardTiers?.find(tier => tier.position === newPosition);
    
    // CRITICAL: Validate that the reward tier is still available
    if (rewardTier && !rewardTier.isAvailable) {
      showErrorToast('This reward tier is no longer available');
      return;
    }
    
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

    // Get the old position to free it up
    const oldWinner = selectedWinners.find(w => w.submissionId === submissionId);
    const oldPositionMatch = oldWinner?.description.match(/Reward (\d+)/);
    const oldPosition = oldPositionMatch ? parseInt(oldPositionMatch[1]) : 0;

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

    // Update used reward tiers
    setUsedRewardTiers(prev => {
      const newSet = new Set(prev);
      if (oldPosition > 0) {
        newSet.delete(oldPosition);
      }
      newSet.add(newPosition);
      return newSet;
    });
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
      const authToken = localStorage.getItem('token');
      if (!authToken) return;

      const response = await fetch('/api/rewards/distribute-with-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
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
      showSuccessToast(`Rewards distributed successfully! ${results.results.successful} payments processed. Submissions moved to distributed list.`);
      
      // Clear selected winners and used reward tiers immediately
      setSelectedWinners([]);
      setUsedRewardTiers(new Set());
      
      
      // CRITICAL: Force immediate UI update by clearing state first
      setSelectedWinners([]);
      setUsedRewardTiers(new Set());
      
      // Refresh briefs data and update selected brief with winner information
      const refreshToken = localStorage.getItem('token');
      if (refreshToken) {
        const refreshResponse = await fetch('/api/brands/briefs', {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        if (refreshResponse.ok) {
          const updatedBriefs = await refreshResponse.json();
          const briefsWithSubmissions = updatedBriefs.filter((brief: Brief) => {
            const hasSubmissions = brief.submissions && brief.submissions.length > 0;
            return hasSubmissions;
          });
          
          setBriefs(briefsWithSubmissions);
          
          // Update the selected brief with fresh data
          if (selectedBrief) {
            const updatedBrief = briefsWithSubmissions.find((b: Brief) => b.id === selectedBrief.id);
            if (updatedBrief) {
              setSelectedBrief(updatedBrief);
            } else {
              // Brief not found in refreshed data
            }
          }
        } else {
          // Failed to refresh brief data
        }
      }
      
      // Navigate to FINISH section
      setActiveSection('finish');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Distribution failed';
      showErrorToast(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getShortlistedSubmissions = () => {
    if (!selectedBrief) return [];
    
    // CRITICAL: Filter approved submissions that are NOT distributed (not yet paid)
    // This prevents payment duplication by excluding submissions that have already been rewarded
    // The distributed status is the SINGLE SOURCE OF TRUTH for paid submissions
    const shortlisted = selectedBrief.submissions.filter(sub => {
      const isDistributed = sub.status === 'distributed';
      const isApproved = sub.status === 'approved';
      
      // Only show if approved AND not distributed
      // Distributed = already paid, so exclude from selection
      return isApproved && !isDistributed;
    });
    
    
    return shortlisted;
  };

  // Get distributed submissions (completed payments)
  const getDistributedSubmissions = () => {
    if (!selectedBrief) return [];
    
    // Return submissions that have been distributed (paid)
    const distributed = selectedBrief.submissions.filter(sub => sub.status === 'distributed');
    
    
    return distributed;
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
    } else if (submissionsFilter === 'distributed') {
      filtered = filtered.filter(sub => sub.status === 'distributed');
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
          {selectedBrief && (
            <>
              <button
                onClick={async () => {
                  
                  // Check database status for each submission
                  const token = localStorage.getItem('token');
                  if (token) {
                    for (const submission of selectedBrief.submissions) {
                      try {
                        const response = await fetch(`/api/debug-submission/${submission.id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (response.ok) {
                          await response.json();
                        }
                      } catch (error) {
                        // Error checking submission status
                      }
                    }
                  }
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Debug Status
              </button>
              <button
                onClick={async () => {
                  if (!selectedBrief) return;
                  
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  
                  // Force distribute all shortlisted submissions
                  const shortlistedSubmissions = getShortlistedSubmissions();
                  
                  for (const submission of shortlistedSubmissions) {
                    try {
                      const response = await fetch(`/api/force-distribute/${submission.id}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      if (response.ok) {
                        await response.json();
                      } else {
                        // Failed to force distribute submission
                      }
                    } catch (error) {
                      // Error force distributing submission
                    }
                  }
                  
                  // Refresh the brief data
                  fetchBriefs();
                  showSuccessToast(`Force distributed ${shortlistedSubmissions.length} submissions!`);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                🚨 Force Distribute
              </button>
            </>
          )}
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
                            // If total is 0, try using the amount field
                            if (total === 0) {
                              const amountTotal = brief.rewardTiers.reduce((sum, t) => sum + (parseFloat(t.amount?.toString()) || 0), 0);
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
                                  // If amount is 0, try using the amount field
                                  if (amount === 0 && tier.amount) {
                                    amount = parseFloat(tier.amount.toString()) || 0;
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
            <button
              onClick={() => setActiveSection('finish')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'finish'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Finish
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
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 dark:text-green-300">
                          Available: {selectedBrief.rewardTiers?.filter(t => t.isAvailable).length || 0} tiers
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 dark:text-red-300">
                          Distributed: {selectedBrief.rewardTiers?.filter(t => !t.isAvailable).length || 0} tiers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${calculateRealTimeRemainingRewardPool(selectedBrief).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Remaining
                    </div>
                    {selectedWinners.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Selected: ${selectedWinners.reduce((sum, winner) => sum + winner.amount, 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Review All Submissions
                </h4>
                {/* Filter Tabs */}
                <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {['all', 'pending', 'approved', 'rejected', 'distributed'].map((filter) => (
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
                          submission.status === 'distributed'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700'
                            : submission.status === 'approved' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                            : submission.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                        }`}>
                          {submission.status === 'distributed' ? '✅ Distributed' : submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
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
                          {submission.status === 'distributed' && (
                            <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                              ✅ Rewards Distributed
                            </span>
                          )}
                        </div>
                        
                        {submission.status === 'pending' && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Awaiting review
                          </div>
                        )}
                        {submission.status === 'distributed' && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Payment completed
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
              
              {/* Display ALL Used Reward Tiers */}
              {selectedBrief && selectedBrief.rewardTiers && selectedBrief.rewardTiers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Reward Tiers Status</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {selectedBrief.rewardTiers.map(tier => {
                      const isUsed = getAllUsedRewardTiers(selectedBrief).includes(tier.position);
                      const isDistributed = isPositionDistributed(selectedBrief, tier.position);
                      const isDisabled = !tier.isAvailable;
                      const emoji = tier.position === 1 ? '🥇' : tier.position === 2 ? '🥈' : tier.position === 3 ? '🥉' : '🏅';
                      let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                      if (amount === 0 && tier.amount) {
                        amount = parseFloat(tier.amount.toString()) || 0;
                      }
                      
                      return (
                        <div 
                          key={tier.position}
                          className={`p-3 rounded-lg border transition-opacity ${
                            isDistributed || isDisabled
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 opacity-50'
                              : isUsed
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 opacity-60'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          }`}
                          style={isDistributed || isUsed || isDisabled ? { filter: 'grayscale(20%)' } : {}}
                        >
                          <div className={`flex items-center justify-between ${isUsed || isDisabled ? 'line-through' : ''}`}>
                            <span className={`text-sm font-medium ${
                              isDistributed || isDisabled
                                ? 'text-red-700 dark:text-red-300'
                                : isUsed
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-green-700 dark:text-green-300'
                            }`}>
                              {emoji} Reward {tier.position}
                            </span>
                            <span className={`text-sm font-semibold ${
                              isDistributed || isDisabled
                                ? 'text-red-900 dark:text-red-100'
                                : isUsed
                                ? 'text-yellow-900 dark:text-yellow-100'
                                : 'text-green-900 dark:text-green-100'
                            }`}>
                              ${amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs mt-1">
                            {isDistributed ? (
                              <span className="text-red-600 dark:text-red-400 font-semibold">✓ Paid & Distributed</span>
                            ) : isDisabled ? (
                              <span className="text-red-600 dark:text-red-400 font-semibold">✗ Disabled</span>
                            ) : isUsed ? (
                              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">⏳ Selected (Pending)</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-semibold">✓ Available</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {getShortlistedSubmissions().length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {selectedBrief.submissions.filter(s => s.status === 'approved').length === 0 
                      ? 'No shortlisted submissions yet. Accept some submissions first.'
                      : selectedBrief.submissions.filter(s => s.status === 'distributed').length > 0
                      ? 'All shortlisted submissions have been distributed! All rewards have been paid.'
                      : 'No eligible submissions available for winner selection.'}
                  </p>
                  
                  {/* Show distributed submissions count */}
                  {getDistributedSubmissions().length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 dark:text-green-400 font-medium">
                          {getDistributedSubmissions().length} submission{getDistributedSubmissions().length !== 1 ? 's' : ''} already distributed
                        </span>
                      </div>
                    </div>
                  )}
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
                              
                              
                              return (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Position:</span>
                                    <select
                                      value={position}
                                      onChange={(e) => handlePositionChange(submission.id, parseInt(e.target.value))}
                                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {selectedBrief?.rewardTiers?.map(tier => {
                                        const pos = tier.position;
                                        const emoji = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '🏅';
                                        
                                        // Calculate amount for this position
                                        let amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                                        if (amount === 0 && tier.amount) {
                                          amount = parseFloat(tier.amount.toString()) || 0;
                                        }
                                        
                                        // Check if this position is already used (by others OR by database)
                                        const isUsedByOthers = selectedWinners.some(w => {
                                          const winnerPos = w.description.match(/Reward (\d+)/);
                                          return winnerPos && parseInt(winnerPos[1]) === pos && w.submissionId !== submission.id;
                                        });
                                        const isDistributed = isPositionDistributed(selectedBrief, pos);
                                        const isDisabled = !tier.isAvailable;
                                        const isTaken = isUsedByOthers || isDistributed || isDisabled;
                                        
                                        return (
                                          <option 
                                            key={pos} 
                                            value={pos}
                                            disabled={isTaken}
                                            style={isTaken ? { opacity: 0.4, textDecoration: 'line-through' } : {}}
                                          >
                                            {emoji} Reward {pos} (${amount.toFixed(2)}) {isTaken ? (isDisabled ? '✗ DISABLED' : '✗ USED/DISTRIBUTED') : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                  {/* Show ALL used reward tiers (database + current selection) */}
                                  {selectedBrief && getAllUsedRewardTiers(selectedBrief).length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Used Reward Tiers (Cancelled Out):</div>
                                      <div className="flex flex-wrap gap-1">
                                        {getAllUsedRewardTiers(selectedBrief).map(pos => {
                                          const tier = selectedBrief?.rewardTiers?.find(t => t.position === pos);
                                          const emoji = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '🏅';
                                          let amount = 0;
                                          if (tier) {
                                            amount = (tier.cashAmount || 0) + (tier.creditAmount || 0);
                                            if (amount === 0 && tier.amount) {
                                              amount = parseFloat(tier.amount.toString()) || 0;
                                            }
                                          }
                                          
                                          // Check if it's from database (already distributed) or current selection
                                          const isDistributed = isPositionDistributed(selectedBrief, pos);
                                          
                                          return (
                                            <span 
                                              key={pos} 
                                              className={`inline-flex items-center px-2 py-1 text-xs rounded-md line-through ${
                                                isDistributed 
                                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700' 
                                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                              }`}
                                            >
                                              {emoji} Reward {pos} (${amount.toFixed(2)}) {isDistributed && '✓ Paid'}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
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
              
              {/* Confirmation Button */}
              {selectedWinners.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        Ready to Proceed?
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You have selected {selectedWinners.length} winner{selectedWinners.length > 1 ? 's' : ''} with a total reward of ${selectedWinners.reduce((sum, winner) => sum + winner.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('payments')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Proceed to Distribute Rewards →
                    </button>
                  </div>
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

          {activeSection === 'finish' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Brief Completed Successfully
              </h4>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h5 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Rewards Distributed Successfully!
                  </h5>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  All rewards have been distributed to the selected winners. The brief is now complete.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Brief Summary</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Submissions:</span>
                        <span className="font-medium">{selectedBrief?.submissions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Winners Selected:</span>
                        <span className="font-medium">{selectedWinners.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Rewards Distributed:</span>
                        <span className="font-medium text-green-600">${selectedWinners.reduce((sum, winner) => sum + winner.amount, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Next Steps</h6>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>• Winners will receive payment notifications</p>
                      <p>• Brief will be marked as completed</p>
                      <p>• You can view payment history in your dashboard</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setActiveSection('review')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                  >
                    Review Another Brief
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBrief(null);
                      setActiveSection('review');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Back to All Briefs
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageRewardsPayments;
