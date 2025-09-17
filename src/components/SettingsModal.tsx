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
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
      isDark ? 'bg-black/50' : 'bg-gray-900/50'
    }`}>
      <div className={`max-w-md w-full rounded-lg shadow-xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Appearance</h3>
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium mb-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Theme</h4>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Current theme: <span className="font-medium capitalize">{theme}</span>
                  </p>
                </div>
                <ThemeToggle size="md" />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>About DraftBoard</h3>
            
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Company</h4>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>DraftBoard - Creative Collaboration Platform</p>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Version</h4>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>1.0.0</p>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Description</h4>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  A platform connecting brands with creative creators for collaborative briefs and projects.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Contact</h4>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>support@draftboard.com</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className={`pt-4 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
