import React, { useState, useEffect, useCallback } from 'react';

interface Brief {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  createdAt: string;
  submissions: Submission[];
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

const RewardManagement: React.FC<RewardManagementProps> = ({ userType, userId: _userId, token }) => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [rewardPools, setRewardPools] = useState<RewardPool[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showDistributeRewards, setShowDistributeRewards] = useState(false);
  const [poolAmount, setPoolAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

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
        setBriefs(data.briefs || []);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching briefs:', error);
    }
  }, [token]);

  const fetchRewardPools = useCallback(async () => {
    try {
      const response = await fetch('/api/rewards/brand/pools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRewardPools(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching reward pools:', error);
    } finally {
      setLoading(false);
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
    }
  }, [userType, fetchBriefs, fetchRewardPools, fetchAnalytics]);

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

  const distributeRewards = async (poolId: string, distributionData: Record<string, number>) => {
    try {
      const response = await fetch(`/api/rewards/distribute/${poolId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distributions: distributionData
        })
      });

      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('Rewards distributed successfully');
        setShowDistributeRewards(false);
        fetchRewardPools(); // Refresh pools
        fetchAnalytics(); // Refresh analytics
      } else {
        const error = await response.json();
        alert(`Failed to distribute rewards: ${error.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error distributing rewards:', error);
      alert('Failed to distribute rewards');
    }
  };

  const handleCreatePool = () => {
    setShowCreatePool(true);
  };

  const handleDistributeRewards = (pool: RewardPool) => {
    setSelectedBrief(pool.brief);
    setShowDistributeRewards(true);
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
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reward Management</h2>

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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Reward Pool
          </button>
        </div>

        {/* Reward Pools List */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Reward Pools</h3>
          <div className="space-y-4">
            {rewardPools.map((pool) => (
              <div key={pool.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{pool.brief.title}</h4>
                    <p className="text-sm text-gray-600">Pool ID: {pool.id}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(pool.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      ${pool.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Remaining: ${pool.remainingAmount.toFixed(2)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      pool.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pool.status}
                    </span>
                  </div>
                </div>
                
                {pool.status === 'active' && pool.remainingAmount > 0 && (
                  <button
                    onClick={() => handleDistributeRewards(pool)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Distribute Rewards
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create Pool Modal */}
        {showCreatePool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Create Reward Pool</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Brief
                  </label>
                  <select
                    value={selectedBrief?.id || ''}
                    onChange={(e) => {
                      const brief = briefs.find(b => b.id === e.target.value);
                      setSelectedBrief(brief || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a brief</option>
                    {briefs.map((brief) => (
                      <option key={brief.id} value={brief.id}>
                        {brief.title} - ${brief.budget}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pool Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={poolAmount}
                    onChange={(e) => setPoolAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createRewardPool}
                    disabled={!selectedBrief || !poolAmount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Create Pool
                  </button>
                  <button
                    onClick={() => setShowCreatePool(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Distribute Rewards Modal */}
        {showDistributeRewards && selectedBrief && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Distribute Rewards</h3>
              <p className="text-gray-600 mb-4">Brief: {selectedBrief.title}</p>
              
              <DistributeRewardsForm
                brief={selectedBrief}
                onDistribute={distributeRewards}
                onCancel={() => setShowDistributeRewards(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Distribute Rewards Form Component
interface DistributeRewardsFormProps {
  brief: Brief;
  onDistribute: (poolId: string, distributionData: Record<string, number>) => void;
  onCancel: () => void;
}

const DistributeRewardsForm: React.FC<DistributeRewardsFormProps> = ({ brief, onDistribute, onCancel }) => {
  const [distributions, setDistributions] = useState<Record<string, number>>({});
  const [totalDistributed, setTotalDistributed] = useState(0);

  const handleDistributionChange = (creatorId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const newDistributions = { ...distributions, [creatorId]: numAmount };
    setDistributions(newDistributions);
    
    const total = Object.values(newDistributions).reduce((sum, val) => sum + val, 0);
    setTotalDistributed(total);
  };

  const handleSubmit = () => {
    if (totalDistributed > 0) {
      // Find the pool for this brief
      const poolId = 'pool-id'; // This should be passed as a prop or fetched
      onDistribute(poolId, distributions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Submissions</h4>
        <div className="space-y-3">
          {brief.submissions.map((submission) => (
            <div key={submission.id} className="flex justify-between items-center p-3 bg-white rounded-md">
              <div>
                <p className="font-medium text-gray-800">{submission.creator.fullName}</p>
                <p className="text-sm text-gray-600">@{submission.creator.userName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={distributions[submission.creator.id] || ''}
                  onChange={(e) => handleDistributionChange(submission.creator.id, e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">Total to distribute: <span className="font-semibold">${totalDistributed.toFixed(2)}</span></p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={totalDistributed <= 0}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Distribute Rewards
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RewardManagement;
