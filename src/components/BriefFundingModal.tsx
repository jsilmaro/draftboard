import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { isStripeTest, isStripeLive } from '../config/stripe';

interface BriefFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefId: string;
  briefTitle: string;
  onFundingSuccess?: () => void;
}

interface FundingStatus {
  isFunded: boolean;
  totalAmount: number;
  netAmount: number;
  platformFee: number;
  status: string;
  fundedAt?: string;
}

const BriefFundingModal: React.FC<BriefFundingModalProps> = ({
  isOpen,
  onClose,
  briefId,
  briefTitle,
  onFundingSuccess: _onFundingSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [amount, setAmount] = useState('');
  const [platformFee, setPlatformFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const { showErrorToast } = useToast();

  const checkFundingStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const token = localStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`/api/briefs/${briefId}/funding/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFundingStatus(data.data);
      }
    } catch (error) {
      // Handle error silently or show toast notification
    } finally {
      setCheckingStatus(false);
    }
  }, [briefId]);

  useEffect(() => {
    if (isOpen) {
      checkFundingStatus();
    }
  }, [isOpen, checkFundingStatus]);

  useEffect(() => {
    if (amount) {
      const total = parseFloat(amount);
      const fee = Math.max((total * 0.05), 0.50); // 5% platform fee, minimum $0.50
      const net = total - fee;
      setPlatformFee(fee);
      setNetAmount(net);
    }
  }, [amount]);

  const handleFundBrief = async () => {
    if (!amount || parseFloat(amount) < 1) {
      showErrorToast('Please enter a valid amount (minimum $1)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Use the correct API endpoint for brief funding
      const response = await fetch(`/api/briefs/${briefId}/fund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          totalAmount: parseFloat(amount)
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to Stripe Checkout using the correct data structure
        window.location.href = result.data.url;
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || 'Failed to create funding session');
      }
    } catch (error) {
      showErrorToast('Failed to fund brief');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fund Brief
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Brief: <span className="font-medium">{briefTitle}</span>
            </p>
          </div>

          {checkingStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : fundingStatus?.isFunded ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Brief Successfully Funded</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Total: ${fundingStatus.totalAmount} | Net: ${fundingStatus.netAmount} | Fee: ${fundingStatus.platformFee}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Funded on: {new Date(fundingStatus.fundedAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funding Amount (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to fund"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              {amount && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%):</span>
                    <span className="font-medium">-${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Net Amount for Creators:</span>
                      <span className="text-green-600 dark:text-green-400">${netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Funds are held securely until winners are selected</li>
                      <li>5% platform fee is deducted from total amount</li>
                      <li>Winners receive payments directly to their Stripe accounts</li>
                      <li>Unused funds are automatically refunded</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mode Indicator */}
              {isStripeTest() && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">🧪 TEST MODE</p>
                      <p className="text-xs">Use test cards like 4242 4242 4242 4242</p>
                    </div>
                  </div>
                </div>
              )}

              {isStripeLive() && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium">🔴 LIVE MODE</p>
                      <p className="text-xs">Real money transactions</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundBrief}
                  disabled={loading || !amount || parseFloat(amount) < 1}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Fund with Stripe'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BriefFundingModal;
