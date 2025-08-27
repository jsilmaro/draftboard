import React, { useState, useEffect } from 'react';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface CreatorWallet {
  id: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  transactions: WalletTransaction[];
}

const CreatorWallet: React.FC = () => {
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/creators/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }
    } catch (error) {
      // Error fetching wallet data
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > (wallet?.balance || 0)) {
      alert('Insufficient balance');
      return;
    }

    setIsWithdrawing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/creators/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          paymentMethod: withdrawMethod
        })
      });

      if (response.ok) {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchWalletData(); // Refresh wallet data
        alert('Withdrawal request submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      alert('Failed to submit withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return '💰';
      case 'debit':
        return '💸';
      case 'withdrawal':
        return '🏦';
      default:
        return '📊';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      case 'withdrawal':
        return 'text-blue-600';
      default:
        return 'text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-[#00FF85] to-[#00C853] p-6 rounded-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
          <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Earned</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(wallet?.totalEarned || 0)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Withdrawn</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(wallet?.totalWithdrawn || 0)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!wallet || wallet.balance <= 0}
          className="px-6 py-3 bg-gradient-to-r from-[#00FF85] to-[#00C853] text-white rounded-lg hover:from-[#00E676] hover:to-[#00BFA5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💰 Withdraw Funds
        </button>
        
        <button
          onClick={fetchWalletData}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        </div>
        
        <div className="overflow-hidden">
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {wallet.transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {formatCurrency(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Balance
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Withdrawal Amount *
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  min="0"
                  max={wallet?.balance || 0}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="px-4 py-2 bg-gradient-to-r from-[#00FF85] to-[#00C853] text-white rounded-md hover:from-[#00E676] hover:to-[#00BFA5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorWallet;
