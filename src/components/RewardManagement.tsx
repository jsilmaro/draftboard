import React, { useState, useEffect, useCallback } from 'react';

interface Brief {
  id: string;
  title: string;
  description: string;
  reward: number;
  totalRewardValue?: number;
  status: string;
  createdAt: string;
  submissions: Submission[];
  winnerRewards?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;

  }>;
}

interface Submission {
  id: string;
  creator: {
    id: string;
    userName: string;
    fullName: string;
  };
}

interface RewardPool {
  id: string;
  briefId: string;
  totalAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
  brief: Brief;
}

interface Analytics {
  totalPools: number;
  totalDistributed: number;
  averagePoolSize: number;
  activePools: number;
}

interface RewardManagementProps {
  userType: 'brand' | 'creator';
  userId: string;
  token: string;
}

interface WalletData {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
}

const RewardManagement: React.FC<RewardManagementProps> = ({ userType, userId: _userId, token }) => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [rewardPools, setRewardPools] = useState<RewardPool[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showCreatePool, setShowCreatePool] = useState(false);

  const [poolAmount, setPoolAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showSelectWinners, setShowSelectWinners] = useState(false);
  const [selectedPool, setSelectedPool] = useState<RewardPool | null>(null);
  const [submissions, setSubmissions] = useState<{
    id: string;
    creatorId: string;
    creatorName?: string;
    creatorEmail?: string;
    content?: string;
    files?: string[];
    submittedAt?: string | number | Date;
    amount?: number;
    creator?: {
      id: string;
      fullName?: string;
      userName?: string;
      email?: string;
    };
    [key: string]: unknown;
  }[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [winnerRewards, setWinnerRewards] = useState<{[key: string]: number}>({}); // Stores position for each submission
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string;
    creator?: { id: string; fullName?: string; userName?: string; email?: string };
    creatorName?: string;
    creatorEmail?: string;
    content?: string;
    files?: string | string[];
    submittedAt?: string;
  } | null>(null);

  // Debug token
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🔍 RewardManagement - Token debug:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      userType,
      userId: _userId
    });
  }, [token, userType, _userId]);

  const fetchBriefs = useCallback(async () => {
    try {
      const response = await fetch('/api/brands/briefs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('Fetched briefs:', data);
        // The API returns briefs directly as an array, not wrapped in an object
        const allBriefs = Array.isArray(data) ? data : [];
        // Filter to only show published/active briefs (not drafts)
        const publishedBriefs = allBriefs.filter(brief => 
          brief.status === 'published'
        );
        // eslint-disable-next-line no-console
        console.log('All briefs:', allBriefs.length, 'Published briefs:', publishedBriefs.length);
        setBriefs(publishedBriefs);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching briefs:', error);
    }
  }, [token]);

  const fetchRewardPools = useCallback(async () => {
    try {
      // Check if token is valid
      if (!token || token.trim() === '') {
        // eslint-disable-next-line no-console
        console.error('❌ No valid token provided for reward pools request');
        setRewardPools([]);
        return;
      }

      const response = await fetch('/api/rewards/brand/pools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRewardPools(data || []);
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch reward pools:', response.status, response.statusText);
        setRewardPools([]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching reward pools:', error);
      setRewardPools([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchWalletData = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData({
          balance: data.balance || 0,
          totalDeposited: data.totalDeposited || 0,
          totalSpent: data.totalSpent || 0
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching wallet data:', error);
    }
  }, [token]);

  const fetchSubmissions = useCallback(async (briefId: string) => {
    try {
      const response = await fetch(`/api/brands/briefs/${briefId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data || []);
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch submissions:', response.status, response.statusText);
        setSubmissions([]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/rewards/analytics/brand', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching analytics:', error);
    }
  }, [token]);

  useEffect(() => {
    if (userType === 'brand') {
      fetchBriefs();
      fetchRewardPools();
      fetchAnalytics();
      fetchWalletData();
    }
  }, [userType, fetchBriefs, fetchRewardPools, fetchAnalytics, fetchWalletData]);


  const createRewardPool = async () => {
    if (!selectedBrief || !poolAmount) return;

    try {
      const response = await fetch('/api/rewards/create-pool', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          briefId: selectedBrief.id,
          amount: parseFloat(poolAmount)
        })
      });

      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('Reward pool created successfully');
        setShowCreatePool(false);
        setPoolAmount('');
        setSelectedBrief(null);
        fetchRewardPools(); // Refresh pools
      } else {
        const error = await response.json();
        alert(`Failed to create reward pool: ${error.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating reward pool:', error);
      alert('Failed to create reward pool');
    }
  };



  const handleSelectWinners = (pool: RewardPool) => {
    setSelectedPool(pool);
    setShowSelectWinners(true);
    fetchSubmissions(pool.briefId);
  };

  const handleWinnerSelection = (submissionId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedWinners(prev => [...prev, submissionId]);
      setWinnerRewards(prev => ({ ...prev, [submissionId]: 0 }));
    } else {
      setSelectedWinners(prev => prev.filter(id => id !== submissionId));
      setWinnerRewards(prev => {
        const newRewards = { ...prev };
        delete newRewards[submissionId];
        return newRewards;
      });
    }
  };

  const handleRewardAmountChange = (submissionId: string, amount: number) => {
    setWinnerRewards(prev => ({ ...prev, [submissionId]: amount }));
  };

  const distributeRewardsToWinners = async () => {
    if (!selectedPool || selectedWinners.length === 0) return;

    // Calculate total reward amount using calculated amounts from database
    const totalRewardAmount = selectedWinners.reduce((sum, submissionId) => {
      const position = winnerRewards[submissionId];
      if (position && selectedPool.brief.winnerRewards && selectedPool.brief.winnerRewards.length > 0) {
        const reward = selectedPool.brief.winnerRewards.find(r => r.position === position);
        return sum + (reward?.cashAmount || 0) + (reward?.creditAmount || 0);
      } else if (position) {
        // Fallback calculation if winnerRewards is not available
        const fallbackAmounts = { 1: 0.5, 2: 0.3, 3: 0.2 };
        return sum + (selectedPool.totalAmount * (fallbackAmounts[position as keyof typeof fallbackAmounts] || 0));
      }
      return sum;
    }, 0);
    
    if (totalRewardAmount > selectedPool.remainingAmount) {
      alert('Total reward amount exceeds remaining pool amount');
      return;
    }

    try {
      const requestData = {
        poolId: selectedPool.id,
        winners: selectedWinners.map(submissionId => {
          const position = winnerRewards[submissionId];
          let amount = 0;
          if (position && selectedPool.brief.winnerRewards && selectedPool.brief.winnerRewards.length > 0) {
            const reward = selectedPool.brief.winnerRewards.find(r => r.position === position);
            amount = (reward?.cashAmount || 0) + (reward?.creditAmount || 0);
          } else if (position) {
            // Fallback calculation if winnerRewards is not available
            const fallbackAmounts = { 1: 0.5, 2: 0.3, 3: 0.2 };
            amount = selectedPool.totalAmount * (fallbackAmounts[position as keyof typeof fallbackAmounts] || 0);
          }
          return {
            submissionId,
            amount: amount
          };
        })
      };
      
      // Debug: Sending distribute request
      
      const response = await fetch('/api/rewards/distribute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        alert('Rewards distributed successfully!');
        setShowSelectWinners(false);
        setSelectedWinners([]);
        setWinnerRewards({});
        fetchRewardPools(); // Refresh pools
        fetchWalletData(); // Refresh wallet
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        // Debug: Distribute rewards failed
        alert(`Failed to distribute rewards: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error distributing rewards:', error);
      alert('Error distributing rewards');
    }
  };

  const handleCreatePool = () => {
    setShowCreatePool(true);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm border border-white/10 dark:border-gray-700/30 rounded-lg shadow-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Reward Management</h2>

        {/* Wallet Balance Section */}
        {walletData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Current Balance</h3>
              <p className="text-2xl font-bold">${walletData.balance.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Total Deposited</h3>
              <p className="text-2xl font-bold">${walletData.totalDeposited.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Total Spent</h3>
              <p className="text-2xl font-bold">${walletData.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Total Pools</h3>
              <p className="text-2xl font-bold">{analytics.totalPools}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Total Distributed</h3>
              <p className="text-2xl font-bold">${analytics.totalDistributed.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Average Pool Size</h3>
              <p className="text-2xl font-bold">${analytics.averagePoolSize.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-medium opacity-90">Active Pools</h3>
              <p className="text-2xl font-bold">{analytics.activePools}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleCreatePool}
            className="bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-blue-500/30 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Reward Pool
          </button>
        </div>

        {/* Reward Pools List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Creator Reward Pools</h3>
              <p className="text-gray-300">Manage and distribute rewards to talented creators</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Pools</p>
                <p className="text-2xl font-bold text-white">{rewardPools.length}</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6">
            {rewardPools.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <img src="/icons/Green_icons/Trophy1.png" alt="Trophy" className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">No Reward Pools Yet</h4>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Create your first reward pool to start recognizing and rewarding the amazing creators in your community.
                </p>
                <button
                  onClick={handleCreatePool}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create First Pool
                </button>
              </div>
            ) : (
              rewardPools.map((pool) => (
                <div key={pool.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-200 group">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Section - Pool Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <img src="/icons/Green_icons/Trophy1.png" alt="Diamond" className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                            {pool.brief.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              {new Date(pool.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              {pool.status === 'active' ? 'Active' : 'Completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">Pool Progress</span>
                          <span className="text-white font-medium">
                            ${(pool.totalAmount - pool.remainingAmount).toFixed(2)} / ${pool.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${((pool.totalAmount - pool.remainingAmount) / pool.totalAmount) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Amounts & Actions */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">
                          ${pool.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">Total Pool Value</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-400 mb-1">
                          ${pool.remainingAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">Available</div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        pool.status === 'active' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {pool.status === 'active' ? '🟢 Active' : '⚫ Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {pool.status === 'active' && pool.remainingAmount > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-700/30">
                      <button
                        onClick={() => handleSelectWinners(pool)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <img src="/icons/Green_icons/Target1.png" alt="Target" className="w-4 h-4" />
                        Select Winners
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Pool Modal */}
        {showCreatePool && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreatePool(false);
              }
            }}
          >
            <div 
              className="bg-gray-800 border border-blue-500 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{
                maxHeight: '90vh',
                margin: 'auto'
              }}
            >
              <div className="bg-blue-600 rounded-lg p-4 mb-6">
                <h3 className="text-2xl font-bold text-white">Create Reward Pool</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Select Brief
                  </label>
                  <select
                    value={selectedBrief?.id || ''}
                    onChange={(e) => {
                      const brief = briefs.find(b => b.id === e.target.value);
                      setSelectedBrief(brief || null);
                      // Auto-calculate pool amount based on brief's calculated reward tiers
                      if (brief && brief.winnerRewards && brief.winnerRewards.length > 0) {
                        const calculatedTotal = brief.winnerRewards.reduce((sum, reward) => 
                          sum + (reward.cashAmount || 0) + (reward.creditAmount || 0), 0
                        );
                        setPoolAmount(calculatedTotal.toFixed(2));
                      } else {
                        setPoolAmount(brief?.reward?.toFixed(2) || '');
                      }
                    }}
                    className="w-full px-3 py-2 border border-blue-400/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white font-medium"
                    required
                  >
                    <option value="">Select a brief</option>
                    {briefs.length === 0 ? (
                      <option value="" disabled>No briefs available</option>
                    ) : (
                      briefs.map((brief) => (
                        <option key={brief.id} value={brief.id}>
                          {brief.title} - ${brief.totalRewardValue || brief.reward || 0}
                        </option>
                      ))
                    )}
                  </select>
                  {briefs.length === 0 && (
                    <p className="text-sm text-yellow-400 mt-1">
                      No published briefs available. Create and publish a brief first to set up reward pools.
                    </p>
                  )}
                </div>

                {/* Display calculated reward breakdown */}
                {selectedBrief && selectedBrief.winnerRewards && selectedBrief.winnerRewards.length > 0 && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-200 mb-3">Reward Breakdown (Auto-calculated)</h4>
                    <div className="space-y-2">
                      {selectedBrief.winnerRewards.map((reward) => (
                        <div key={reward.position} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {reward.position === 1 ? '1st Place' : 
                             reward.position === 2 ? '2nd Place' : 
                             reward.position === 3 ? '3rd Place' : 
                             `${reward.position}th Place`}
                          </span>
                          <span className="text-white font-medium">
                            ${((reward.cashAmount || 0) + (reward.creditAmount || 0)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-blue-500/30 pt-2 mt-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-blue-200">Total Pool Amount:</span>
                          <span className="text-white">
                            ${selectedBrief.winnerRewards.reduce((sum, reward) => 
                              sum + (reward.cashAmount || 0) + (reward.creditAmount || 0), 0
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Pool Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={poolAmount}
                    onChange={(e) => setPoolAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-400/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white font-medium"
                    placeholder="Enter amount"
                    required
                  />
                  {selectedBrief && selectedBrief.winnerRewards && selectedBrief.winnerRewards.length > 0 && (
                    <p className="text-sm text-blue-200 mt-2">
                      This amount should match the calculated total: $
                      {selectedBrief.winnerRewards.reduce((sum, reward) => 
                        sum + (reward.cashAmount || 0) + (reward.creditAmount || 0), 0
                      ).toFixed(2)}
                    </p>
                  )}
                  {walletData && parseFloat(poolAmount) > walletData.balance && (
                    <p className="text-sm text-red-200 mt-2 bg-red-600 p-2 rounded border border-red-500">
                      ⚠️ Insufficient wallet balance. Current balance: ${walletData.balance.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createRewardPool}
                    disabled={!selectedBrief || !poolAmount || !!(walletData && parseFloat(poolAmount || '0') > walletData.balance)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 border border-blue-500 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Create Pool
                  </button>
                  <button
                    onClick={() => setShowCreatePool(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 border border-gray-500 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Select Winners Modal */}
        {showSelectWinners && selectedPool && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-blue-500 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-blue-600 rounded-lg p-4 mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Select Winners for {selectedPool.brief.title}</h3>
                <p className="text-blue-100 font-medium">Pool Amount: ${selectedPool.totalAmount.toFixed(2)} | Remaining: ${selectedPool.remainingAmount.toFixed(2)}</p>
              </div>
              
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <p className="text-gray-300 text-center py-8">No submissions available for this brief.</p>
                ) : (
                  submissions.map((submission: {
                    [key: string]: unknown;
                    id: string;
                    creatorId: string;
                    creatorName?: string;
                    creatorEmail?: string;
                    content?: string;
                    files?: string[] | string;
                    submittedAt?: string | number | Date;
                    amount?: number;
                    creator?: { id: string; fullName?: string; userName?: string; email?: string };
                  }) => {
                    // Ensure submission has required properties
                    if (!submission || !submission.id) {
                      // eslint-disable-next-line no-console
                      console.warn('Invalid submission data:', submission);
                      return null;
                    }
                    
                    return (
                    <div key={submission.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                      selectedWinners.includes(submission.id) 
                        ? 'bg-green-600 border-green-400 shadow-lg' 
                        : 'bg-gray-700 border-gray-500 hover:border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedWinners.includes(submission.id)}
                            onChange={(e) => handleWinnerSelection(submission.id, e.target.checked)}
                            className="w-5 h-5 text-green-600 bg-gray-700 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{submission.creator?.fullName || submission.creatorName || 'Unknown Creator'}</h4>
                            <p className="text-sm text-blue-200">@{submission.creator?.userName || 'unknown'}</p>
                            <p className="text-sm text-gray-300">Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Unknown date'}</p>
                            
                            {/* Submission Content Preview */}
                            <div className="mt-2">
                              {(() => {
                                // Function to detect and make URLs clickable
                                const makeLinksClickable = (text: string) => {
                                  if (!text) return text;
                                  
                                  // URL regex pattern
                                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                                  const parts = text.split(urlRegex);
                                  
                                  return parts.map((part, index) => {
                                    if (urlRegex.test(part)) {
                                      return (
                                        <a
                                          key={index}
                                          href={part}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 underline break-all"
                                        >
                                          {part}
                                        </a>
                                      );
                                    }
                                    return part;
                                  });
                                };


                                // Extract actual submission content
                                let displayContent = '';

                                if (submission.content) {
                                  try {
                                    const parsedContent = JSON.parse(submission.content);
                                    if (parsedContent.originalContent) {
                                      if (typeof parsedContent.originalContent === 'string') {
                                        try {
                                          const innerContent = JSON.parse(parsedContent.originalContent);
                                          displayContent = innerContent.originalContent || '';
                                        } catch (e) {
                                          displayContent = parsedContent.originalContent || '';
                                        }
                                      }
                                    }
                                  } catch (e) {
                                    displayContent = submission.content;
                                  }
                                }

                                // Also check for files field (submission links)
                                // Handle both string and array formats for files
                                let fileLinks: string[] = [];
                                if (submission.files) {
                                  if (typeof submission.files === 'string') {
                                    // If it's a string, treat it as a single link
                                    fileLinks = [submission.files];
                                  } else if (Array.isArray(submission.files)) {
                                    // If it's an array, use it directly
                                    fileLinks = submission.files;
                                  }
                                }

                                if (fileLinks.length > 0) {
                                  return (
                                    <div className="space-y-2">
                                      <div className="text-sm text-gray-300">
                                        <span className="font-medium text-white">Submitted Links:</span>
                                      </div>
                                      <div className="space-y-1">
                                        {fileLinks.map((file: string, index: number) => (
                                          <div key={index} className="bg-gray-800 rounded p-2">
                                            <a
                                              href={file}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 underline break-all text-sm"
                                            >
                                              📎 Link {index + 1}: {file}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                      {displayContent && (
                                        <div className="text-sm text-gray-300">
                                          <span className="font-medium text-white">Content:</span>
                                          <div className="mt-1">
                                            {displayContent.length > 100 
                                              ? makeLinksClickable(`${displayContent.substring(0, 100)}...`)
                                              : makeLinksClickable(displayContent)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                } else if (displayContent && displayContent.trim() !== '') {
                                  return (
                                    <div className="text-sm text-gray-300">
                                      <span className="font-medium text-white">Content:</span>
                                      <div className="mt-1">
                                        {displayContent.length > 100 
                                          ? makeLinksClickable(`${displayContent.substring(0, 100)}...`)
                                          : makeLinksClickable(displayContent)}
                                      </div>
                                    </div>
                                  );
                                }

                                // No content found
                                return (
                                  <div className="text-sm text-gray-400 italic">
                                    No submission content or links provided
                                  </div>
                                );
                              })()}
                              
                            </div>
                            
                          </div>
                        </div>
                        {selectedWinners.includes(submission.id) && (
                          <div className="flex items-center space-x-2 bg-green-500 rounded-lg px-3 py-2 border border-green-300">
                            <label className="text-sm text-white font-medium">Position:</label>
                            <select
                              value={winnerRewards[submission.id] || ''}
                              onChange={(e) => handleRewardAmountChange(submission.id, parseInt(e.target.value) || 0)}
                              className="w-32 px-2 py-1 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 text-sm font-medium"
                            >
                              <option value="">Select</option>
                              {selectedPool.brief.winnerRewards && selectedPool.brief.winnerRewards.length > 0 ? (
                                selectedPool.brief.winnerRewards.map((reward) => (
                                <option key={reward.position} value={reward.position}>
                                  {reward.position === 1 ? '1st' : reward.position === 2 ? '2nd' : reward.position === 3 ? '3rd' : `${reward.position}th`} - ${(reward.cashAmount + reward.creditAmount).toFixed(2)}
                                </option>
                                ))
                              ) : (
                                // Fallback options if winnerRewards is not available
                                <>
                                  <option value="1">1st - ${(selectedPool.totalAmount * 0.5).toFixed(2)}</option>
                                  <option value="2">2nd - ${(selectedPool.totalAmount * 0.3).toFixed(2)}</option>
                                  <option value="3">3rd - ${(selectedPool.totalAmount * 0.2).toFixed(2)}</option>
                                </>
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  }).filter(Boolean) // Remove null entries
                )}
              </div>

              {selectedWinners.length > 0 && (
                <div className="mt-6 p-4 bg-green-600 border border-green-400 rounded-lg">
                  <h4 className="font-semibold text-white mb-2 text-lg">Selected Winners Summary</h4>
                  <p className="text-green-100 font-medium">
                    Total Winners: <span className="text-white font-bold">{selectedWinners.length}</span> | 
                    Total Reward Amount: <span className="text-white font-bold">${selectedWinners.reduce((sum, submissionId) => {
                      const position = winnerRewards[submissionId];
                      if (position && selectedPool.brief.winnerRewards && selectedPool.brief.winnerRewards.length > 0) {
                        const reward = selectedPool.brief.winnerRewards.find(r => r.position === position);
                        return sum + (reward?.cashAmount || 0) + (reward?.creditAmount || 0);
                      } else if (position) {
                        // Fallback calculation if winnerRewards is not available
                        const fallbackAmounts = { 1: 0.5, 2: 0.3, 3: 0.2 };
                        return sum + (selectedPool.totalAmount * (fallbackAmounts[position as keyof typeof fallbackAmounts] || 0));
                      }
                      return sum;
                    }, 0).toFixed(2)}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={distributeRewardsToWinners}
                  disabled={selectedWinners.length === 0 || selectedWinners.some(submissionId => !winnerRewards[submissionId] || winnerRewards[submissionId] === 0)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 border border-green-500 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Distribute Rewards
                </button>
                <button
                  onClick={() => {
                    setShowSelectWinners(false);
                    setSelectedWinners([]);
                    setWinnerRewards({});
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 border border-gray-500 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Details Modal */}
        {showSubmissionModal && selectedSubmission && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSubmissionModal(false);
              }
            }}
          >
            <div 
              className="bg-gray-800 border border-blue-500 rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              style={{
                maxHeight: '90vh',
                margin: 'auto'
              }}
            >
              <div className="bg-blue-600 rounded-lg p-4 mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Submission Details</h3>
                <p className="text-blue-100 font-medium">
                  {selectedSubmission.creator?.fullName || selectedSubmission.creatorName || 'Unknown Creator'} • 
                  Submitted: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleDateString() : 'Unknown date'}
                </p>
      </div>
              
              <div className="space-y-4">
                {/* Creator Information */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Creator Information</h4>
                  <p className="text-gray-300">Name: {selectedSubmission.creator?.fullName || selectedSubmission.creatorName || 'Unknown'}</p>
                  <p className="text-gray-300">Username: @{selectedSubmission.creator?.userName || 'unknown'}</p>
                  <p className="text-gray-300">Email: {selectedSubmission.creator?.email || selectedSubmission.creatorEmail || 'Not provided'}</p>
    </div>

                {/* Submitted Links - Most Important */}
                {(() => {
                  // Handle both string and array formats for files
                  let fileLinks: string[] = [];
                  if (selectedSubmission.files) {
                    if (typeof selectedSubmission.files === 'string') {
                      fileLinks = [selectedSubmission.files];
                    } else if (Array.isArray(selectedSubmission.files)) {
                      fileLinks = selectedSubmission.files;
                    }
                  }
                  
                  return fileLinks.length > 0;
                })() && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">📎 Submitted Links (Click to View Creator&apos;s Work)</h4>
                    <div className="space-y-3">
                      {(() => {
                        // Handle both string and array formats for files
                        let fileLinks: string[] = [];
                        if (selectedSubmission.files) {
                          if (typeof selectedSubmission.files === 'string') {
                            fileLinks = [selectedSubmission.files];
                          } else if (Array.isArray(selectedSubmission.files)) {
                            fileLinks = selectedSubmission.files;
                          }
                        }
                        return fileLinks;
                      })().map((file: string, index: number) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline break-all font-medium"
                              >
                                {file}
                              </a>
                              <p className="text-xs text-gray-400 mt-1">Click to view creator&apos;s submission</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Content */}
                {selectedSubmission.content && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Submission Content</h4>
                    <div className="bg-gray-800 rounded p-3">
                      {(() => {
                        // Function to detect and make URLs clickable
                        const makeLinksClickable = (text: string) => {
                          if (!text) return text;
                          
                          // URL regex pattern
                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                          const parts = text.split(urlRegex);
                          
                          return parts.map((part, index) => {
                            if (urlRegex.test(part)) {
                              return (
                                <a
                                  key={index}
                                  href={part}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline break-all"
                                >
                                  {part}
                                </a>
                              );
                            }
                            return part;
                          });
                        };

                        try {
                          // Try to parse the content as JSON first
                          const parsedContent = JSON.parse(selectedSubmission.content);
                          
                          // If it's an object with originalContent, extract that
                          if (parsedContent.originalContent) {
                            // Check if originalContent is a string that contains JSON
                            if (typeof parsedContent.originalContent === 'string') {
                              try {
                                const innerContent = JSON.parse(parsedContent.originalContent);
                                if (innerContent.originalContent) {
                                  return (
                                    <div>
                                      <div className="text-gray-300 whitespace-pre-wrap mb-2">
                                        {makeLinksClickable(innerContent.originalContent || 'No content provided')}
                                      </div>
                                      <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                                        <p>Brief: {innerContent.briefTitle || 'Unknown'}</p>
                                        <p>Approved: {innerContent.approvedAt ? new Date(innerContent.approvedAt).toLocaleString() : 'Not approved'}</p>
                                      </div>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                // If inner parsing fails, show the string content
                                return (
                                  <div>
                                    <div className="text-gray-300 whitespace-pre-wrap mb-2">
                                      {makeLinksClickable(parsedContent.originalContent)}
                                    </div>
                                    <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                                      <p>Brief: {parsedContent.briefTitle || 'Unknown'}</p>
                                      <p>Approved: {parsedContent.approvedAt ? new Date(parsedContent.approvedAt).toLocaleString() : 'Not approved'}</p>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          }
                          
                          // If it's just a string, show it directly with clickable links
                          return <div className="text-gray-300 whitespace-pre-wrap">{makeLinksClickable(selectedSubmission.content)}</div>;
                        } catch (e) {
                          // If JSON parsing fails, show the raw content with clickable links
                          return <div className="text-gray-300 whitespace-pre-wrap">{makeLinksClickable(selectedSubmission.content)}</div>;
                        }
                      })()}
                    </div>
                  </div>
                )}


              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 border border-gray-500 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



export default RewardManagement;
