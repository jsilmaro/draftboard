import React, { useState, useEffect, useCallback } from 'react';

interface StripeConnectOnboardingProps {
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

/**
 * Stripe Connect Onboarding Component for Creators
 * Handles the complete Stripe Connect account setup and management
 */
const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  creatorId,
  creatorEmail,
  creatorName,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);

  const checkExistingAccount = useCallback(async () => {
    try {
      // This would typically come from your database
      // For demo purposes, we'll simulate checking
      const response = await fetch(`/api/creators/${creatorId}/stripe-account`);
      if (response.ok) {
        const account = await response.json();
        if (account.stripe_account_id) {
          setHasAccount(true);
          await fetchAccountStatus(account.stripe_account_id);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('No existing account found');
    }
  }, [creatorId]);

  // Check if creator already has a Stripe account
  useEffect(() => {
    checkExistingAccount();
  }, [checkExistingAccount]);

  const fetchAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch(`/api/stripe/connect-account/${accountId}`);
      if (response.ok) {
        const status = await response.json();
        setAccountStatus(status);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching account status:', err);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);

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

      if (!response.ok) {
        throw new Error('Failed to create Stripe account');
      }

      const { accountId, onboardingUrl } = await response.json();

      // Save account ID to database
      await saveAccountToDatabase(accountId);

      // Redirect to Stripe onboarding
      window.location.href = onboardingUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginToAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!accountStatus?.id) {
        throw new Error('No account found');
      }

      const response = await fetch('/api/stripe/create-login-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accountStatus.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create login link');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveAccountToDatabase = async (accountId: string) => {
    try {
      await fetch(`/api/creators/${creatorId}/stripe-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripe_account_id: accountId
        }),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error saving account to database:', err);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus) return null;

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✓ Account Ready
        </span>
      );
    } else if (accountStatus.details_submitted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          ⏳ Pending Review
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          ⚠️ Setup Required
        </span>
      );
    }
  };

  return (
    <div className="stripe-connect-onboarding">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Stripe Account
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Connect your Stripe account to receive cash rewards
          </p>
        </div>

        {hasAccount && accountStatus && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Status
              </span>
              {getStatusBadge()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>Charges: {accountStatus.charges_enabled ? '✓' : '✗'}</div>
              <div>Payouts: {accountStatus.payouts_enabled ? '✓' : '✗'}</div>
              <div>Details: {accountStatus.details_submitted ? '✓' : '✗'}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {!hasAccount ? (
            <button
              onClick={handleCreateAccount}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect Stripe Account
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleLoginToAccount}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Manage Account
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p>• Secure onboarding powered by Stripe</p>
          <p>• Required to receive cash rewards</p>
          <p>• Takes 2-3 minutes to complete</p>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectOnboarding;

