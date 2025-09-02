// Stripe Configuration
// Toggle between mock and live implementations

export const STRIPE_CONFIG = {
  // Set to 'mock' for development/testing, 'live' for production
  MODE: import.meta.env.VITE_STRIPE_MODE || 'mock',
  
  // Live Stripe Configuration (when MODE is 'live')
  LIVE: {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    SECRET_KEY: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
    CONNECT_CLIENT_ID: import.meta.env.VITE_STRIPE_CONNECT_CLIENT_ID || '',
    WEBHOOK_SECRET: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Mock Configuration
  MOCK: {
    BASE_URL: '/api/mock-stripe',
    ENABLED: true,
  },
  
  // Common Configuration
  COMMON: {
    CURRENCY: 'usd',
    MINIMUM_WITHDRAWAL: 10.00,
    PLATFORM_FEE_PERCENTAGE: 0.05, // 5%
    SUPPORTED_COUNTRIES: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK'],
  }
};

// Helper functions
export const isStripeLive = () => STRIPE_CONFIG.MODE === 'live';
export const isStripeMock = () => STRIPE_CONFIG.MODE === 'mock';

export const getStripeConfig = () => {
  if (isStripeLive()) {
    return {
      mode: 'live',
      publishableKey: STRIPE_CONFIG.LIVE.PUBLISHABLE_KEY,
      connectClientId: STRIPE_CONFIG.LIVE.CONNECT_CLIENT_ID,
      baseUrl: '/api/stripe',
    };
  } else {
    return {
      mode: 'mock',
      publishableKey: null,
      connectClientId: null,
      baseUrl: STRIPE_CONFIG.MOCK.BASE_URL,
    };
  }
};

// Environment validation
export const validateStripeConfig = () => {
  if (isStripeLive()) {
    const required = ['PUBLISHABLE_KEY', 'SECRET_KEY', 'CONNECT_CLIENT_ID'];
    const missing = required.filter(key => !STRIPE_CONFIG.LIVE[key as keyof typeof STRIPE_CONFIG.LIVE]);
    
    if (missing.length > 0) {
      return false;
    }
    return true;
  }
  return true;
};

export default STRIPE_CONFIG;
