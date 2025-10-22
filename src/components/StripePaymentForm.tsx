import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  amount: number;
  briefId: string;
  onSuccess: (paymentIntent: { id: string; status: string }) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({ 
  amount, 
  briefId, 
  onSuccess, 
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create Payment Intent
    const createPaymentIntent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          onError('Authentication required');
          return;
        }

        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            amount: Math.round(amount * 100), // Convert to cents
            briefId,
            currency: 'usd'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Failed to create payment intent');
      }
    };

    createPaymentIntent();
  }, [amount, briefId, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      onError('Payment system not ready');
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Brand Payment',
          },
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        onError('Payment was not completed');
      }
    } catch (error) {
      onError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Preparing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Amount
          </label>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${amount.toFixed(2)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Information
          </label>
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    fontFamily: 'system-ui, sans-serif',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        {processing ? 'Processing Payment...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>🔒 Your payment is secured by Stripe</p>
        <p>We never store your card information</p>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
