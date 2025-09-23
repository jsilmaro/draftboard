import React from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, isStripeLive } from '../config/stripe';

interface StripeContextType {
  stripe: Stripe | null;
  isStripeReady: boolean;
  error: string | null;
}

const StripeContext = React.createContext<StripeContextType>({
  stripe: null,
  isStripeReady: false,
  error: null,
});

export const useStripeContext = () => React.useContext(StripeContext);

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [isStripeReady, setIsStripeReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeStripe = async () => {
      // Only initialize Stripe.js if we're in live mode
      if (!isStripeLive()) {
        setIsStripeReady(true);
        return;
      }

      try {
        if (!STRIPE_CONFIG.LIVE.PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key is required for live mode');
        }

        // Load Stripe.js following official documentation
        const stripeInstance = await loadStripe(STRIPE_CONFIG.LIVE.PUBLISHABLE_KEY);
        
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }

        setStripe(stripeInstance);
        setIsStripeReady(true);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsStripeReady(false);
      }
    };

    initializeStripe();
  }, []);

  const contextValue: StripeContextType = {
    stripe,
    isStripeReady,
    error,
  };

  return (
    <StripeContext.Provider value={contextValue}>
      {children}
    </StripeContext.Provider>
  );
};

export default StripeProvider;

