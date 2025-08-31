import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51S1KZKLXqqzWGCaAbMEH93D9x8TH0aWf7qvm96tNWp7DA55tn1tuoTCQR0o7sIcA7xxJHYlj79HkRFYMWP4TsNxA00vDwCTtx1');

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
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface PaymentManagementProps {
  userType: 'brand' | 'creator';
  userId: string;
  token: string;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ userType, userId: _userId, token }) => {
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
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching wallet data:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6 border border-white/10 dark:border-gray-600/20">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">
          {userType === 'brand' ? 'Brand Wallet' : 'Creator Wallet'}
        </h2>

        {/* Wallet Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Current Balance</h3>
            <p className="text-2xl font-bold">${walletData?.balance?.toFixed(2) || '0.00'}</p>
          </div>

          {userType === 'creator' ? (
            <>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium opacity-90">Total Earned</h3>
                <p className="text-2xl font-bold">${walletData?.totalEarned?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium opacity-90">Total Withdrawn</h3>
                <p className="text-2xl font-bold">${walletData?.totalWithdrawn?.toFixed(2) || '0.00'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium opacity-90">Total Deposited</h3>
                <p className="text-2xl font-bold">${walletData?.totalDeposited?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium opacity-90">Total Spent</h3>
                <p className="text-2xl font-bold">${walletData?.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          {userType === 'brand' && (
            <button
              onClick={handleFundWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Fund Wallet
            </button>
          )}

          {userType === 'creator' && walletData && walletData.balance > 0 && (
            <button
              onClick={handlePayoutRequest}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Request Payout
            </button>
          )}
        </div>

        {/* Fund Wallet Modal */}
        {showFundWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-white/10 dark:border-gray-600/20">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Fund Your Wallet</h3>
              <Elements stripe={stripePromise}>
                <FundWalletForm
                  token={token}
                  onSuccess={() => {
                    setShowFundWallet(false);
                    fetchWalletData();
                  }}
                  onCancel={() => setShowFundWallet(false)}
                />
              </Elements>
            </div>
          </div>
        )}

        {/* Payout Request Modal */}
        {showPayoutForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-white/10 dark:border-gray-600/20">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={walletData?.balance || 0}
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-200"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Stripe Account ID
                  </label>
                  <input
                    type="text"
                    value={payoutAccountId}
                    onChange={(e) => setPayoutAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-200"
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
          <h3 className="text-xl font-bold text-gray-200 mb-4">Transaction History</h3>
          <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 dark:border-gray-600/20">
            {walletData?.transactions && walletData.transactions.length > 0 ? (
              <div className="space-y-3">
                {walletData.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20">
                    <div>
                      <p className="font-medium text-gray-200">{transaction.description}</p>
                      <p className="text-sm text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">Balance: ${transaction.balanceAfter.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300 text-center py-4">No transactions yet</p>
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

const FundWalletForm: React.FC<FundWalletFormProps> = ({ token, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        alert(`Payment failed: ${error.message}`);
      } else {
        // Confirm payment on backend
        const confirmResponse = await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: clientSecret.split('_secret_')[0]
          })
        });

        if (confirmResponse.ok) {
          alert('Wallet funded successfully!');
          onSuccess();
        } else {
          alert('Failed to confirm payment');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Amount (USD)
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-200"
          placeholder="Enter amount"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Card Details
        </label>
        <div className="border border-gray-600 rounded-md p-3 bg-gray-700">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#e5e7eb',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading || !amount}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {loading ? 'Processing...' : 'Fund Wallet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PaymentManagement;
