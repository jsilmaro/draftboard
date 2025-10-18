import React, { useState } from 'react';

interface BriefFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (briefId: string) => void;
  briefId?: string; // Optional: If provided, we're funding an existing brief
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
  briefId: string;
}> = ({ onClose, briefData, briefId }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing'>('ready');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setPaymentStep('processing');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Always use Stripe Connect Checkout flow
      const response = await fetch(`/api/briefs/${briefId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create funding session: ${errorData.error || 'Unknown error'}`);
      }

      const { data } = await response.json();
      
      if (!data || !data.url) {
        throw new Error('No checkout URL received from server');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      setPaymentStep('ready');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Payment failed'}`);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Progress Indicator */}
      {paymentStep === 'processing' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                🔄 Redirecting to Stripe Checkout...
              </p>
            </div>
          </div>
        </div>
      )}

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
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {loading ? 'Redirecting...' : 'Continue to Checkout'}
        </button>
      </div>
    </form>
  );
};

const BriefFundingModal: React.FC<BriefFundingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  briefData,
  briefId
}) => {
  if (!isOpen || !briefId) return null;

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
              You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete the payment. This ensures creators can see that your brief is legitimate and funded.
            </p>
          </div>

          <PaymentForm
            onSuccess={onSuccess}
            onClose={onClose}
            briefData={briefData}
            briefId={briefId}
          />
        </div>
      </div>
    </div>
  );
};

export default BriefFundingModal;
