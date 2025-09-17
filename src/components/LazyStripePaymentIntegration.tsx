import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

interface PaymentFormProps {
  amount: number;
  recipientName: string;
  winnerId?: string;
  briefId?: string;
  creatorId?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const LazyStripePaymentIntegration: React.FC<PaymentFormProps> = (props) => {
  const [StripeComponent, setStripeComponent] = useState<React.ComponentType<PaymentFormProps> | null>(null);
  const [loading, setLoading] = useState(true);
  const { showErrorToast } = useToast();

  useEffect(() => {
    // Only load Stripe components when this component is actually rendered
    const loadStripeComponent = async () => {
      try {
        const { default: StripePaymentIntegration } = await import('./StripePaymentIntegration');
        setStripeComponent(StripePaymentIntegration);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load Stripe component:', error);
        showErrorToast('Payment system unavailable');
      } finally {
        setLoading(false);
      }
    };

    loadStripeComponent();
  }, [showErrorToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-500">Loading payment system...</div>
      </div>
    );
  }

  if (!StripeComponent) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">Payment system unavailable</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return <StripeComponent {...props} />;
};

export default LazyStripePaymentIntegration;
