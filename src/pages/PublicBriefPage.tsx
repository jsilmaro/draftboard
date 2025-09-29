import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

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
    <div className={`min-h-screen py-8 ${
      isDark ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4">
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
  );
};

export default PublicBriefPage;

