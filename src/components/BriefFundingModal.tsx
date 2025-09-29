import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { STRIPE_CONFIG } from '../config/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.TEST.PUBLISHABLE_KEY);

interface BriefFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (briefId: string) => void;
  briefData: {
    title: string;
    description: string;
    requirements: string; // Brief requirements text
    reward: number;
    amountOfWinners: number;
    deadline: string;
    location: string;
    isPrivate: boolean;
    additionalFields?: Record<string, unknown>;
    rewardTiers: Array<{
      tierNumber: number;
      name: string;
      amount: number;
      position: number;
      isActive: boolean;
    }>;
  };
}

const PaymentForm: React.FC<{
  onSuccess: (briefId: string) => void;
  onClose: () => void;
  briefData: BriefFundingModalProps['briefData'];
}> = ({ onSuccess, onClose, briefData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create payment intent for brief funding
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: briefData.reward * 100, // Convert to cents
          currency: 'usd',
          metadata: {
            type: 'brief_funding',
            briefTitle: briefData.title
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create payment intent: ${errorData.error || 'Unknown error'}`);
      }

      const responseData = await response.json();
      
      // Handle both camelCase and snake_case response formats
      const clientSecret = responseData.clientSecret || responseData.client_secret;
      
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        setMessage(`Payment failed: ${error.message}`);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create the brief with funding
        const briefPayload = {
          ...briefData,
          isFunded: true,
          status: 'active',
          fundedAt: new Date().toISOString()
        };
        
        const briefResponse = await fetch('/api/briefs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(briefPayload)
        });

        if (briefResponse.ok) {
          const result = await briefResponse.json();
          onSuccess(result.id);
        } else {
          const errorData = await briefResponse.json();
          throw new Error(`Failed to create brief: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Payment failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
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

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Funding Summary
        </h3>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <div className="flex justify-between">
            <span>Brief Title:</span>
            <span className="font-medium">{briefData.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Reward:</span>
            <span className="font-medium">${briefData.reward.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base">
            <span>Amount to Pay:</span>
            <span>${briefData.reward.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {loading ? 'Processing...' : `Pay $${briefData.reward.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

const BriefFundingModal: React.FC<BriefFundingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  briefData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Fund Your Brief
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To create and publish your brief, you need to fund it first. This ensures creators can see that the brief is legitimate and funded.
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              onSuccess={onSuccess}
              onClose={onClose}
              briefData={briefData}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default BriefFundingModal;
