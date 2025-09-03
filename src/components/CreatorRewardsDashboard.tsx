import React, { useState, useEffect, useCallback } from 'react';

interface PrizeDetails {
  name: string;
  description: string;
  value?: number;
}

interface Reward {
  id: string;
  briefId: string;
  rewardType: 'cash' | 'credit' | 'prize';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  prizeDetails?: PrizeDetails;
  transferId?: string;
}

interface CreditBalance {
  creatorId: string;
  creditBalance: number;
  lastUpdated: string;
}

interface CreatorRewardsDashboardProps {
  creatorId: string;
}

/**
 * Creator Rewards Dashboard
 * Displays all rewards, credit balance, and redemption options
 */
const CreatorRewardsDashboard: React.FC<CreatorRewardsDashboardProps> = ({ creatorId }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const fetchRewardsData = useCallback(async () => {
    try {
      setLoading(true);
      const [rewardsResponse, creditsResponse] = await Promise.all([
        fetch(`/api/rewards/creator/${creatorId}/history`),
        fetch(`/api/rewards/creator/${creatorId}/credits`)
      ]);

      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData.rewards || []);
      }

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setCreditBalance(creditsData);
      }
    } catch (err) {
      // Handle error silently or show a toast notification
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchRewardsData();
  }, [fetchRewardsData]);

  const handleRedeemCredits = async () => {
    try {
      setRedeemLoading(true);
      const amount = parseFloat(redeemAmount);

      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!creditBalance || amount > creditBalance.creditBalance) {
        throw new Error('Insufficient credits');
      }

      const response = await fetch('/api/rewards/redeem-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          amount,
          description: 'Credit redemption to cash'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Redemption failed');
      }

      const result = await response.json();
      
      // Update credit balance
      if (creditBalance) {
        setCreditBalance({
          ...creditBalance,
          creditBalance: result.newCreditBalance
        });
      }

      setShowRedeemModal(false);
      setRedeemAmount('');
      alert(`Successfully redeemed $${amount} to your Stripe account!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Redemption failed';
      alert(errorMessage);
    } finally {
      setRedeemLoading(false);
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'credit':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'prize':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            ⏳ Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            ✗ Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="creator-rewards-dashboard">
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Rewards Dashboard
        </h2>

        {/* Credit Balance Card */}
        {creditBalance && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Credit Balance</h3>
                <p className="text-3xl font-bold">${creditBalance.creditBalance.toFixed(2)}</p>
                <p className="text-sm opacity-90 mt-1">
                  Last updated: {new Date(creditBalance.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setShowRedeemModal(true)}
                  disabled={creditBalance.creditBalance <= 0}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Redeem Credits
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rewards History */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Reward History
            </h3>
          </div>
          
          <div className="p-6">
            {rewards.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                            <p className="text-gray-400">No rewards yet</p>
            <p className="text-sm text-gray-500 mt-1">
                  Start participating in briefs to earn rewards!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getRewardTypeIcon(reward.rewardType)}
                      <div>
                        <h4 className="font-medium text-white capitalize">
                          {reward.rewardType} Reward
                        </h4>
                        <p className="text-sm text-gray-300">
                          {reward.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          Brief #{reward.briefId} • {new Date(reward.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                                              <div className="font-semibold text-white">
                        {reward.rewardType === 'prize' ? 'Prize' : `$${reward.amount.toFixed(2)}`}
                      </div>
                      {getStatusBadge(reward.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Redeem Credits Modal */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                              <h3 className="text-lg font-semibold text-white mb-4">
                Redeem Credits
              </h3>
                              <p className="text-sm text-gray-300 mb-4">
                Available credits: ${creditBalance?.creditBalance.toFixed(2)}
              </p>
              <input
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="Enter amount to redeem"
                                  className="w-full px-3 py-2 border border-gray-600 rounded-md mb-4 bg-gray-700 text-white"
                step="0.01"
                min="0.01"
                max={creditBalance?.creditBalance}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedeemCredits}
                  disabled={redeemLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {redeemLoading ? 'Processing...' : 'Redeem'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorRewardsDashboard;

