import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

interface Brief {
  id: string;
  title: string;
  reward: number;
  amountOfWinners: number;
}

interface Winner {
  id: string;
  submissionId: string;
  creatorId: string;
  position: number;
  rewardId?: string;
  submission: {
    creator: {
      fullName: string;
      email: string;
    };
  };
}

interface ModernPaymentFlowProps {
  brief: Brief;
  winners: Winner[];
  onPaymentComplete: () => void;
  onClose: () => void;
}

const PaymentForm: React.FC<{
  brief: Brief;
  winners: Winner[];
  onPaymentComplete: () => void;
  onClose: () => void;
}> = ({ brief, winners, onPaymentComplete, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = winners.reduce((sum, winner) => {
    const rewardAmount = brief.reward * (1 - (winner.position - 1) * 0.1);
    return sum + rewardAmount;
  }, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // Convert to cents
          briefId: brief.id,
          winners: winners.map(winner => ({
            submissionId: winner.submissionId,
            creatorId: winner.creatorId,
            position: winner.position,
            amount: brief.reward * (1 - (winner.position - 1) * 0.1)
          }))
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
      } else {
        onPaymentComplete();
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Payment Summary
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {brief.title}
        </p>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Winners:</h4>
        <div className="space-y-2">
          {winners.map((winner) => {
            const rewardAmount = brief.reward * (1 - (winner.position - 1) * 0.1);
            return (
              <div key={winner.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {winner.position === 1 ? '1st' : winner.position === 2 ? '2nd' : '3rd'} Place - {winner.submission.creator.fullName}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${rewardAmount.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-3">
          <div className="flex justify-between items-center font-semibold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-green-600 dark:text-green-400">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#374151',
                    '::placeholder': {
                      color: '#9CA3AF',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

const ModernPaymentFlow: React.FC<ModernPaymentFlowProps> = ({
  brief,
  winners,
  onPaymentComplete,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Process Payments
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              brief={brief}
              winners={winners}
              onPaymentComplete={onPaymentComplete}
              onClose={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default ModernPaymentFlow;



