import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface Brand {
  id: string;
  companyName: string;
  logo?: string;
  email?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialWebsite?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface BrandPageViewProps {
  brandId: string;
  onClose: () => void;
}

const BrandPageView: React.FC<BrandPageViewProps> = ({ brandId, onClose }) => {
  const { isDark } = useTheme();
  const { showErrorToast } = useToast();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/brands/${brandId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBrand(data);
      } else if (response.status === 404) {
        setError('Brand not found');
      } else {
        throw new Error('Failed to fetch brand details');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load brand details');
      showErrorToast('Failed to load brand details');
    } finally {
      setLoading(false);
    }
  }, [brandId, showErrorToast]);

  useEffect(() => {
    fetchBrandDetails();
  }, [fetchBrandDetails]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-md w-full mx-4`}>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
          <p className={`text-center mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading brand details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-md w-full mx-4`}>
          <div className="text-center">
            <div className={`w-16 h-16 ${isDark ? 'bg-red-900/20' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Unable to Load Brand
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {error || 'Brand details could not be loaded'}
            </p>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-inherit border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.companyName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {brand.companyName}
                </h1>
                {brand.isVerified && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                      ✓ Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company Info */}
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
              About {brand.companyName}
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {brand.companyName} is a verified brand on Draftboard. {brand.isVerified ? 'This brand has been verified and is trusted by our platform.' : 'Connect with this brand to explore collaboration opportunities.'}
            </p>
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Company Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {brand.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {brand.createdAt && (
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Member Since:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Contact Information
              </h3>
              <div className="space-y-2">
                {brand.email && (
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                    <a 
                      href={`mailto:${brand.email}`}
                      className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                    >
                      {brand.email}
                    </a>
                  </div>
                )}
                {(brand.phoneCountry || brand.phoneNumber) && (
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone:</span>
                    <a 
                      href={`tel:${brand.phoneCountry || ''}${brand.phoneNumber || ''}`}
                      className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                    >
                      {brand.phoneCountry || ''}{brand.phoneNumber || ''}
                    </a>
                  </div>
                )}
                {brand.socialWebsite && (
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Website:</span>
                    <a 
                      href={brand.socialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          {(brand.socialTwitter || brand.socialLinkedIn || brand.socialInstagram) && (
            <div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Social Media
              </h3>
              <div className="flex flex-wrap gap-3">
                {brand.socialTwitter && (
                  <a
                    href={brand.socialTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Twitter</span>
                  </a>
                )}
                {brand.socialLinkedIn && (
                  <a
                    href={brand.socialLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}
                {brand.socialInstagram && (
                  <a
                    href={brand.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.596-3.205-1.529l1.529-1.297c.596.596 1.297.894 2.001.894.894 0 1.595-.596 1.595-1.297 0-.894-.596-1.595-1.595-1.595-.894 0-1.595.596-1.595 1.595H3.205c0-2.001 1.595-3.596 3.596-3.596 2.001 0 3.596 1.595 3.596 3.596 0 2.001-1.595 3.596-3.596 3.596z"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {(brand.addressStreet || brand.addressCity || brand.addressState || brand.addressZip || brand.addressCountry) && (
            <div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                Address
              </h3>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {brand.addressStreet && <p>{brand.addressStreet}</p>}
                {(brand.addressCity || brand.addressState || brand.addressZip) && (
                  <p>
                    {[brand.addressCity, brand.addressState, brand.addressZip].filter(Boolean).join(', ')}
                  </p>
                )}
                {brand.addressCountry && <p>{brand.addressCountry}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandPageView;
