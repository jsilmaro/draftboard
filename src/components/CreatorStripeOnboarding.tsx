import React, { useState } from 'react';

interface CreatorStripeOnboardingProps {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface AccountStatus {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: Record<string, unknown>;
}

const CreatorStripeOnboarding: React.FC<CreatorStripeOnboardingProps> = ({
  creatorId,
  creatorEmail,
  creatorName,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createStripeAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line no-console
      console.log('Creating Stripe account with data:', {
        creatorId,
        email: creatorEmail,
        name: creatorName
      });

      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          email: creatorEmail,
          name: creatorName
        }),
      });

      // eslint-disable-next-line no-console
      console.log('Response status:', response.status);
      // eslint-disable-next-line no-console
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        // eslint-disable-next-line no-console
        console.error('Server error response:', errorData);
        
        let errorMessage = 'Failed to create Stripe account';
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // eslint-disable-next-line no-console
      console.log('Success response:', data);
      
      setOnboardingUrl(data.onboardingUrl);
      setAccountStatus(data.account);

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Stripe onboarding error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Stripe account';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch(`/api/stripe/connect-account/${accountId}`);
      
      if (response.ok) {
        const status = await response.json();
        setAccountStatus(status);
        
        if (status.charges_enabled && status.payouts_enabled) {
          onSuccess?.();
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to check account status:', response.status);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking account status:', error);
    }
  };

  const handleOnboardingComplete = () => {
    if (accountStatus?.id) {
      checkAccountStatus(accountStatus.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Your Payment Account
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Set up your Stripe account to receive cash rewards directly to your bank account
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
            Please check your environment variables and ensure STRIPE_SECRET_KEY is properly configured.
          </p>
        </div>
      )}

      {accountStatus && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Account Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${accountStatus.charges_enabled ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-blue-800 dark:text-blue-200">
                Payments: {accountStatus.charges_enabled ? 'Enabled' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${accountStatus.payouts_enabled ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-blue-800 dark:text-blue-200">
                Payouts: {accountStatus.payouts_enabled ? 'Enabled' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {!onboardingUrl ? (
        <button
          onClick={createStripeAccount}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Connect Stripe Account
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Complete Onboarding
          </a>
          
          <button
            onClick={handleOnboardingComplete}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Check Status
          </button>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>By connecting your Stripe account, you can receive cash rewards directly to your bank account.</p>
        <p className="mt-1">This process is secure and handled by Stripe.</p>
      </div>
    </div>
  );
};

export default CreatorStripeOnboarding;

