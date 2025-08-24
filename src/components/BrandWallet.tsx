import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  balanceAfter: number;
}

interface BrandWallet {
  id: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  transactions: WalletTransaction[];
}

interface TopUpFormProps {
  onTopUpComplete: () => void;
}

const TopUpForm: React.FC<TopUpFormProps> = ({ onTopUpComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTopUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not loaded');
      }

      // Create payment intent for wallet top-up
      const response = await fetch('/api/brands/wallet/top-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create top-up payment');
      }

      const result = await response.json();

      // Check if this is a direct top-up (no Stripe needed)
      if (result.message && result.message.includes('successfully')) {
        alert(`Successfully added $${amount} to your wallet!`);
        onTopUpComplete();
        return;
      }

      // Handle Stripe payment
      const { clientSecret } = result;

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      alert(`Successfully added $${amount} to your wallet!`);
      onTopUpComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Funds to Wallet</h3>
      
      <form onSubmit={handleTopUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Add $${amount} to Wallet`}
        </button>
      </form>
    </div>
  );
};

const BrandWallet: React.FC = () => {
  const [wallet, setWallet] = useState<BrandWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/brands/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      } else {
        setError('Failed to fetch wallet');
      }
    } catch (error) {
      setError('Error fetching wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpComplete = () => {
    setShowTopUp(false);
    fetchWallet();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (showTopUp) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => setShowTopUp(false)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to wallet
          </button>
          <Elements stripe={stripePromise}>
            <TopUpForm onTopUpComplete={handleTopUpComplete} />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Wallet</h1>
          <p className="text-gray-600">Manage your wallet balance and transactions</p>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {wallet && (
          <>
            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-500 text-white rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
                <p className="text-3xl font-bold">${wallet.balance.toFixed(2)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Deposited</h3>
                <p className="text-3xl font-bold text-blue-600">${wallet.totalDeposited.toFixed(2)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
                <p className="text-3xl font-bold text-red-600">${wallet.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setShowTopUp(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center"
              >
                <span className="mr-2">💰</span>
                Add Funds
              </button>
              
              <button
                onClick={fetchWallet}
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 flex items-center"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {wallet.transactions.length > 0 ? (
                  wallet.transactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {transaction.type === 'deposit' && <span>💰</span>}
                            {transaction.type === 'payment' && <span>💸</span>}
                            {transaction.type === 'withdrawal' && <span>📤</span>}
                            {transaction.type === 'refund' && <span>↩️</span>}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'deposit' || transaction.type === 'refund'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: ${transaction.balanceAfter.toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No transactions yet</p>
                    <p className="text-sm">Add funds to your wallet to get started</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrandWallet;
