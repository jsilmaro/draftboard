import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';

interface CreatorFormData {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  socialHandles: string;
  portfolio: string;
  bankingInfo: string;
}

const CreatorForm = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreatorFormData>();

  const password = watch('password');

  const onSubmit = async (data: CreatorFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/creators/register', {
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
            <DefaultAvatar name="Creator" size="xl" className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Registration</h1>
          <p className="text-gray-600">Create your creator profile to connect with brands</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username */}
          <div>
            <label className="form-label">Username *</label>
            <input
              type="text"
              {...register('userName', { 
                required: 'Username is required',
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores'
                }
              })}
              className="input-field"
              placeholder="Choose a unique username"
            />
            {errors.userName && (
              <p className="text-red-500 text-sm mt-1">{errors.userName.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className="input-field"
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
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

          {/* Social Handles */}
          <div>
            <label className="form-label">Social Media Handles (Optional)</label>
            <textarea
              {...register('socialHandles')}
              className="input-field"
              rows={3}
              placeholder="Instagram: @username&#10;Twitter: @username&#10;LinkedIn: linkedin.com/in/username"
            />
            <p className="text-sm text-gray-500 mt-1">
              Add your social media handles to help brands discover you
            </p>
          </div>

          {/* Portfolio */}
          <div>
            <label className="form-label">Portfolio URL (Optional)</label>
            <input
              type="url"
              {...register('portfolio', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL starting with http:// or https://'
                }
              })}
              className="input-field"
              placeholder="https://your-portfolio.com"
            />
            {errors.portfolio && (
              <p className="text-red-500 text-sm mt-1">{errors.portfolio.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Link to your portfolio or website
            </p>
          </div>

          {/* Banking Information */}
          <div>
            <label className="form-label">Banking Information *</label>
            <textarea
              {...register('bankingInfo', { required: 'Banking information is required' })}
              className="input-field"
              rows={3}
              placeholder="Bank account details for verification (mocked for demo)"
            />
            {errors.bankingInfo && (
              <p className="text-red-500 text-sm mt-1">{errors.bankingInfo.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              This information is required to verify account legitimacy
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Creator Account'}
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

export default CreatorForm; 