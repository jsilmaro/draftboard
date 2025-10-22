import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

const StripeSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [countdown, setCountdown] = useState(5);

  const stripe = searchParams.get('stripe');
  const type = searchParams.get('type') || 'connect';

  useEffect(() => {
    if (stripe === 'success') {
      // Show success toast
      if (type === 'connect') {
        showToast('🎉 Stripe account connected successfully! You can now receive payments.', 'success');
      } else if (type === 'payment') {
        showToast('💰 Payment processed successfully! Your wallet has been updated.', 'success');
      } else {
        showToast('✅ Stripe operation completed successfully!', 'success');
      }

      // Start countdown to redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to creator dashboard with wallet tab
            navigate('/creator/dashboard?tab=wallet');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [stripe, type, showToast, navigate]);

  const handleRedirect = () => {
    navigate('/creator/dashboard?tab=wallet');
  };

  const handleGoHome = () => {
    navigate('/creator/dashboard');
  };

  if (stripe !== 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Success Page</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is only accessible after a successful Stripe operation.
          </p>
          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className={`rounded-2xl p-8 text-center ${
          isDark 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200 shadow-lg'
        }`}>
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
          >
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          {/* Success Message */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {type === 'connect' && 'Stripe Account Connected!'}
            {type === 'payment' && 'Payment Successful!'}
            {type !== 'connect' && type !== 'payment' && 'Operation Successful!'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400 mb-6"
          >
            {type === 'connect' && 'Your Stripe account has been successfully connected. You can now receive payments from brands when you win briefs.'}
            {type === 'payment' && 'Your payment has been processed successfully. Your wallet balance has been updated.'}
            {type !== 'connect' && type !== 'payment' && 'Your Stripe operation has been completed successfully.'}
          </motion.p>

          {/* User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Welcome back, <span className="font-semibold">{user.fullName || user.userName}</span>!
              </p>
            </motion.div>
          )}

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to your wallet in <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}</span> seconds...
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={handleRedirect}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              View Wallet
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your information is secure with Stripe</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default StripeSuccessPage;
