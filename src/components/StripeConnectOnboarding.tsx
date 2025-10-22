import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface StripeConnectOnboardingProps {
  creatorId: string;
  email: string;
  fullName: string;
  onSuccess?: (accountId: string) => void;
  onError?: (error: string) => void;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  creatorId,
  email,
  fullName,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{ status: string; chargesEnabled: boolean; payoutsEnabled: boolean } | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

  // Create Stripe Connect account
  const createAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/stripe-connect/create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId,
          email,
          fullName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create Stripe account');
      }

      const data = await response.json();
      setAccountId(data.accountId);
      setOnboardingUrl(data.onboardingUrl);
      
      showSuccessToast('Stripe Connect account created successfully!');
      
      // Open onboarding in new window
      window.open(data.onboardingUrl, '_blank', 'width=800,height=600');
      
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to create Stripe account');
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Check account status
  const checkAccountStatus = useCallback(async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`/api/stripe-connect/account/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data.account);
        
        // Check if onboarding is complete
        if (data.account.details_submitted && data.account.charges_enabled) {
          showSuccessToast('Stripe Connect setup completed successfully!');
          onSuccess?.(accountId);
        }
      }
    } catch (error) {
      // Error checking account status
    }
  }, [showSuccessToast, onSuccess]);

  // Create new onboarding link
  const createOnboardingLink = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/stripe-connect/create-account-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create onboarding link');
      }

      const data = await response.json();
      setOnboardingUrl(data.onboardingUrl);
      
      // Open onboarding in new window
      window.open(data.onboardingUrl, '_blank', 'width=800,height=600');
      
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to create onboarding link');
    } finally {
      setLoading(false);
    }
  };

  // Check account status periodically
  useEffect(() => {
    if (accountId) {
      const interval = setInterval(() => {
        checkAccountStatus(accountId);
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [accountId, checkAccountStatus]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stripe Connect Setup
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set up payments to receive rewards from brands
          </p>
        </div>
      </div>

      {!accountId ? (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Connect Your Bank Account
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  To receive payments from brands, you need to connect your bank account through Stripe. 
                  This is secure and only takes a few minutes.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={createAccount}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Connect with Stripe
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accountStatus && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Account Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Details Submitted:</span>
                  <span className={`text-sm font-medium ${accountStatus.details_submitted ? 'text-green-600' : 'text-red-600'}`}>
                    {accountStatus.details_submitted ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Charges Enabled:</span>
                  <span className={`text-sm font-medium ${accountStatus.charges_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {accountStatus.charges_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payouts Enabled:</span>
                  <span className={`text-sm font-medium ${accountStatus.payouts_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {accountStatus.payouts_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {accountStatus && accountStatus.details_submitted && accountStatus.charges_enabled ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Stripe Connect setup completed! You can now receive payments.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Complete Your Setup
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Please complete the Stripe onboarding process to start receiving payments.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={createOnboardingLink}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Link...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StripeConnectOnboarding;

