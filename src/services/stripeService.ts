import { STRIPE_CONFIG, getStripeConfig, isStripeLive, isStripeMock } from '../config/stripe';

// Types for Stripe operations
export interface StripeConnectAccount {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: Record<string, unknown>;
  country?: string;
  default_currency?: string;
  email?: string;
  business_type?: string;
  capabilities?: Record<string, string>;
}

export interface StripeTransfer {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  status: string;
  created: number;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  amount_total: number;
  currency: string;
  status: string;
  url: string;
  payment_intent?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata?: Record<string, string>;
}

// Base Stripe Service Class
class BaseStripeService {
  protected config = getStripeConfig();
  protected baseUrl: string;

  constructor() {
    this.baseUrl = this.config.baseUrl;
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Mock Stripe Service Implementation
class MockStripeService extends BaseStripeService {
  async createConnectAccount(creatorData: {
    creatorId: string;
    email: string;
    name: string;
    country?: string;
  }): Promise<{ accountId: string }> {
    const result = await this.makeRequest('/create-connect-account', {
      method: 'POST',
      body: JSON.stringify(creatorData),
    });
    return { accountId: result.accountId };
  }

  async getConnectAccount(accountId: string): Promise<StripeConnectAccount> {
    return this.makeRequest(`/connect-account/${accountId}`);
  }

  async updateAccountStatus(accountId: string, status: Partial<StripeConnectAccount>): Promise<void> {
    return this.makeRequest('/update-account-status', {
      method: 'POST',
      body: JSON.stringify({ accountId, ...status }),
    });
  }

  async createTransfer(transferData: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeTransfer> {
    return this.makeRequest('/create-transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async createCheckoutSession(sessionData: {
    briefId: string;
    amount: number;
    brandId: string;
    briefTitle: string;
  }): Promise<StripeCheckoutSession> {
    return this.makeRequest('/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.makeRequest(`/payment-intent/${paymentIntentId}`);
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{ status: string }> {
    return this.makeRequest('/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, paymentMethodId }),
    });
  }
}

// Live Stripe Service Implementation
class LiveStripeService extends BaseStripeService {
  private stripe: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    super();
    this.initializeStripe();
  }

  private async initializeStripe() {
    try {
      // Properly import and initialize Stripe.js
      const { loadStripe } = await import('@stripe/stripe-js');
      
      if (!STRIPE_CONFIG.LIVE.PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key is required for live mode');
      }
      
      this.stripe = await loadStripe(STRIPE_CONFIG.LIVE.PUBLISHABLE_KEY);
      
      if (!this.stripe) {
        throw new Error('Failed to load Stripe');
      }
    } catch (error) {
      throw new Error(`Stripe initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add updateAccountStatus method for compatibility
  async updateAccountStatus(_accountId: string, _status: Partial<StripeConnectAccount>): Promise<void> {
    // For live Stripe, this would typically update the account via Stripe API
    // For now, we'll just return success
    return Promise.resolve();
  }

  async createConnectAccount(creatorData: {
    creatorId: string;
    email: string;
    name: string;
    country?: string;
  }): Promise<{ accountId: string; accountLink: string }> {
    return this.makeRequest('/create-connect-account', {
      method: 'POST',
      body: JSON.stringify(creatorData),
    });
  }

  async getConnectAccount(accountId: string): Promise<StripeConnectAccount> {
    return this.makeRequest(`/connect-account/${accountId}`);
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<{ url: string }> {
    return this.makeRequest('/create-account-link', {
      method: 'POST',
      body: JSON.stringify({ accountId, refreshUrl, returnUrl }),
    });
  }

  async createTransfer(transferData: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeTransfer> {
    return this.makeRequest('/create-transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async createCheckoutSession(sessionData: {
    briefId: string;
    amount: number;
    brandId: string;
    briefTitle: string;
  }): Promise<StripeCheckoutSession> {
    return this.makeRequest('/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.makeRequest(`/payment-intent/${paymentIntentId}`);
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{ status: string }> {
    return this.makeRequest('/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, paymentMethodId }),
    });
  }

  // Live Stripe specific methods following official Stripe.js documentation
  async redirectToConnectOnboarding(accountId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { url } = await this.createAccountLink(
      accountId,
      `${window.location.origin}/creator/wallet?refresh=true`,
      `${window.location.origin}/creator/wallet?success=true`
    );

    window.location.href = url;
  }

  async handlePaymentConfirmation(clientSecret: string, paymentMethod: any): Promise<{ status: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    // Use the proper Stripe.js confirmCardPayment method
    const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { status: paymentIntent.status };
  }

  // Additional Stripe.js methods following official documentation
  async createPaymentElement(clientSecret: string, options: any = {}) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    // Create Elements instance for advanced payment forms
    const elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0570de',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'Ideal Sans, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '4px',
        },
      },
      ...options
    });

    return elements;
  }

  // Method to check if Stripe is ready
  isStripeReady(): boolean {
    return this.stripe !== null;
  }

  // Method to get Stripe instance for direct access
  getStripeInstance() {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe;
  }
}

// Factory function to get the appropriate service
export const createStripeService = () => {
  if (isStripeLive()) {
    return new LiveStripeService();
  } else {
    return new MockStripeService();
  }
};

// Export the service instance
export const stripeService = createStripeService();

// Export types and utilities
export { STRIPE_CONFIG, isStripeLive, isStripeMock };
export default stripeService;

