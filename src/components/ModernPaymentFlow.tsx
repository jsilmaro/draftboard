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
  const [paymentStep, setPaymentStep] = useState<'summary' | 'payment' | 'processing' | 'success'>('summary');

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
    setPaymentStep('processing');

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
        setPaymentStep('payment');
      } else {
        setPaymentStep('success');
        setTimeout(() => {
          onPaymentComplete();
        }, 2000);
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return { label: '1st Place', color: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-600 dark:text-yellow-400' };
      case 2: return { label: '2nd Place', color: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' };
      case 3: return { label: '3rd Place', color: 'bg-orange-100 dark:bg-orange-900', textColor: 'text-orange-600 dark:text-orange-400' };
      default: return { label: `${position}th Place`, color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-400' };
    }
  };

  if (paymentStep === 'summary') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Payment Summary
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review the payment details before proceeding
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Brief:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {brief.title}
          </p>

          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Winners:</h4>
          <div className="space-y-3">
            {winners.map((winner) => {
              const rewardAmount = brief.reward * (1 - (winner.position - 1) * 0.1);
              const positionInfo = getPositionLabel(winner.position);
              return (
                <div key={winner.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${positionInfo.color} rounded-full flex items-center justify-center`}>
                      <span className={`text-sm font-bold ${positionInfo.textColor}`}>
                        {winner.position}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {winner.submission.creator.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {positionInfo.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${rewardAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                                  <span className="font-bold text-xl text-emerald-500 dark:text-emerald-400">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h5 className="font-medium text-blue-900 dark:text-blue-100">Secure Payment:</h5>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Your payment is processed securely through Stripe. Winners will receive their rewards immediately after payment confirmation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setPaymentStep('payment')}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep === 'processing') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Processing Payment...
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we process your payment securely.
        </p>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Successful! 🎉
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Winners have been notified and will receive their rewards shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Enter Payment Details
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total amount: <span className="font-bold text-emerald-500 dark:text-emerald-400">${totalAmount.toFixed(2)}</span>
        </p>
      </div>

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
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Payment Amount:</span>
          <span className="font-bold text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setPaymentStep('summary')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Back
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



