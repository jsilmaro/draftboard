import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const { theme, isDark } = useTheme();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      showSuccessToast('Logged out successfully');
      onClose();
    } catch (error) {
      showErrorToast('Failed to logout');
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm ${
      isDark ? 'bg-black/60' : 'bg-gray-900/60'
    }`}>
      <div className={`max-w-lg w-full rounded-2xl shadow-2xl backdrop-blur-xl ${
        isDark ? 'bg-gray-900/95 border border-gray-800' : 'bg-white/95 border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Settings</h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Manage your preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Appearance</h3>
            </div>
            <div className={`p-5 rounded-xl border transition-all duration-200 ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium mb-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Theme</h4>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Current theme: <span className="font-medium capitalize text-green-600">{theme}</span>
                  </p>
                </div>
                <ThemeToggle size="md" />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>About DraftBoard</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Company</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>DraftBoard Platform</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Version</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>1.0.0</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-200 md:col-span-2 ${
                isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Description</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      A platform connecting brands with creative creators for collaborative briefs and projects.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-200 md:col-span-2 ${
                isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-red-500/20' : 'bg-red-100'
                  }`}>
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Contact</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>support@draftboard.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className={`pt-6 border-t ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
