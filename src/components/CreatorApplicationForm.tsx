import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface CreatorApplicationFormProps {
  brief: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    reward: number;
    deadline: string;
    brand: {
      companyName: string;
      logo?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { contentUrl: string; additionalInfo?: string }) => Promise<void>;
  isEdit?: boolean;
  existingSubmission?: {
    contentUrl: string;
    additionalInfo?: string;
  };
}

const CreatorApplicationForm: React.FC<CreatorApplicationFormProps> = ({
  brief,
  isOpen,
  onClose,
  onSubmit,
  isEdit = false,
  existingSubmission
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    contentUrl: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEdit && existingSubmission) {
      setFormData({
        contentUrl: existingSubmission.contentUrl || '',
        additionalInfo: existingSubmission.additionalInfo || ''
      });
    } else {
      setFormData({
        contentUrl: '',
        additionalInfo: ''
      });
    }
    setErrors({});
  }, [isEdit, existingSubmission, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.contentUrl.trim()) {
      newErrors.contentUrl = 'Content URL is required';
    } else if (!isValidUrl(formData.contentUrl)) {
      newErrors.contentUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full rounded-xl shadow-2xl ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {brief.brand.logo && (
              <img 
                src={brief.brand.logo} 
                alt={brief.brand.companyName}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isEdit ? 'Update Application' : 'Apply to Brief'}
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {brief.brand.companyName} • {brief.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Brief Information */}
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Brief Details
            </h3>
            <p className={`text-sm mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <strong>Description:</strong> {brief.description}
            </p>
            <p className={`text-sm mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <strong>Requirements:</strong> {brief.requirements}
            </p>
            <p className={`text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <strong>Reward:</strong> ${brief.reward.toLocaleString()} • 
              <strong> Deadline:</strong> {new Date(brief.deadline).toLocaleDateString()}
            </p>
          </div>

          {/* Content URL Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Link Content Submission *
            </label>
            <input
              type="url"
              value={formData.contentUrl}
              onChange={(e) => handleInputChange('contentUrl', e.target.value)}
              placeholder="https://example.com/your-content"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.contentUrl
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : isDark
                    ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.contentUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.contentUrl}</p>
            )}
            <p className={`mt-1 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Submit a link to your content (video, article, social media post, etc.)
            </p>
          </div>

          {/* Additional Information Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Additional Information (Optional)
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional details about your submission..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                isDark
                  ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <p className={`mt-1 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Provide any additional context or information about your submission
            </p>
          </div>

          {/* Creator Information */}
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Your Information
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <strong>Creator:</strong> {user?.fullName || user?.userName} ({user?.email})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting 
                ? 'Submitting...' 
                : isEdit 
                  ? 'Update Application' 
                  : 'Submit Application'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorApplicationForm;
