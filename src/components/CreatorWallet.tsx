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

interface Payout {
  id: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
  brief: {
    id: string;
    title: string;
    brand: {
      id: string;
      name: string;
    };
  };
  submission: {
    id: string;
    title: string;
  };
}

const CreatorWallet: React.FC = () => {
  // Auth and theme context available if needed
  // const { user } = useAuth();
  // const { isDark } = useTheme();
  const [stripeAccountStatus, setStripeAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
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

      // Get user ID from token or context
      const userId = localStorage.getItem('userId') || 'current'; // This should come from auth context
      const response = await fetch(`/api/stripe/account/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStripeAccountStatus(data);
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

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const userId = localStorage.getItem('userId') || 'current';
      const response = await fetch(`/api/stripe/payouts/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data);
      }
    } catch (error) {
      // Error fetching payouts
    }
  };

  useEffect(() => {
    fetchStripeAccountStatus();
    fetchPayouts();
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
                  <div className={`w-3 h-3 rounded-full ${
                    stripeAccountStatus.status === 'active' 
                      ? 'bg-green-500' 
                      : stripeAccountStatus.status === 'restricted'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stripeAccountStatus.status === 'active' 
                      ? '✅ Stripe Connected – Ready for Payouts' 
                      : stripeAccountStatus.status === 'restricted'
                      ? '⚠️ Account Connected but Verification Required'
                      : '❌ Setup Incomplete'}
                  </span>
                </div>

                <div className={`text-xs p-3 rounded-lg ${
                  stripeAccountStatus.status === 'active' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : stripeAccountStatus.status === 'restricted'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Charges:</span>
                      <span className={stripeAccountStatus.chargesEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {stripeAccountStatus.chargesEnabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Payouts:</span>
                      <span className={stripeAccountStatus.payoutsEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {stripeAccountStatus.payoutsEnabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  {stripeAccountStatus.requirements?.currently_due && stripeAccountStatus.requirements.currently_due.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <p className="font-medium">⚠️ Missing Requirements:</p>
                      <ul className="mt-1 list-disc list-inside">
                        {stripeAccountStatus.requirements.currently_due.map((requirement, index) => (
                          <li key={index} className="capitalize">{requirement.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {stripeAccountStatus.country && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <p><span className="font-medium">Country:</span> {stripeAccountStatus.country.toUpperCase()}</p>
                      {stripeAccountStatus.default_currency && (
                        <p><span className="font-medium">Currency:</span> {stripeAccountStatus.default_currency.toUpperCase()}</p>
                      )}
                    </div>
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

        {/* Payout History */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payout History
          </h3>
          
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No payouts yet. Win some briefs to see your earnings here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {payout.brief.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Brand: {payout.brief.brand.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submission: {payout.submission.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        ${payout.netAmount.toFixed(2)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        payout.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span>Gross: ${payout.amount.toFixed(2)}</span>
                      <span className="mx-2">•</span>
                      <span>Fee: ${payout.platformFee.toFixed(2)}</span>
                    </div>
                    <div>
                      {payout.paidAt ? (
                        <span>Paid: {new Date(payout.paidAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Created: {new Date(payout.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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