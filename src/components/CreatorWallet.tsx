import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useTheme } from '../contexts/ThemeContext';
import StripeConnectButton from './StripeConnectButton';
import PaymentStatusCard from './PaymentStatusCard';

interface StripeAccountStatus {
  id: string;
  status: 'pending' | 'restricted' | 'active';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  country?: string;
  default_currency?: string;
  business_type?: string;
  email?: string;
}

const CreatorWallet: React.FC = () => {
  // Auth and theme context available if needed
  // const { user } = useAuth();
  // const { isDark } = useTheme();
  const [stripeAccountStatus, setStripeAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStripeAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/creators/onboard/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStripeAccountStatus(data.data);
      } else if (response.status === 404) {
        // If no Stripe account exists, that's fine - user can create one
        setStripeAccountStatus(null);
      } else {
        throw new Error('Failed to fetch account status');
      }
    } catch (err) {
      setError('Failed to load Stripe account status');
    } finally {
      setLoading(false);
    }
  };

  const recheckAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/creators/onboard/recheck', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStripeAccountStatus(data.data);
      } else {
        throw new Error('Failed to recheck account status');
      }
    } catch (err) {
      setError('Failed to recheck account status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeAccountStatus();
  }, []); // Only run once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Creator Wallet
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your Stripe Connect account and track your earnings
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stripe Connect Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stripe Connect
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Connect your Stripe account to receive payments directly when you win briefs.
            </p>
            
            {stripeAccountStatus ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    stripeAccountStatus.status === 'active' 
                      ? 'bg-green-500' 
                      : stripeAccountStatus.status === 'restricted'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stripeAccountStatus.status === 'active' 
                      ? 'Stripe Connected – Payouts Enabled' 
                      : stripeAccountStatus.status === 'restricted'
                      ? 'Account Connected but More Info Required'
                      : 'Setup Incomplete'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Charges: {stripeAccountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p>Payouts: {stripeAccountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}</p>
                  {stripeAccountStatus.requirements?.currently_due && stripeAccountStatus.requirements.currently_due.length > 0 && (
                    <p className="text-yellow-600 dark:text-yellow-400 mt-2">
                      Missing: {stripeAccountStatus.requirements.currently_due.join(', ')}
                    </p>
                  )}
                </div>

                {stripeAccountStatus.status === 'restricted' && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your account is connected but needs additional verification to enable payouts.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No Stripe account connected
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <StripeConnectButton 
                accountStatus={stripeAccountStatus}
                onStatusChange={setStripeAccountStatus}
              />
              {stripeAccountStatus && (
                <button
                  onClick={recheckAccountStatus}
                  disabled={loading}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Re-check Account Status'}
                </button>
              )}
              
              {/* Test mode simulation button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch('/api/creators/onboard/simulate-verified', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (response.ok) {
                        await fetchStripeAccountStatus();
                      }
                    } catch (err) {
                      // Handle simulation error silently
                    }
                  }}
                  className="w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  🧪 Simulate Fully Verified Account (Test Mode)
                </button>
              )}
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <PaymentStatusCard />
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                How Stripe Connect Works
                </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Connect your Stripe account to receive direct payments</li>
                  <li>When you win a brief, funds are automatically transferred to your account</li>
                  <li>No manual withdrawal requests needed</li>
                  <li>Professional payment processing with industry-standard security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorWallet;