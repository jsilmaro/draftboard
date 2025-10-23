import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface StripeAccountStatus {
  connected: boolean;
  accountId?: string;
  status: 'not_connected' | 'pending' | 'active' | 'restricted';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: Record<string, unknown>;
  country?: string;
  default_currency?: string;
  business_type?: string;
  email?: string;
}

interface CreatorStripeConnectProps {
  onStatusChange?: (status: StripeAccountStatus) => void;
  className?: string;
}

const CreatorStripeConnect: React.FC<CreatorStripeConnectProps> = ({ 
  onStatusChange,
  className = '' 
}) => {
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus>({
    connected: false,
    status: 'not_connected'
  });
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    checkAccountStatus();
  }, [checkAccountStatus]);

  const checkAccountStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/creator-stripe/account-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const status = await response.json();
        setAccountStatus(status);
        onStatusChange?.(status);
      } else {
        // Failed to fetch account status
      }
    } catch (error) {
      // Error checking account status
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  const createStripeAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/creator-stripe/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          country: 'US',
          email: localStorage.getItem('userEmail') || ''
        })
      });

      if (response.ok) {
        showSuccessToast('Stripe account created! Now completing setup...');
        await createOnboardingLink();
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || 'Failed to create Stripe account');
      }
    } catch (error) {
      showErrorToast('Failed to create Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const createOnboardingLink = async () => {
    try {
      setOnboarding(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/creator-stripe/create-account-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/creator/dashboard?stripe=success`,
          refreshUrl: `${window.location.origin}/creator/dashboard?stripe=refresh`
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || 'Failed to create onboarding link');
      }
    } catch (error) {
      showErrorToast('Failed to create onboarding link');
    } finally {
      setOnboarding(false);
    }
  };

  const createLoginLink = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/creator-stripe/create-login-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Open Stripe dashboard in new tab
        window.open(data.url, '_blank');
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || 'Failed to create login link');
      }
    } catch (error) {
      showErrorToast('Failed to create login link');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'restricted': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'pending': return '⏳';
      case 'restricted': return '⚠️';
      default: return '❌';
    }
  };

  if (loading && !accountStatus.connected) {
    return (
      <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Stripe Connect Account
      </h3>

      {!accountStatus.connected ? (
        // Not Connected State
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect Your Stripe Account
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Stripe account to receive payments directly when you win briefs.
          </p>
          <button
            onClick={createStripeAccount}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
          >
            {loading ? 'Creating Account...' : 'Connect Stripe Account'}
          </button>
        </div>
      ) : (
        // Connected State
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getStatusIcon(accountStatus.status)}</span>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Stripe Connected
                </h4>
                <p className={`text-sm ${getStatusColor(accountStatus.status)}`}>
                  Status: {accountStatus.status.charAt(0).toUpperCase() + accountStatus.status.slice(1)}
                </p>
              </div>
            </div>
            <button
              onClick={createLoginLink}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {loading ? 'Opening...' : 'View Dashboard'}
            </button>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Charges</p>
              <p className={`font-medium ${accountStatus.chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {accountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payouts</p>
              <p className={`font-medium ${accountStatus.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {accountStatus.requirements && accountStatus.requirements.currently_due?.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Missing Requirements:
              </h5>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {accountStatus.requirements.currently_due.map((requirement: string, index: number) => (
                  <li key={index}>• {requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Account Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Country: {accountStatus.country || 'US'}</p>
            <p>Currency: {accountStatus.default_currency || 'USD'}</p>
            <p>Account ID: {accountStatus.accountId}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={checkAccountStatus}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
            {accountStatus.status === 'pending' && (
              <button
                onClick={createOnboardingLink}
                disabled={onboarding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                {onboarding ? 'Opening...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          How Stripe Connect Works
        </h5>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Connect your Stripe account to receive direct payments</li>
          <li>• When you win a brief, funds are automatically transferred to your account</li>
          <li>• No manual withdrawal requests needed</li>
          <li>• Professional payment processing with industry-standard security</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatorStripeConnect;
