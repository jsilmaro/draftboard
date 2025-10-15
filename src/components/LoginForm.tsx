import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInLogin from './GoogleSignInLogin';
import ThemeToggle from './ThemeToggle';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use unified login endpoint without timeout
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user, data.token);
        
        // Navigate based on user type
        if (data.user.type === 'brand') {
          navigate('/brand/dashboard');
        } else if (data.user.type === 'creator') {
          navigate('/creator/dashboard');
        }
        return;
      }

      // Handle error responses
      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.googleOAuthRequired) {
          setError('This account was created with Google Sign-In. Please use the Google Sign-In button below.');
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        setError(`Login failed: ${error.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>

      <div className="relative z-10 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle size="sm" />
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md fade-in">
          <div className="text-center">
            {/* DraftBoard Logo - Just the logo itself */}
            <div className="mb-6 bounce-in">
              <img 
                src="/icons/draftboard-logo.svg" 
                alt="DraftBoard" 
                className="w-16 h-16 mx-auto"
              />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold slide-in-up ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Sign in to your account</h2>
            <p className={`mt-2 text-sm fade-in-delay-1 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Or{' '}
              <Link to="https://www.draftboardapp.io/" className={`font-medium nav-item ${
                isDark ? 'text-green-400 hover:text-green-300' : 'text-blue-600 hover:text-blue-800'
              }`}>
                go back to home
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className={`py-6 sm:py-8 px-4 sm:px-10 scale-in ${
            isDark 
              ? 'bg-gray-800 border border-gray-700 rounded-lg shadow-sm'
              : 'bg-white border border-gray-200 rounded-lg shadow-sm'
          }`}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className={`px-4 py-3 rounded ${
                  isDark 
                    ? 'bg-red-900/20 border border-red-800 text-red-400'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {error}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="email" className={`block text-sm font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm transition-all ${
                      isDark 
                        ? 'border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white'
                        : 'border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900'
                    }`}
                    placeholder="admin@gmail.com"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password" className={`block text-sm font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm transition-all ${
                      isDark 
                        ? 'border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white'
                        : 'border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
                    isDark 
                      ? 'text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                      : 'text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Google Sign-In Option */}
            <GoogleSignInLogin
              onError={(error: string) => {
                setError(error);
              }}
              className="mt-6"
            />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  }`} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${
                    isDark 
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-white text-gray-500'
                  }`}>New to the platform?</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/brand/register"
                  className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Register as Brand
                </Link>
                <Link
                  to="/creator/register"
                  className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Register as Creator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 