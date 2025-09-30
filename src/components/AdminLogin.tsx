import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the AuthContext adminLogin function
        adminLogin(data.user, data.token);
        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
      <div className="max-w-md w-full mx-4">
        <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-lg shadow-sm p-8`}>
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Admin Login</h1>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Access the admin dashboard</p>
            </div>
            <ThemeToggle size="sm" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'border-gray-600 placeholder-gray-400 bg-gray-700 text-white' 
                    : 'border-gray-300 placeholder-gray-500 bg-white text-gray-900'
                }`}
                placeholder="admin@draftboard.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'border-gray-600 placeholder-gray-400 bg-gray-700 text-white' 
                    : 'border-gray-300 placeholder-gray-500 bg-white text-gray-900'
                }`}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className={`rounded-lg p-3 ${
                isDark 
                  ? 'bg-red-900/20 border border-red-800 text-red-400' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Demo Credentials:
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Email: admin@draftboard.com
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Password: admin123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
