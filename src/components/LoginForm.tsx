import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInLogin from './GoogleSignInLogin';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
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
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-black to-purple-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Moving Green Wave */}
        <div className="absolute inset-0 animate-pulse">
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#01D924" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#01D924" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="violetGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
              </radialGradient>
            </defs>
            
            {/* Animated Green Wave */}
            <path
              d="M1200 800 Q900 600 600 700 Q300 800 0 600 L0 800 Z"
              fill="url(#greenGlow)"
              className="animate-pulse"
            />
            
            {/* Animated Violet Wave */}
            <path
              d="M1200 800 Q1000 400 700 500 Q400 600 0 400 L0 800 Z"
              fill="url(#violetGlow)"
              className="animate-pulse"
            />
            
            {/* Floating Green Particles */}
            <circle cx="200" cy="200" r="3" fill="#01D924" opacity="0.6" className="animate-bounce">
              <animate attributeName="cy" values="200;150;200" dur="4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="800" cy="300" r="2" fill="#01D924" opacity="0.4" className="animate-bounce">
              <animate attributeName="cy" values="300;250;300" dur="5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="400" cy="500" r="4" fill="#01D924" opacity="0.5" className="animate-bounce">
              <animate attributeName="cy" values="500;450;500" dur="6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="6s" repeatCount="indefinite"/>
            </circle>
            
            {/* Floating Violet Particles */}
            <circle cx="600" cy="150" r="2" fill="#8B5CF6" opacity="0.5" className="animate-bounce">
              <animate attributeName="cy" values="150;100;150" dur="7s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="7s" repeatCount="indefinite"/>
            </circle>
            <circle cx="1000" cy="400" r="3" fill="#8B5CF6" opacity="0.3" className="animate-bounce">
              <animate attributeName="cy" values="400;350;400" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="300" cy="600" r="2" fill="#8B5CF6" opacity="0.4" className="animate-bounce">
              <animate attributeName="cy" values="600;550;600" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="9s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        
        {/* Moving Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-purple-900/20 animate-pulse" />
        
        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-500/10 rounded-full blur-xl animate-pulse">
          <div className="w-full h-full bg-green-400/20 rounded-full animate-ping"></div>
        </div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse">
          <div className="w-full h-full bg-purple-400/20 rounded-full animate-ping"></div>
        </div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse">
          <div className="w-full h-full bg-green-400/20 rounded-full animate-ping"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white slide-in-up">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-300 fade-in-delay-1">
              Or{' '}
              <Link to="https://www.draftboardapp.io/" className="font-medium text-green-400 hover:text-green-300 nav-item">
                go back to home
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-sm py-6 sm:py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 scale-in border border-gray-700/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="email" className="block text-sm font-medium text-white">
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
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all bg-gray-700/80 backdrop-blur-sm text-white"
                    placeholder="admin@gmail.com"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password" className="block text-sm font-medium text-white">
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
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all bg-gray-700/80 backdrop-blur-sm text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

                                            <div>
                 <button
                   type="submit"
                   disabled={isLoading}
                   className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed btn-primary transition-all duration-300"
                   style={{
                     boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)'
                   }}
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
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800/80 backdrop-blur-sm text-gray-400">New to the platform?</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/brand/register"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700/80 backdrop-blur-sm text-sm font-medium text-white hover:bg-gray-600/80 transition-all duration-300"
                >
                  Register as Brand
                </Link>
                <Link
                  to="/creator/register"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700/80 backdrop-blur-sm text-sm font-medium text-white hover:bg-gray-600/80 transition-all duration-300"
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