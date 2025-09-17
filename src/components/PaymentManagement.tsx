import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface WalletData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalDeposited?: number;
  totalSpent?: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
}

interface PaymentManagementProps {
  userType: 'brand' | 'creator';
  userId: string;
  token: string;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ userType, userId: _userId, token }) => {
  const { isDark } = useTheme();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFundWallet, setShowFundWallet] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutAccountId, setPayoutAccountId] = useState('');

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
        setWalletData(data);
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch wallet data');
        // Set default data structure to prevent errors
        setWalletData({
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          totalDeposited: 0,
          totalSpent: 0,
          transactions: []
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching wallet data:', error);
      // Set default data structure to prevent errors
      setWalletData({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        totalDeposited: 0,
        totalSpent: 0,
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleFundWallet = () => {
    setShowFundWallet(true);
  };

  const handlePayoutRequest = () => {
    setShowPayoutForm(true);
  };

  const submitPayoutRequest = async () => {
    try {
      const response = await fetch('/api/payments/payout/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          accountId: payoutAccountId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Payout request submitted successfully! Transfer ID: ${result.transferId}`);
        setShowPayoutForm(false);
        setPayoutAmount('');
        setPayoutAccountId('');
        fetchWalletData(); // Refresh wallet data
      } else {
        const error = await response.json();
        alert(`Payout request failed: ${error.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting payout request:', error);
      alert('Failed to submit payout request');
    }
  };

  // Helper function to get transaction description
  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Wallet Funding';
      case 'withdrawal':
        return 'Payout Request';
      case 'reward':
        return 'Reward Payment';
      case 'reward_creation':
        return 'Reward Creation';
      case 'payout':
        return 'Payout';
      default:
        return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
    }
  };

  // Helper function to get transaction type display
  const getTransactionTypeDisplay = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
      case 'reward':
        return 'credit';
      case 'withdrawal':
      case 'reward_creation':
      case 'payout':
        return 'debit';
      default:
        return 'neutral';
    }
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
      <div className={`rounded-xl shadow-lg p-8 mb-6 border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-3xl font-bold mb-6 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {userType === 'brand' ? 'Brand Wallet' : 'Creator Wallet'}
        </h2>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90 mb-2">Current Balance</h3>
                <p className="text-3xl font-bold">${walletData?.balance?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {userType === 'creator' ? (
            <>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-2">Total Earned</h3>
                    <p className="text-3xl font-bold">${walletData?.totalEarned?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-2">Total Withdrawn</h3>
                    <p className="text-3xl font-bold">${walletData?.totalWithdrawn?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-2">Total Deposited</h3>
                    <p className="text-3xl font-bold">${walletData?.totalDeposited?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-2">Total Spent</h3>
                    <p className="text-3xl font-bold">${walletData?.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mb-8">
          {userType === 'brand' && (
            <button
              onClick={handleFundWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Fund Wallet
            </button>
          )}

          {userType === 'creator' && walletData && walletData.balance > 0 && (
            <button
              onClick={handlePayoutRequest}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Request Payout
            </button>
          )}
        </div>

        {/* Fund Wallet Modal */}
        {showFundWallet && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${
            isDark ? 'bg-black/50' : 'bg-gray-900/50'
          }`}>
            <div className={`rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Fund Your Wallet</h3>
              <FundWalletForm
                token={token}
                onSuccess={() => {
                  setShowFundWallet(false);
                  fetchWalletData();
                }}
                onCancel={() => setShowFundWallet(false)}
              />
            </div>
          </div>
        )}

        {/* Payout Request Modal */}
        {showPayoutForm && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${
            isDark ? 'bg-black/50' : 'bg-gray-900/50'
          }`}>
            <div className={`rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={walletData?.balance || 0}
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Stripe Account ID
                  </label>
                  <input
                    type="text"
                    value={payoutAccountId}
                    onChange={(e) => setPayoutAccountId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="acct_..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={submitPayoutRequest}
                    disabled={!payoutAmount || !payoutAccountId}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={() => setShowPayoutForm(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="mt-8">
          <h3 className={`text-xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Transaction History</h3>
          <div className={`rounded-xl p-6 border ${
            isDark 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            {walletData?.transactions && walletData.transactions.length > 0 ? (
              <div className="space-y-3">
                {walletData.transactions.map((transaction) => {
                  const transactionType = getTransactionTypeDisplay(transaction);
                  const description = getTransactionDescription(transaction);
                  const amount = transaction.amount || 0;
                  
                  return (
                    <div key={transaction.id} className={`flex justify-between items-center p-4 rounded-lg shadow-sm border ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div>
                        <p className={`font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{description}</p>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        <p className={`text-xs capitalize ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>{transaction.status}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${transactionType === 'credit' ? 'text-green-600' : transactionType === 'debit' ? 'text-red-600' : 'text-gray-500'}`}>
                          {transactionType === 'credit' ? '+' : transactionType === 'debit' ? '-' : ''}${amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className={`text-lg font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>No transactions yet</p>
                <p className={`text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fund Wallet Form Component
interface FundWalletFormProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FundWalletForm: React.FC<FundWalletFormProps> = ({ token, onSuccess: _onSuccess, onCancel }) => {
  const { isDark } = useTheme();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          briefId: 'wallet-funding',
          amount: parseFloat(amount),
          brandId: 'current-user', // This will be handled by the backend
          briefTitle: 'Wallet Funding'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating checkout session:', error);
      alert('Failed to start payment process. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Amount to Add
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder="Enter amount"
          required
        />
      </div>

      <div className={`border rounded-lg p-4 ${
        isDark 
          ? 'bg-blue-900/20 border-blue-500/30' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <h4 className={`font-semibold mb-2 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>💳 Secure Payment</h4>
        <p className={`text-sm ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          You will be redirected to Stripe&apos;s secure checkout page to complete your payment.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading || !amount}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Add Funds'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PaymentManagement;
