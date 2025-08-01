import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DefaultAvatar from './DefaultAvatar';
import { useAuth } from '../contexts/AuthContext';

interface CreatorFormData {
  // Step 1: Basic Information
  userName: string;
  fullName: string;
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
  
  // Step 3: Social Media & Portfolio
  socialInstagram: string;
  socialTwitter: string;
  socialLinkedIn: string;
  socialTikTok: string;
  socialYouTube: string;
  portfolio: string;
  
  // Step 4: Banking Information
  paymentMethod: string;
  cardNumber: string;
  cardType: string;
  bankName: string;
  bankAccountType: string;
  bankRouting: string;
  bankAccount: string;
  paypalEmail: string;
  
  // Step 5: Terms
  termsAccepted: boolean;
}

const CreatorForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<CreatorFormData>({
    userName: '',
    fullName: '',
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
    socialTikTok: '',
    socialYouTube: '',
    portfolio: '',
    paymentMethod: '',
    cardNumber: '',
    cardType: '',
    bankName: '',
    bankAccountType: '',
    bankRouting: '',
    bankAccount: '',
    paypalEmail: '',
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

  const handleInputChange = (field: keyof CreatorFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.userName || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
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
        if (formData.userName.length < 3) {
          setError('Username must be at least 3 characters long');
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
        // Social media and portfolio are optional, but portfolio is recommended
        if (!formData.portfolio) {
          setError('Please provide your portfolio URL to help brands discover you');
          return false;
        }
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
        } else if (formData.paymentMethod === 'paypal') {
          if (!formData.paypalEmail) {
            setError('Please provide your PayPal email');
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
      const response = await fetch('/api/creators/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the login function to properly set authentication state
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
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-600'
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
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-teal-600">C</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="text-gray-600">Let's start with your personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={formData.userName}
            onChange={(e) => handleInputChange('userName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="Choose a unique username"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="Create a strong password"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="Confirm your password"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
        <p className="text-gray-600">Provide your contact details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="flex">
            <select
              value={formData.phoneCountry}
              onChange={(e) => handleInputChange('phoneCountry', e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            value={formData.addressCountry}
            onChange={(e) => handleInputChange('addressCountry', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={formData.addressStreet}
            onChange={(e) => handleInputChange('addressStreet', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="123 Main Street"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.addressCity}
            onChange={(e) => handleInputChange('addressCity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="New York"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State/Province *
          </label>
          <input
            type="text"
            value={formData.addressState}
            onChange={(e) => handleInputChange('addressState', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="NY"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP/Postal Code *
          </label>
          <input
            type="text"
            value={formData.addressZip}
            onChange={(e) => handleInputChange('addressZip', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="10001"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Social Media & Portfolio</h2>
        <p className="text-gray-600">Help brands discover your work</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio URL *
          </label>
          <input
            type="url"
            value={formData.portfolio}
            onChange={(e) => handleInputChange('portfolio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="https://your-portfolio.com"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <input
            type="text"
            value={formData.socialInstagram}
            onChange={(e) => handleInputChange('socialInstagram', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="@yourusername"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter
          </label>
          <input
            type="text"
            value={formData.socialTwitter}
            onChange={(e) => handleInputChange('socialTwitter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="@yourusername"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn
          </label>
          <input
            type="text"
            value={formData.socialLinkedIn}
            onChange={(e) => handleInputChange('socialLinkedIn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="in/yourprofile"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TikTok
          </label>
          <input
            type="text"
            value={formData.socialTikTok}
            onChange={(e) => handleInputChange('socialTikTok', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="@yourusername"
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube
          </label>
          <input
            type="text"
            value={formData.socialYouTube}
            onChange={(e) => handleInputChange('socialYouTube', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="@yourchannel"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Information</h2>
        <p className="text-gray-600">This information is required to verify account legitimacy</p>
      </div>

      <div className="space-y-6">
        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={formData.paymentMethod === 'paypal'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="mr-3"
              />
              <span>PayPal</span>
            </label>
          </div>
        </div>

        {(formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number (Last 4 digits) *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="**** **** **** 1234"
                maxLength={19}
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type *
              </label>
              <select
                value={formData.cardType}
                onChange={(e) => handleInputChange('cardType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Bank of America"
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type *
              </label>
              <select
                value={formData.bankAccountType}
                onChange={(e) => handleInputChange('bankAccountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Select account type</option>
                {bankAccountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing Number *
              </label>
              <input
                type="text"
                value={formData.bankRouting}
                onChange={(e) => handleInputChange('bankRouting', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="123456789"
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number (Last 4 digits) *
              </label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="**** 5678"
                maxLength={8}
              />
            </div>
          </div>
        )}

        {formData.paymentMethod === 'paypal' && (
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PayPal Email *
            </label>
            <input
              type="email"
              value={formData.paypalEmail}
              onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="your-email@paypal.com"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
        <p className="text-gray-600">Please review and accept our terms</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg max-h-64 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Terms of Service</h3>
        <div className="text-sm text-gray-600 space-y-3">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
          <p>You acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>You are authorized to represent yourself</li>
            <li>All information provided is accurate and current</li>
            <li>You will maintain the security of your account</li>
            <li>You will comply with all applicable laws and regulations</li>
            <li>You understand our fee structure and payment terms</li>
            <li>You own or have rights to all content you submit</li>
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
          <span className="text-sm text-gray-700">
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderStepIndicator()}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderCurrentStep()}

            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <div className="flex-1"></div>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Create Creator Account'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 nav-item">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorForm; 