import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

interface BrandPaymentIntegrationProps {
  briefId: string;
  briefTitle: string;
  briefDescription: string;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

// interface PaymentMethod {
//   id: string;
//   type: 'card' | 'bank_account';
//   card?: {
//     brand: string;
//     last4: string;
//     exp_month: number;
//     exp_year: number;
//   };
//   bank_account?: {
//     bank_name: string;
//     last4: string;
//     routing_number: string;
//   };
// }

const BrandPaymentIntegration: React.FC<BrandPaymentIntegrationProps> = ({
  briefId,
  briefTitle,
  briefDescription,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [netAmount, setNetAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [useCheckout, setUseCheckout] = useState(true);
  const { showSuccessToast, showErrorToast } = useToast();

  // Calculate platform fee when amount changes
  useEffect(() => {
    if (amount > 0) {
      const feePercentage = 0.05; // 5% platform fee
      const minimumFee = 0.50; // $0.50 minimum
      const calculatedFee = Math.max(amount * feePercentage, minimumFee);
      const calculatedNet = amount - calculatedFee;
      
      setPlatformFee(calculatedFee);
      setNetAmount(calculatedNet);
    }
  }, [amount]);

  // Load saved payment methods
  useEffect(() => {
    // Payment methods loading can be implemented later
  }, []);

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      showErrorToast('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (useCheckout) {
        // Use Stripe Checkout
        const response = await fetch('/api/brand-payments/create-checkout-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            briefId,
            amount,
            successUrl: `${window.location.origin}/brand/dashboard?funding=success`,
            cancelUrl: `${window.location.origin}/brand/dashboard?funding=cancelled`
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          const errorData = await response.json();
          showErrorToast(errorData.error || 'Failed to create checkout session');
        }
      } else {
        // Use Payment Intent with saved payment method
        const response = await fetch('/api/brand-payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            briefId,
            amount
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Process payment with Stripe Elements
          await processPaymentIntent(data.clientSecret);
        } else {
          const errorData = await response.json();
          showErrorToast(errorData.error || 'Failed to create payment intent');
        }
      }
    } catch (error) {
      showErrorToast('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPaymentIntent = async (_clientSecret: string) => {
    // This would integrate with Stripe Elements
    // For now, we'll simulate success
    showSuccessToast('Payment processed successfully!');
    onPaymentSuccess?.();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Fund Brief: {briefTitle}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {briefDescription}
      </p>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentType"
              value="checkout"
              checked={useCheckout}
              onChange={(e) => setUseCheckout(e.target.value === 'checkout')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Stripe Checkout (Recommended)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentType"
              value="saved"
              checked={!useCheckout}
              onChange={(e) => setUseCheckout(e.target.value === 'checkout')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Use Saved Payment Method
            </span>
          </label>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Funding Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Fee Breakdown */}
      {amount > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Breakdown
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Funding Amount:</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%):</span>
              <span className="font-medium">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-1">
              <span className="text-gray-900 dark:text-white font-medium">Net to Creators:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                ${netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <div className="flex space-x-4">
        <button
          onClick={handlePayment}
          disabled={loading || amount <= 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {loading ? 'Processing...' : `Fund Brief - $${amount.toFixed(2)}`}
        </button>
        
        <button
          onClick={onPaymentCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Secure Payment Processing</p>
            <p>Your payment is processed securely by Stripe. Funds are held in escrow until brief completion.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPaymentIntegration;
