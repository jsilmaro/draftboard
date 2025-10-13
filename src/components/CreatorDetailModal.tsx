import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

interface CreatorData {
  id: string;
  name: string;
  userName: string;
  email: string;
  profileImage?: string | null;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialTikTok?: string;
  socialYouTube?: string;
  isVerified: boolean;
  totalSubmissions: number;
  wins: number;
  totalEarnings: number;
  lastInteraction: string;
  submissions: Array<{
    id: string;
    briefId: string;
    briefTitle: string;
    submittedAt: string;
    status: string;
    isWinner: boolean;
  }>;
}

interface CreatorDetailModalProps {
  creator: CreatorData;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (creatorId: string) => void;
}

const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({
  creator,
  isOpen,
  onClose,
  onMessage
}) => {
  const { isDark } = useTheme();
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'submissions' | 'earnings'>('profile');

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const calculateWinRate = () => {
    const submissions = creator.totalSubmissions || 0;
    const wins = creator.wins || 0;
    if (submissions === 0) return '0';
    return ((wins / submissions) * 100).toFixed(1);
  };

  const calculateAverageEarnings = () => {
    const wins = creator.wins || 0;
    const earnings = creator.totalEarnings || 0;
    if (wins === 0) return '0.00';
    return (earnings / wins).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const getStatusBadge = (status: string, isWinner: boolean) => {
    if (isWinner) {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isDark 
            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Winner
        </span>
      );
    }

    const statusColors = {
      pending: isDark 
        ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
        : 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: isDark
        ? 'bg-green-900/30 text-green-400 border-green-700'
        : 'bg-green-50 text-green-700 border-green-200',
      rejected: isDark
        ? 'bg-red-900/30 text-red-400 border-red-700'
        : 'bg-red-50 text-red-700 border-red-200'
    };

    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusColors[status as keyof typeof statusColors] || statusColors.pending
      }`}>
        {(status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1)}
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Creator Profile
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 md:p-8">
            
            {/* Left Column - Profile Image & Stats */}
            <div className="flex flex-col items-center md:w-1/3">
              {/* Profile Image with Glow Effect */}
              <div className="relative mb-4">
                <div className={`absolute inset-0 rounded-full blur-2xl ${
                  isDark ? 'bg-green-500/20' : 'bg-green-500/10'
                }`}></div>
                {creator.profileImage ? (
                  <img 
                    src={creator.profileImage} 
                    alt={creator.name || 'Creator profile'}
                    className="relative mx-auto w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-green-500 shadow-md"
                  />
                ) : (
                  <div className={`relative mx-auto w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold border-2 border-green-500 shadow-md ${
                    isDark 
                      ? 'bg-gradient-to-br from-green-600 to-green-800 text-white' 
                      : 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                  }`}>
                    {(creator.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-3 text-center">
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {creator.totalSubmissions || 0}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Submissions
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {creator.wins || 0}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Wins
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xl font-bold text-green-600 dark:text-green-400`}>
                    ${(creator.totalEarnings || 0).toFixed(0)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Earned
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {calculateWinRate()}%
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Win Rate
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Creator Info */}
            <div className="md:w-2/3 text-center md:text-left w-full">
              {/* Name & Username */}
              <div className="mb-4">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
                  <h3 className={`text-2xl md:text-3xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {creator.name || 'Unknown Creator'}
                  </h3>
                  {creator.isVerified && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  @{creator.userName || 'unknown'}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                  {creator.email || 'No email provided'}
                </p>
              </div>

              {/* Last Interaction */}
              <div className={`mb-4 p-3 rounded-lg border inline-block ${
                isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last Interaction: <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatTimeAgo(creator.lastInteraction || new Date().toISOString())}
                  </span>
                </p>
              </div>

              {/* Message Button */}
              <button
                onClick={() => onMessage(creator.id)}
                className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Message Creator</span>
              </button>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start space-x-2 mt-4">
              {creator.socialInstagram && (
                <a
                  href={`https://instagram.com/${creator.socialInstagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-pink-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-gray-100'
                  }`}
                  title="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {creator.socialTwitter && (
                <a
                  href={`https://twitter.com/${creator.socialTwitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                  title="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              {creator.socialLinkedIn && (
                <a
                  href={`https://linkedin.com/in/${creator.socialLinkedIn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                  title="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {creator.socialTikTok && (
                <a
                  href={`https://tiktok.com/@${creator.socialTikTok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-pink-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-gray-100'
                  }`}
                  title="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
              {creator.socialYouTube && (
                <a
                  href={`https://youtube.com/${creator.socialYouTube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                  }`}
                  title="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              </div>

              {/* Performance Insights */}
              <div className="mt-4">
                <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Performance
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Win Rate
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {calculateWinRate()}%
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div 
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${calculateWinRate()}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="font-medium">{creator.wins || 0}</span> wins out of <span className="font-medium">{creator.totalSubmissions || 0}</span> submissions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex space-x-1 px-6 pt-4 border-t border-b ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            {(['profile', 'submissions', 'earnings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? isDark
                      ? 'bg-gray-900 text-white border-b-2 border-green-500'
                      : 'bg-white text-gray-900 border-b-2 border-green-500'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {!loading && activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Profile Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Username
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      @{creator.userName || 'unknown'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Email
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {creator.email || 'No email provided'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last Interaction
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatTimeAgo(creator.lastInteraction || new Date().toISOString())}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Avg Earning per Win
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${calculateAverageEarnings()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Performance Insights
                </h3>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Win Rate
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-32 rounded-full ${
                          isDark ? 'bg-gray-800' : 'bg-gray-200'
                        }`}>
                          <div 
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${calculateWinRate()}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {calculateWinRate()}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Total Submissions
                      </span>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {creator.totalSubmissions || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Success Rate
                      </span>
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {creator.wins || 0} / {creator.totalSubmissions || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'submissions' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Submission History ({(creator.submissions || []).length})
              </h3>
              {(creator.submissions || []).length === 0 ? (
                <div className="text-center py-12">
                  <svg className={`w-16 h-16 mx-auto mb-4 ${
                    isDark ? 'text-gray-700' : 'text-gray-300'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(creator.submissions || []).map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-4 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-950 border-gray-800 hover:bg-gray-900' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {submission.briefTitle}
                            </h4>
                            {getStatusBadge(submission.status, submission.isWinner)}
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Submitted {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'earnings' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Earnings Overview
              </h3>
              
              {/* Earnings Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Total Earnings
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${(creator.totalEarnings || 0).toFixed(2)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Average per Win
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${calculateAverageEarnings()}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Total Wins
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {creator.wins || 0}
                  </p>
                </div>
              </div>

              {/* Winning Submissions */}
              <div>
                <h4 className={`text-md font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Winning Submissions ({(creator.submissions || []).filter(s => s.isWinner).length})
                </h4>
                {(creator.submissions || []).filter(s => s.isWinner).length === 0 ? (
                  <div className={`p-8 text-center rounded-lg border ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No winning submissions yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(creator.submissions || [])
                      .filter(s => s.isWinner)
                      .map((submission) => (
                        <div
                          key={submission.id}
                          className={`p-4 rounded-lg border ${
                            isDark 
                              ? 'bg-yellow-900/10 border-yellow-700/30' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className={`font-medium ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {submission.briefTitle}
                              </h5>
                              <p className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Won on {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                            <svg className={`w-8 h-8 ${
                              isDark ? 'text-yellow-400' : 'text-yellow-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDetailModal;

