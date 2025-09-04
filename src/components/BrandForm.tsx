import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';


interface BrandFormData {
  // Step 1: Basic Information
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Contact Information
  phoneCountry: string;
  phoneNumber: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressCountry: string;
  
  // Step 3: Social Media
  socialInstagram: string;
  socialTwitter: string;
  socialLinkedIn: string;
  socialWebsite: string;
  
  // Step 4: Banking Information
  paymentMethod: string;
  cardNumber: string;
  cardType: string;
  bankName: string;
  bankAccountType: string;
  bankRouting: string;
  bankAccount: string;
  
  // Step 5: Terms
  termsAccepted: boolean;
}

const BrandForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showSuccessToast } = useToast();
  
  const [formData, setFormData] = useState<BrandFormData>({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCountry: '+1',
    phoneNumber: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'United States',
    socialInstagram: '',
    socialTwitter: '',
    socialLinkedIn: '',
    socialWebsite: '',
    paymentMethod: '',
    cardNumber: '',
    cardType: '',
    bankName: '',
    bankAccountType: '',
    bankRouting: '',
    bankAccount: '',
    termsAccepted: false,
  });

  const countries = [
    { code: '+1', name: 'United States' },
    { code: '+44', name: 'United Kingdom' },
    { code: '+91', name: 'India' },
    { code: '+86', name: 'China' },
    { code: '+81', name: 'Japan' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+39', name: 'Italy' },
    { code: '+34', name: 'Spain' },
    { code: '+31', name: 'Netherlands' },
  ];

  const cardTypes = [
    'Visa',
    'Mastercard',
    'American Express',
    'Discover',
    'Other'
  ];

  const bankAccountTypes = [
    'Checking',
    'Savings',
    'Business Checking',
    'Business Savings'
  ];

  const handleInputChange = (field: keyof BrandFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.companyName || !formData.contactName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.phoneNumber || !formData.addressStreet || !formData.addressCity || !formData.addressState || !formData.addressZip) {
          setError('Please fill in all required contact fields');
          return false;
        }
        break;
      case 3:
        // Social media is optional, so no validation needed
        break;
      case 4:
        if (!formData.paymentMethod) {
          setError('Please select a payment method');
          return false;
        }
        if (formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') {
          if (!formData.cardNumber || !formData.cardType) {
            setError('Please fill in all card details');
            return false;
          }
        } else if (formData.paymentMethod === 'bank_transfer') {
          if (!formData.bankName || !formData.bankAccountType || !formData.bankRouting || !formData.bankAccount) {
            setError('Please fill in all bank details');
            return false;
          }
        }
        break;
      case 5:
        if (!formData.termsAccepted) {
          setError('You must accept the terms and conditions');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/brands/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Show welcome toast for new brand
        showSuccessToast(`Welcome to DraftBoard, ${data.user.companyName}! 🎉 Your brand account has been created successfully.`);
        // Use the login function to properly set authentication state (mark as new registration)
        login(data.user, data.token);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <img 
            src="/icons/draftboard-logo.svg" 
            alt="DraftBoard" 
            className="w-12 h-12"
          />
        </div>
        <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                    <p className="text-gray-400">Let&apos;s start with your company details</p>
      </div>

      {/* Google Sign-In Option */}
      <GoogleSignIn
        userType="brand"
        onSuccess={(_userData: unknown) => {
          // Google sign-in successful for brand
          // The GoogleSignIn component will handle the login and navigation
        }}
        onError={(error: string) => {
          setError(error);
        }}
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your company name"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contact Person Name *
          </label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter the contact person's name"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Create a strong password"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Confirm your password"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Contact Information</h2>
                    <p className="text-gray-400">Provide your business contact details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number *
          </label>
          <div className="flex">
            <select
              value={formData.phoneCountry}
              onChange={(e) => handleInputChange('phoneCountry', e.target.value)}
              className="w-24 px-3 py-2 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-600 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Country *
          </label>
          <select
            value={formData.addressCountry}
            onChange={(e) => handleInputChange('addressCountry', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-field md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={formData.addressStreet}
            onChange={(e) => handleInputChange('addressStreet', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="123 Business Street"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.addressCity}
            onChange={(e) => handleInputChange('addressCity', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="New York"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            State/Province *
          </label>
          <input
            type="text"
            value={formData.addressState}
            onChange={(e) => handleInputChange('addressState', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="NY"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ZIP/Postal Code *
          </label>
          <input
            type="text"
            value={formData.addressZip}
            onChange={(e) => handleInputChange('addressZip', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="10001"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Social Media (Optional)</h2>
                    <p className="text-gray-400">Help creators discover your brand</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Instagram
          </label>
          <input
            type="text"
            value={formData.socialInstagram}
            onChange={(e) => handleInputChange('socialInstagram', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="@yourbrand"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Twitter
          </label>
          <input
            type="text"
            value={formData.socialTwitter}
            onChange={(e) => handleInputChange('socialTwitter', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="@yourbrand"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LinkedIn
          </label>
          <input
            type="text"
            value={formData.socialLinkedIn}
            onChange={(e) => handleInputChange('socialLinkedIn', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="company/yourbrand"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.socialWebsite}
            onChange={(e) => handleInputChange('socialWebsite', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="https://yourbrand.com"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Payment Information</h2>
                    <p className="text-gray-400">This information is required to process payments to creators</p>
      </div>

      <div className="space-y-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Payment Method *
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={formData.paymentMethod === 'credit_card'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="mr-3"
              />
              <span>Credit Card</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="debit_card"
                checked={formData.paymentMethod === 'debit_card'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="mr-3"
              />
              <span>Debit Card</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={formData.paymentMethod === 'bank_transfer'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="mr-3"
              />
              <span>Bank Transfer</span>
            </label>
          </div>
        </div>

        {(formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number (Last 4 digits) *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="**** **** **** 1234"
                maxLength={19}
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Type *
              </label>
              <select
                value={formData.cardType}
                onChange={(e) => handleInputChange('cardType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select card type</option>
                {cardTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {formData.paymentMethod === 'bank_transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Bank of America"
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type *
              </label>
              <select
                value={formData.bankAccountType}
                onChange={(e) => handleInputChange('bankAccountType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select account type</option>
                {bankAccountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Routing Number *
              </label>
              <input
                type="text"
                value={formData.bankRouting}
                onChange={(e) => handleInputChange('bankRouting', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="123456789"
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Number (Last 4 digits) *
              </label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="**** 5678"
                maxLength={8}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
                    <p className="text-gray-400">Please review and accept our terms</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg max-h-64 overflow-y-auto">
        <h3 className="font-semibold text-white mb-4">Terms of Service</h3>
                  <div className="text-sm text-gray-400 space-y-3">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
          <p>You acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>You are authorized to represent your company</li>
            <li>All information provided is accurate and current</li>
            <li>You will maintain the security of your account</li>
            <li>You will comply with all applicable laws and regulations</li>
            <li>You understand our fee structure and payment terms</li>
          </ul>
          <p>We are committed to protecting your privacy and will handle your data in accordance with our Privacy Policy.</p>
        </div>
      </div>

      <div className="form-field">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-300">
            I agree to the Terms of Service and Privacy Policy *
          </span>
        </label>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-gray-900/20 backdrop-blur-xl py-6 sm:py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-white/20 dark:border-gray-600/30">
          {renderStepIndicator()}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderCurrentStep()}

            <div className="flex flex-col sm:flex-row justify-between pt-6 space-y-3 sm:space-y-0">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <div className="flex-1"></div>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Create Brand Account'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 nav-item">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandForm; 