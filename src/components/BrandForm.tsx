import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';

interface BrandFormData {
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactInfo: string;
  bankingInfo: string;
}

const BrandForm: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BrandFormData>();

  const password = watch('password');

  const onSubmit = async (data: BrandFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/brands/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      login(result.user, result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            <DefaultAvatar name="Brand" size="xl" className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Registration</h1>
          <p className="text-gray-600">Create your brand profile to connect with talented creators</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              {...register('companyName', { required: 'Company name is required' })}
              className="input-field"
              placeholder="Enter your company name"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="form-label">Contact Person Name *</label>
            <input
              type="text"
              {...register('contactName', { required: 'Contact person name is required' })}
              className="input-field"
              placeholder="Enter the contact person's full name"
            />
            {errors.contactName && (
              <p className="text-red-500 text-sm mt-1">{errors.contactName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="input-field"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password *</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              className="input-field"
              placeholder="Create a strong password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label">Confirm Password *</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              className="input-field"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <label className="form-label">Contact Information *</label>
            <textarea
              {...register('contactInfo', { required: 'Contact information is required' })}
              className="input-field"
              rows={3}
              placeholder="Phone: +1 (555) 123-4567&#10;Address: 123 Business St, City, State 12345&#10;Website: https://yourcompany.com"
            />
            {errors.contactInfo && (
              <p className="text-red-500 text-sm mt-1">{errors.contactInfo.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Provide your business contact details
            </p>
          </div>

          {/* Banking Information */}
          <div>
            <label className="form-label">Banking Information *</label>
            <textarea
              {...register('bankingInfo', { required: 'Banking information is required' })}
              className="input-field"
              rows={3}
              placeholder="Bank account details for payments (mocked for demo)"
            />
            {errors.bankingInfo && (
              <p className="text-red-500 text-sm mt-1">{errors.bankingInfo.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              This information is required to process payments to creators
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Brand Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <span className="text-primary-600 font-medium cursor-pointer">
              Contact support
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandForm; 