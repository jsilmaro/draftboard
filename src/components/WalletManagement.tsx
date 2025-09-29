import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { STRIPE_CONFIG } from '../config/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.TEST.PUBLISHABLE_KEY);

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

interface WalletManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentMethodForm: React.FC<{
  onSuccess: () => void;
  onClose: () => void;
}> = ({ onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create setup intent for saving payment method
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { client_secret } = await response.json();

      // Confirm setup intent
      const { error, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        setMessage(`Payment method setup failed: ${error.message}`);
      } else if (setupIntent.status === 'succeeded') {
        setMessage('Payment method added successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <div className="text-sm text-yellow-700">
          <strong>Test Card:</strong> 4242 4242 4242 4242<br />
          <strong>Expiry:</strong> Any future date | <strong>CVC:</strong> Any 3-digit number
        </div>
      </div>
    </form>
  );
};

const WalletManagement: React.FC<WalletManagementProps> = ({ isOpen, onClose }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<{
    totalEarned: number;
    totalWithdrawn: number;
    balance: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      fetchWalletBalance();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/stripe/payment-methods', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      // console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/payments/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
        setWalletStats(data);
      }
    } catch (error) {
      // Error fetching wallet balance - silently fail
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/stripe/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      }
    } catch (error) {
      // console.error('Error deleting payment method:', error);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/stripe/payment-methods/${methodId}/default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setPaymentMethods(prev => 
          prev.map(method => ({
            ...method,
            is_default: method.id === methodId
          }))
        );
      }
    } catch (error) {
      // console.error('Error setting default payment method:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Payment Methods</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {showAddForm ? (
            <div>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="mr-2 text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold">Add Payment Method</h3>
              </div>
              
              <Elements stripe={stripePromise}>
                <PaymentMethodForm
                  onSuccess={() => {
                    fetchPaymentMethods();
                    fetchWalletBalance();
                  }}
                  onClose={() => setShowAddForm(false)}
                />
              </Elements>
            </div>
          ) : (
            <div>
              {/* Wallet Balance Display */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Wallet Balance</h3>
                    <p className="text-3xl font-bold">${walletBalance.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">
                      {walletStats && (
                        <>
                          {walletStats.totalEarned && (
                            <p>Total Earned: ${walletStats.totalEarned._sum?.amount?.toFixed(2) || '0.00'}</p>
                          )}
                          {walletStats.totalWithdrawn && (
                            <p>Total Withdrawn: ${walletStats.totalWithdrawn._sum?.amount?.toFixed(2) || '0.00'}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Payment Methods</h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add New Method
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading payment methods...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">No payment methods found</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Your First Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center mr-3">
                          <span className="text-xs font-semibold">
                            {method.card.brand.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {method.card.brand.toUpperCase()} •••• {method.card.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                          </p>
                        </div>
                        {method.is_default && (
                          <span className="ml-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!method.is_default && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMethod(method.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletManagement;
