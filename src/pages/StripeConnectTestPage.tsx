import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import CreatorStripeSetup from '../components/CreatorStripeSetup';

const StripeConnectTestPage: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useToast();
  const [connectedAccounts, setConnectedAccounts] = useState<{ id: string; email: string; chargesEnabled: boolean; payoutsEnabled: boolean }[]>([]);
  const [platformBalance, setPlatformBalance] = useState<{ available: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Test creating a payment intent
  const testPaymentIntent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get first connected account for testing
      if (connectedAccounts.length === 0) {
        showErrorToast('No connected accounts available for testing');
        return;
      }

      const testAccount = connectedAccounts[0];
      const testAmount = 10.00; // $10 test payment
      const applicationFee = 0.50; // $0.50 platform fee

      const response = await fetch('/api/stripe-connect/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: testAmount,
          connectedAccountId: testAccount.id,
          applicationFeeAmount: applicationFee,
          briefId: 'test-brief-123',
          submissionId: 'test-submission-456',
          creatorId: testAccount.email, // Using email as creator ID for test
          metadata: {
            test: true,
            description: 'Test payment from DraftBoard Connect'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      showSuccessToast(`Test payment intent created: ${data.paymentIntentId}`);

    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to create test payment intent');
    } finally {
      setLoading(false);
    }
  };

  // Test creating a transfer
  const testTransfer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get first connected account for testing
      if (connectedAccounts.length === 0) {
        showErrorToast('No connected accounts available for testing');
        return;
      }

      const testAccount = connectedAccounts[0];
      const testAmount = 5.00; // $5 test transfer

      const response = await fetch('/api/stripe-connect/create-transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: testAmount,
          connectedAccountId: testAccount.id,
          briefId: 'test-brief-123',
          submissionId: 'test-submission-456',
          creatorId: testAccount.email,
          metadata: {
            test: true,
            description: 'Test transfer from DraftBoard Connect'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transfer');
      }

      const data = await response.json();
      showSuccessToast(`Test transfer created: ${data.transferId}`);

    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to create test transfer');
    } finally {
      setLoading(false);
    }
  };

  // Load connected accounts
  const loadConnectedAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/stripe-connect/connected-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts);
      }
    } catch (error) {
      // Error loading connected accounts
    }
  };

  // Load platform balance
  const loadPlatformBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/stripe-connect/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformBalance(data.balance);
      }
    } catch (error) {
      // Error loading platform balance
    }
  };

  useEffect(() => {
    loadConnectedAccounts();
    loadPlatformBalance();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stripe Connect Test Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test and manage your Stripe Connect integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creator Stripe Setup */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Creator Setup
            </h2>
            <CreatorStripeSetup onSetupComplete={() => {
              loadConnectedAccounts();
              loadPlatformBalance();
            }} />
          </div>

          {/* Platform Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Platform Information
            </h2>
            
            {/* Platform Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Platform Balance
              </h3>
              {platformBalance ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="font-medium">
                      ${(platformBalance.available[0]?.amount || 0) / 100}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span className="font-medium">
                      ${(platformBalance.pending[0]?.amount || 0) / 100}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading balance...</p>
              )}
            </div>

            {/* Connected Accounts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Connected Accounts ({connectedAccounts.length})
              </h3>
              {connectedAccounts.length > 0 ? (
                <div className="space-y-3">
                  {connectedAccounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {account.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {account.country?.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            account.charges_enabled ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.charges_enabled ? 'Active' : 'Inactive'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {account.details_submitted ? 'Verified' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No connected accounts found</p>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testPaymentIntent}
              disabled={loading || connectedAccounts.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Test Payment Intent ($10)'
              )}
            </button>

            <button
              onClick={testTransfer}
              disabled={loading || connectedAccounts.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Test Transfer ($5)'
              )}
            </button>
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
            🚀 Stripe Connect Integration Complete!
          </h3>
          <div className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>✅ <strong>Express Accounts:</strong> Creators can easily onboard with Stripe Express</p>
            <p>✅ <strong>Destination Charges:</strong> Automatic payments with platform fees</p>
            <p>✅ <strong>Direct Transfers:</strong> Alternative payment method for rewards</p>
            <p>✅ <strong>Platform Balance:</strong> Track your platform&apos;s earnings</p>
            <p>✅ <strong>Account Management:</strong> Monitor connected accounts status</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectTestPage;

