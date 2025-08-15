import React, { useState, useEffect } from 'react';

interface BrandWalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'deposit';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface BrandWallet {
  id: string;
  balance: number;
  totalSpent: number;
  totalDeposited: number;
  transactions: BrandWalletTransaction[];
}

const BrandWallet: React.FC = () => {
  const [wallet, setWallet] = useState<BrandWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank_transfer');
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brands/wallet', {
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

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brands/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          paymentMethod: depositMethod
        })
      });

      if (response.ok) {
        setShowDepositModal(false);
        setDepositAmount('');
        fetchWalletData(); // Refresh wallet data
        alert('Deposit request submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit deposit request');
      }
    } catch (error) {
      alert('Failed to submit deposit request');
    } finally {
      setIsDepositing(false);
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
      case 'deposit':
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
      case 'deposit':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Deposited</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(wallet?.totalDeposited || 0)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(wallet?.totalSpent || 0)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowDepositModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#00FF85] to-[#00C853] text-white rounded-lg hover:from-[#00E676] hover:to-[#00BFA5]"
        >
          💰 Add Funds
        </button>
        
        <button
          onClick={fetchWalletData}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>
        
        <div className="overflow-hidden">
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {wallet.transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'credit' || transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
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
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Funds</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount *
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="px-4 py-2 bg-gradient-to-r from-[#00FF85] to-[#00C853] text-white rounded-md hover:from-[#00E676] hover:to-[#00BFA5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDepositing ? 'Processing...' : 'Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandWallet;
