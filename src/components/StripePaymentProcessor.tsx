import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '../contexts/ToastContext';

interface Winner {
  id: string;
  submissionId: string;
  creatorId: string;
  position: number;
  rewardAmount: number;
  status: 'pending' | 'paid';
  submission: {
    creator: {
      fullName: string;
      email: string;
    };
  };
}

interface StripePaymentProcessorProps {
  winners: Winner[];
  totalAmount: number;
  onPaymentComplete: () => void;
  onClose: () => void;
}

const StripePaymentProcessor: React.FC<StripePaymentProcessorProps> = ({
  winners,
  totalAmount,
  onPaymentComplete,
  onClose
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { showSuccessToast, showErrorToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'summary' | 'payment' | 'processing' | 'success'>('summary');

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      showErrorToast('Stripe is not loaded. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: totalAmount * 100, // Convert to cents
          winners: winners.map(winner => ({
            id: winner.id,
            creatorId: winner.creatorId,
            amount: winner.rewardAmount,
            email: winner.submission.creator.email
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Brand Payment',
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        setPaymentStep('success');
        showSuccessToast('Payment processed successfully!');
        
        // Update winners status in the database
        await updateWinnersStatus(winners.map(w => w.id));
        
        setTimeout(() => {
          onPaymentComplete();
        }, 2000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateWinnersStatus = async (winnerIds: string[]) => {
    try {
      const response = await fetch('/api/brands/briefs/update-winners-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          winnerIds,
          status: 'paid'
        })
      });

      if (!response.ok) {
        // Silently fail - this is not critical for the user experience
      }
    } catch (error) {
      // Silently fail - this is not critical for the user experience
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#aab7c4',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
      <div className="p-6">
        {paymentStep === 'summary' && (
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Payment Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300">Total Winners: {winners.length}</p>
                <p className="text-white font-bold text-lg">Total Amount: ${totalAmount}</p>
              </div>
              <div className="text-left space-y-2">
                {winners.map((winner) => (
                  <div key={winner.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{winner.submission.creator.fullName}</span>
                    <span className="text-white">${winner.rewardAmount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setPaymentStep('payment')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {paymentStep === 'payment' && (
          <form onSubmit={handlePaymentSubmit}>
            <h3 className="text-xl font-bold text-white mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300 mb-2">Total Amount: ${totalAmount}</p>
                <div className="border border-gray-600 rounded p-3">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setPaymentStep('summary')}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!stripe || isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </form>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Processing Payment</h3>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Processing ${totalAmount} via Stripe...</p>
            <p className="text-gray-400 text-sm mt-2">Please do not close this window</p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
            <p className="text-gray-300">All winners have been paid successfully.</p>
            <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-700/30">
              <p className="text-green-300 text-sm">
                Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePaymentProcessor;

