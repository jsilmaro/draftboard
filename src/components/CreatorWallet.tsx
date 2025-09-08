import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreatorStripeOnboarding from './CreatorStripeOnboarding';

interface WalletData {
  balance: number;
  totalEarnings: number;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  adminNotes?: string;
  requestedAt: string;
  processedAt?: string;
}

const CreatorWallet: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token') || '';
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletResponse, earningsResponse, withdrawalResponse] = await Promise.all([
        fetch('/api/creators/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/creators/earnings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/creators/withdrawal-requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const walletData = walletResponse.ok ? await walletResponse.json() : { balance: 0, transactions: [] };
      const earningsData = earningsResponse.ok ? await earningsResponse.json() : [];
      const withdrawalData = withdrawalResponse.ok ? await withdrawalResponse.json() : [];

      // Calculate total earnings from the earnings data
      const totalEarnings = earningsData.reduce((sum: number, earning: { amount?: number }) => sum + (earning.amount || 0), 0);

      // Use wallet transactions if available, otherwise use earnings data
      let recentTransactions = [];
      
      if (walletData.transactions && walletData.transactions.length > 0) {
        // Use actual wallet transactions
        recentTransactions = walletData.transactions.map((transaction: { id: string; type: string; amount: number; description: string; createdAt: string }) => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          createdAt: transaction.createdAt
        }));
      } else {
        // Fallback to earnings data
        recentTransactions = earningsData.map((earning: { id: string; amount: number; briefTitle: string; paidAt: string }) => ({
          id: earning.id,
          type: 'reward',
          amount: earning.amount,
          description: `Reward from: ${earning.briefTitle}`,
          createdAt: earning.paidAt
        }));
      }

      setWalletData({
        balance: walletData.balance || 0,
        totalEarnings: totalEarnings,
        recentTransactions: recentTransactions
      });
      
      setWithdrawalRequests(withdrawalData);

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchWalletData();
    }
  }, [user, token, fetchWalletData]);

  const handleStripeOnboardingSuccess = () => {
    setShowStripeOnboarding(false);
    fetchWalletData();
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) < 10) {
      setError('Minimum withdrawal amount is $10.00');
      return;
    }

    if (parseFloat(withdrawAmount) > (walletData?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    setError(null);

    try {
      const response = await fetch('/api/creators/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          paymentMethod: 'stripe'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchWalletData(); // Refresh data
        // Show success message
        alert('Withdrawal request submitted successfully! You will be notified when it is processed.');
      } else {
        setError(result.error || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      setError('Failed to submit withdrawal request');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !walletData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'pending');
  const hasPendingWithdrawals = pendingWithdrawals.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm border border-white/10 dark:border-gray-700/30 rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Creator Wallet</h2>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Available Balance</h3>
            <p className="text-2xl font-bold">${walletData?.balance.toFixed(2) || '0.00'}</p>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={false}
              className="mt-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
            >
              Withdraw Funds (Balance: ${walletData?.balance || '0.00'})
            </button>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Total Earnings</h3>
            <p className="text-2xl font-bold">${walletData?.totalEarnings.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600Cannot find name 'hasContent'. text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Pending Requests</h3>
            <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
          </div>
        </div>

        {/* Withdrawal Requests */}
        {withdrawalRequests.length > 0 && (
          <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Withdrawal History</h3>
            
            <div className="space-y-3">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white/5 dark:bg-gray-600/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Withdrawal Request</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      {request.reason && (
                        <p className="text-red-400 text-sm">Reason: {request.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      ${request.amount.toFixed(2)}
                    </p>
                    <span className={getStatusBadge(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stripe Integration Section */}
        <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Payment Account</h3>
            <button
              onClick={() => setShowStripeOnboarding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Connect Stripe
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">Connect your Stripe account to receive cash rewards</p>
            <button
              onClick={() => setShowStripeOnboarding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Connect Now
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
          
          {walletData?.recentTransactions.length ? (
            <div className="space-y-3">
              {walletData.recentTransactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 dark:bg-gray-600/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">{transaction.type}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">
                      +${transaction.amount.toFixed(2)}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-gray-500 text-sm">Start submitting to briefs to earn rewards!</p>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Request Withdrawal
                </h3>
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  min="10"
                  max={walletData?.balance || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Available: ${walletData?.balance.toFixed(2) || '0.00'} • Minimum: $10.00
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {hasPendingWithdrawals && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    ⚠️ You have {pendingWithdrawals.length} pending withdrawal request{pendingWithdrawals.length !== 1 ? 's' : ''}. 
                    You can submit additional requests while waiting.
                  </p>
                </div>
              )}
              
                              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                            <p className="text-blue-400 text-sm">
              Your withdrawal request will be reviewed by our admin team. You will be notified once it&apos;s processed.
            </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {withdrawing ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Onboarding Modal */}
      {showStripeOnboarding && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connect Payment Account
                </h3>
                <button
                  onClick={() => setShowStripeOnboarding(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CreatorStripeOnboarding
                onComplete={handleStripeOnboardingSuccess}
                onCancel={() => setShowStripeOnboarding(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorWallet;
