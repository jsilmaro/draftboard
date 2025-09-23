import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import { isStripeTest, isStripeLive } from '../config/stripe';

interface PaymentStatusCardProps {
  className?: string;
  payouts?: CreatorPayout[];
}

interface CreatorPayout {
  id: string;
  amount: number;
  netAmount: number;
  platformFee: number;
  status: string;
  paidAt?: string;
  createdAt: string;
  brief: {
    title: string;
    brand: {
      companyName: string;
    };
  };
  submission: {
    id: string;
    submittedAt: string;
  };
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({ className = '', payouts: propPayouts = [] }) => {
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingPayments: 0,
    completedPayments: 0
  });
  const { showErrorToast } = useToast();

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/creators/payouts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data);
        
        // Calculate stats
        const totalEarned = data.data
          .filter((p: CreatorPayout) => p.status === 'paid')
          .reduce((sum: number, p: CreatorPayout) => sum + p.netAmount, 0);
        
        const pendingPayments = data.data.filter((p: CreatorPayout) => p.status === 'pending').length;
        const completedPayments = data.data.filter((p: CreatorPayout) => p.status === 'paid').length;
        
        setStats({
          totalEarned,
          pendingPayments,
          completedPayments
        });
      } else {
        showErrorToast('Failed to load payment history');
      }
    } catch (error) {
      showErrorToast('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  // Create a stable reference to propPayouts to prevent infinite loops
  const stablePropPayouts = useMemo(() => propPayouts, [
    propPayouts.length,
    propPayouts.map(p => `${p.id}-${p.status}-${p.amount}`).join(',')
  ]);

  // Initialize with prop payouts if provided, otherwise show empty state
  useEffect(() => {
    if (stablePropPayouts && stablePropPayouts.length > 0) {
      // Use prop payouts
      setPayouts(stablePropPayouts);
      setLoading(false);
      
      // Calculate stats from prop payouts
      const totalEarned = stablePropPayouts.reduce((sum, payout) => sum + parseFloat(payout.amount.toString()), 0);
      const pendingPayments = stablePropPayouts.filter(p => p.status === 'pending').length;
      const completedPayments = stablePropPayouts.filter(p => p.status === 'completed').length;
      
      setStats({ totalEarned, pendingPayments, completedPayments });
    } else {
      // Show empty state
      setPayouts([]);
      setLoading(false);
      setStats({ totalEarned: 0, pendingPayments: 0, completedPayments: 0 });
    }
  }, [stablePropPayouts]); // Use stable reference

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Status
          </h3>
          <button
            onClick={fetchPayouts}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalEarned.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendingPayments}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completedPayments}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Recent Payments
          </h4>
          
          {/* Mode Indicator */}
          {isStripeTest() && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">🧪 TEST MODE</p>
                  <p className="text-xs">Payments are simulated for testing</p>
                </div>
              </div>
            </div>
          )}

          {isStripeLive() && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium">🔴 LIVE MODE</p>
                  <p className="text-xs">Real money transactions</p>
                </div>
              </div>
            </div>
          )}

          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No payments yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Start submitting to briefs to earn money!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.slice(0, 5).map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {payout.brief.title}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                        <span className="ml-1 capitalize">{payout.status}</span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {payout.brief.brand.companyName} • ${payout.netAmount.toFixed(2)}
                      {payout.status === 'paid' && payout.paidAt && (
                        <span> • Paid {new Date(payout.paidAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {payouts.length > 5 && (
                <div className="text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View all payments ({payouts.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusCard;
