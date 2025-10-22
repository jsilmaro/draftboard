import React, { useState, useEffect } from 'react';
import StripeConnectOnboarding from './StripeConnectOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface CreatorStripeSetupProps {
  onSetupComplete?: () => void;
}

const CreatorStripeSetup: React.FC<CreatorStripeSetupProps> = ({ onSetupComplete }) => {
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const [stripeAccount, setStripeAccount] = useState<{ id: string; status: string; chargesEnabled: boolean; payoutsEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if creator has Stripe account
  useEffect(() => {
    checkStripeAccount();
  }, []);

  const checkStripeAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/creators/stripe-account', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStripeAccount(data.stripeAccount);
      }
    } catch (error) {
      // Error handled by showErrorToast
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuccess = (accountId: string) => {
    showSuccessToast('Stripe Connect setup completed successfully!');
    setStripeAccount({ id: accountId, connected: true });
    onSetupComplete?.();
  };

  const handleSetupError = (error: string) => {
    showErrorToast(`Stripe setup failed: ${error}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (stripeAccount && stripeAccount.connected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Setup Complete
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You&apos;re ready to receive payments from brands
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 dark:text-green-200 font-medium">
              Your Stripe Connect account is active and ready to receive payments.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StripeConnectOnboarding
      creatorId={user?.id || ''}
      email={user?.email || ''}
      fullName={user?.fullName || user?.userName || ''}
      onSuccess={handleSetupSuccess}
      onError={handleSetupError}
    />
  );
};

export default CreatorStripeSetup;

