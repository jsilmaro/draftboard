import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { isStripeTest, isStripeLive } from '../config/stripe';

interface StripeConnectButtonProps {
  onStatusChange?: (status: StripeAccountStatus | null) => void;
  accountStatus?: StripeAccountStatus | null;
  className?: string;
}

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

const StripeConnectButton: React.FC<StripeConnectButtonProps> = ({ 
  onStatusChange: _onStatusChange, 
  accountStatus,
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  // No longer need to check status on mount - we receive it as prop

  // checkAccountStatus function removed - no longer needed since we receive status as prop

  const createConnectAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showErrorToast('Please log in to connect your Stripe account');
        return;
      }

      const response = await fetch('/api/creators/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ country: 'US' })
      });

      if (response.ok) {
        showSuccessToast('Stripe account created! Now completing setup...');
        await createOnboardingLink();
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.message || 'Failed to create Stripe account');
      }
    } catch (error) {
      showErrorToast('Failed to create Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const createOnboardingLink = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/creators/onboard/link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard?tab=wallet&stripe=success`,
          refreshUrl: `${window.location.origin}/dashboard?tab=wallet&stripe=refresh`
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe onboarding
        window.location.href = data.data.url;
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.message || 'Failed to create onboarding link');
      }
    } catch (error) {
      showErrorToast('Failed to create onboarding link');
    }
  };

  const getButtonContent = () => {
    // No longer checking status since we receive it as prop

    if (!accountStatus) {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Connect Stripe to get paid
        </div>
      );
    }

    if (accountStatus.status === 'active' && accountStatus.payoutsEnabled) {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Stripe Connected ✓
        </div>
      );
    }

    if (accountStatus.status === 'restricted') {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Continue Onboarding
        </div>
      );
    }

    if (accountStatus.status === 'pending') {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Complete Setup
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Connect Stripe to get paid
      </div>
    );
  };

  const getButtonStyle = () => {
    if (accountStatus?.status === 'active' && accountStatus?.payoutsEnabled) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    if (accountStatus?.status === 'restricted') {
      return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }
    if (accountStatus?.status === 'pending') {
      return 'bg-orange-600 hover:bg-orange-700 text-white';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  const getModeIndicator = () => {
    if (isStripeTest()) {
      return (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
          🧪 TEST MODE - Use test cards like 4242 4242 4242 4242
        </div>
      );
    } else if (isStripeLive()) {
      return (
        <div className="text-xs text-green-600 dark:text-green-400 mb-2">
          🔴 LIVE MODE - Real money transactions
        </div>
      );
    }
    return null;
  };

  const handleClick = () => {
    if (accountStatus?.status === 'active' && accountStatus?.payoutsEnabled) {
      return; // Already connected
    }
    
    if (accountStatus?.status === 'pending' || accountStatus?.status === 'restricted') {
      createOnboardingLink();
    } else {
      createConnectAccount();
    }
  };

  // No longer show checking status since we receive accountStatus as prop

  return (
    <div>
      {getModeIndicator()}
      <button
        onClick={handleClick}
        disabled={loading || (accountStatus?.status === 'active' && accountStatus?.payoutsEnabled)}
        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle()} ${className}`}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

export default StripeConnectButton;
