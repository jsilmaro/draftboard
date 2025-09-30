import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  amountOfWinners: number;
  deadline: string;
  status: string;
  isFunded: boolean;
  totalRewardValue: number;
  rewardTiers: Array<{
    position: number;
    amount: number;
    cashAmount: number;
    creditAmount: number;
  }>;
  brand: {
    id: string;
    companyName: string;
    logo?: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
    socialWebsite?: string;
  };
  submissions: Array<{
    id: string;
    creator: {
      userName: string;
    };
  }>;
}

const PublicBriefPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const response = await fetch(`/api/briefs/public/${id}`);
        if (!response.ok) {
          throw new Error('Brief not found');
        }
        const data = await response.json();
        setBrief(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBrief();
    }
  }, [id]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading brief...
          </p>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Brief Not Found
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            The brief you&apos;re looking for doesn&apos;t exist or is no longer available.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const submissionsCount = brief.submissions?.length || 0;
  const submissionsProgress = Math.min((submissionsCount / brief.amountOfWinners) * 100, 100);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <div className={`${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r w-64 min-h-screen fixed left-0 top-0 z-40 flex flex-col overflow-y-auto transition-all duration-300 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brief Details</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>View brief information</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/creator/dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/brand/dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">Brand Dashboard</span>
          </button>
        </div>

        {/* Account Navigation */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-30`}>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brief Details</h1>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle size="md" />
                <button
                  onClick={() => navigate(-1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
        <div className="h-auto w-full">
          <div className={`h-auto w-full rounded-2xl p-8 ${
            isDark ? 'bg-neutral-900 text-white' : 'bg-white text-gray-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {brief.brand.logo && (
                  <img 
                    src={brief.brand.logo} 
                    alt={brief.brand.companyName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{brief.title}</h1>
                  <p className="text-gray-500">by {brief.brand.companyName}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Deadline</div>
                <div className="font-semibold">
                  {new Date(brief.deadline).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Funding Status - Prominent for Creators */}
            {brief.isFunded && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                      ✓ Fully Funded & Verified
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      This brief is backed by real funding and ready for submissions. Your payment is guaranteed upon winning.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{brief.description}</p>
            </div>

            {/* Requirements */}
            {brief.requirements && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Requirements</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {brief.requirements}
                </div>
              </div>
            )}

            {/* Reward Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Reward Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Reward Pool</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${brief.totalRewardValue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Number of Winners</div>
                  <div className="text-2xl font-bold">
                    {brief.amountOfWinners}
                  </div>
                </div>
              </div>
              
              {brief.rewardTiers && brief.rewardTiers.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Reward Breakdown</h3>
                  <div className="space-y-2">
                    {brief.rewardTiers.map((tier) => (
                      <div key={tier.position} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium">Reward {tier.position}</span>
                        <span className="font-bold text-green-600">
                          ${((tier.cashAmount || 0) + (tier.creditAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Current Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Applications</span>
                    <span className="font-medium">
                      {submissionsCount}/{brief.amountOfWinners}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${submissionsProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                onClick={() => navigate('/creator/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Apply to This Brief
              </button>
              <p className="text-sm text-gray-500 mt-2">
                You need to be logged in as a creator to apply
              </p>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBriefPage;

