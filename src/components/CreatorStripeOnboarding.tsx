import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface CreatorStripeOnboardingProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const CreatorStripeOnboarding: React.FC<CreatorStripeOnboardingProps> = ({
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const [step, setStep] = useState<'initial' | 'creating' | 'onboarding' | 'complete'>('initial');
  const [accountId, setAccountId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements?: Record<string, unknown>;
  } | null>(null);

  const createConnectAccount = async () => {
    if (!user) {
      showErrorToast('User not authenticated');
      return;
    }

    setLoading(true);
    setStep('creating');

    try {
      const response = await fetch('/api/mock-stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          creatorId: user.id,
          email: user.email,
          name: user.fullName || user.userName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create connect account');
      }

      const data = await response.json();
      setAccountId(data.accountId);
      setStep('onboarding');

      showSuccessToast('Stripe account created successfully!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating connect account:', error);
      showErrorToast('Failed to create Stripe account');
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const checkAccountStatus = useCallback(async () => {
    if (!accountId) return;

    try {
      const response = await fetch(`/api/mock-stripe/connect-account/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const status = await response.json();
        setAccountStatus(status);

        if (status.charges_enabled && status.payouts_enabled) {
          setStep('complete');
          showSuccessToast('Account setup completed!');
          onComplete?.();
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking account status:', error);
    }
  }, [accountId, onComplete, showSuccessToast]);

  const simulateOnboardingComplete = async () => {
    if (!accountId) return;

    setLoading(true);

    try {
      // Simulate completing onboarding requirements
      const response = await fetch('/api/mock-stripe/update-account-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountId: accountId,
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true
        })
      });

      if (response.ok) {
        await checkAccountStatus();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating account status:', error);
      showErrorToast('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'onboarding') {
      // Check account status periodically
      const interval = setInterval(checkAccountStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [step, accountId, checkAccountStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Stripe Connect Onboarding
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your payment account to receive rewards from brands.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step === 'initial' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'initial' ? 'bg-green-100' : 'bg-gray-100'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Create Account</span>
            </div>
            <div className={`flex items-center ${step === 'onboarding' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'onboarding' ? 'bg-green-100' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Complete Setup</span>
            </div>
            <div className={`flex items-center ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 'initial' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Your Payment Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                                 We&apos;ll create a secure Stripe Connect account for you to receive payments from brands.
              </p>
            </div>
            <button
              onClick={createConnectAccount}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
            >
              Create Account
            </button>
          </div>
        )}

        {step === 'creating' && (
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Creating your Stripe Connect account...
            </p>
          </div>
        )}

        {step === 'onboarding' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Complete Your Account Setup
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account has been created! Now you need to complete the setup process.
              </p>
            </div>

            {/* Account Status */}
            {accountStatus && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Account ID:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{accountId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Charges Enabled:</span>
                    <span className={`text-sm ${accountStatus.charges_enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {accountStatus.charges_enabled ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payouts Enabled:</span>
                    <span className={`text-sm ${accountStatus.payouts_enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {accountStatus.payouts_enabled ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Details Submitted:</span>
                    <span className={`text-sm ${accountStatus.details_submitted ? 'text-green-600' : 'text-red-600'}`}>
                      {accountStatus.details_submitted ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={simulateOnboardingComplete}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
              >
                Complete Setup (Mock)
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Requirements Info */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What&apos;s Required:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Business information (name, address)</li>
                <li>• Bank account details for payouts</li>
                <li>• Identity verification</li>
                <li>• Tax information</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Account Setup Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your Stripe Connect account is ready to receive payments from brands.
              </p>
            </div>
            <button
              onClick={onComplete}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorStripeOnboarding;

