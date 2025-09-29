// Stripe Configuration
// Toggle between test and live modes with real Stripe APIs

export const STRIPE_CONFIG = {
  // Set to 'test' for development/testing with real Stripe test keys, 'live' for production
  MODE: import.meta.env.VITE_STRIPE_MODE || import.meta.env.STRIPE_MODE || 'test',
  
  // Test Mode Configuration
  TEST: {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST || '',
    SECRET_KEY: import.meta.env.VITE_STRIPE_SECRET_KEY_TEST || '',
    CONNECT_CLIENT_ID: import.meta.env.VITE_STRIPE_CONNECT_CLIENT_ID_TEST || '',
    WEBHOOK_SECRET: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET_TEST || '',
  },
  
  // Live Mode Configuration
  LIVE: {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE || import.meta.env.STRIPE_PUBLISHABLE_KEY_LIVE || '',
    SECRET_KEY: import.meta.env.VITE_STRIPE_SECRET_KEY_LIVE || import.meta.env.STRIPE_SECRET_KEY_LIVE || '',
    CONNECT_CLIENT_ID: import.meta.env.VITE_STRIPE_CONNECT_CLIENT_ID_LIVE || import.meta.env.STRIPE_CONNECT_CLIENT_ID_LIVE || '',
    WEBHOOK_SECRET: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET_LIVE || import.meta.env.STRIPE_WEBHOOK_SECRET_LIVE || '',
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
export const isStripeTest = () => STRIPE_CONFIG.MODE === 'test';

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
      mode: 'test',
      publishableKey: STRIPE_CONFIG.TEST.PUBLISHABLE_KEY,
      connectClientId: STRIPE_CONFIG.TEST.CONNECT_CLIENT_ID,
      baseUrl: '/api/stripe',
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
  } else if (isStripeTest()) {
    const required = ['PUBLISHABLE_KEY', 'SECRET_KEY', 'CONNECT_CLIENT_ID'];
    const missing = required.filter(key => !STRIPE_CONFIG.TEST[key as keyof typeof STRIPE_CONFIG.TEST]);
    
    if (missing.length > 0) {
      return false;
    }
    return true;
  }
  return true;
};

export default STRIPE_CONFIG;
