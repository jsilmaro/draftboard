import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';

// Load Stripe (you'll need to add your publishable key to .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

interface Winner {
  id: string;
  position: number;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
  brief: {
    id: string;
    title: string;
    totalRewardsPaid: number;
  };
  reward: {
    id: string;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
    isPaid: boolean;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    rewardType: string;
  };
}

interface PaymentFormProps {
  winner: Winner;
  onPaymentComplete: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ winner, onPaymentComplete }) => {
  const stripe = useStripe();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credits' | 'prizes'>('stripe');
  const [amount, setAmount] = useState(winner.reward.cashAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'stripe') {
        // Use wallet balance for payment
        const response = await fetch('/api/payments/process-wallet-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            winnerId: winner.id,
            amount: amount,
            rewardType: 'cash'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }

        await response.json(); // Response is not used, just await to handle the promise
        
        // Show success message
        alert(`Payment of $${amount} sent successfully to ${winner.creator.fullName}!`);
        onPaymentComplete();
      } else {
        // Process credits or prizes
        const response = await fetch('/api/payments/process-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            winnerId: winner.id,
            rewardType: paymentMethod,
            amount: paymentMethod === 'credits' ? amount : 0,
            prizeDescription: paymentMethod === 'prizes' ? winner.reward.prizeDescription : ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process reward');
        }

        await response.json(); // Response is not used, just await to handle the promise
        alert(`${paymentMethod === 'credits' ? 'Credits' : 'Prize'} processed successfully for ${winner.creator.fullName}!`);
        onPaymentComplete();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pay {winner.creator.fullName}
        </h3>
        <p className="text-sm text-gray-600">
          Position: {winner.position} Spot • {winner.brief.title}
        </p>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'credits' | 'prizes')}
                className="mr-2"
              />
              <span className="text-sm">💰 Wallet Balance (Real Money)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="credits"
                checked={paymentMethod === 'credits'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'credits' | 'prizes')}
                className="mr-2"
              />
              <span className="text-sm">🎫 Platform Credits</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="prizes"
                checked={paymentMethod === 'prizes'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'credits' | 'prizes')}
                className="mr-2"
              />
              <span className="text-sm">🎁 Prizes</span>
            </label>
          </div>
        </div>

        {/* Amount Input */}
        {(paymentMethod === 'stripe' || paymentMethod === 'credits') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {/* Wallet Balance Info */}
        {paymentMethod === 'stripe' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">💰</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Payment from Wallet Balance</p>
                <p className="text-xs text-blue-700">This payment will be deducted from your wallet balance</p>
              </div>
            </div>
          </div>
        )}

        {/* Prize Description Display */}
        {paymentMethod === 'prizes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prize Description
            </label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {winner.reward.prizeDescription || 'No prize description available'}
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay ${paymentMethod === 'stripe' || paymentMethod === 'credits' ? `$${amount}` : 'Prize'}`}
        </button>
      </form>
    </div>
  );
};

const PaymentManagement: React.FC = () => {
  // const { user } = useAuth(); // Currently unused
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const response = await fetch('/api/brands/winners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWinners(data.winners || []);
      } else {
        // Failed to fetch winners
        setWinners([]);
      }
    } catch (error) {
      // Error fetching winners
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    setSelectedWinner(null);
    fetchWinners(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading winners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
          <p className="text-gray-600">Manage payments for your brief winners</p>
        </div>

        {selectedWinner ? (
          <div>
            <button
              onClick={() => setSelectedWinner(null)}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to winners
            </button>
            <Elements stripe={stripePromise}>
              <PaymentForm
                winner={selectedWinner}
                onPaymentComplete={handlePaymentComplete}
              />
            </Elements>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((winner) => (
              <div
                key={winner.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {winner.creator.fullName}
                    </h3>
                    <p className="text-sm text-gray-600">@{winner.creator.userName}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {winner.position} Spot
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{winner.brief.title}</p>
                  <div className="space-y-1">
                    {winner.reward.cashAmount > 0 && (
                      <p className="text-sm">
                        <span className="font-medium">Cash:</span> ${winner.reward.cashAmount}
                      </p>
                    )}
                    {winner.reward.creditAmount > 0 && (
                      <p className="text-sm">
                        <span className="font-medium">Credits:</span> {winner.reward.creditAmount}
                      </p>
                    )}
                    {winner.reward.prizeDescription && (
                      <p className="text-sm">
                        <span className="font-medium">Prize:</span> {winner.reward.prizeDescription}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {winner.payment ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        winner.payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : winner.payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {winner.payment.status.charAt(0).toUpperCase() + winner.payment.status.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not paid</span>
                    )}
                  </div>
                  
                  {!winner.payment && (
                    <button
                      onClick={() => setSelectedWinner(winner)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {winners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No winners to pay</h3>
            <p className="text-gray-600">All your winners have been paid or you haven&apos;t selected any winners yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;
