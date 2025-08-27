import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Brand {
  id: string;
  companyName: string;
  logo?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialWebsite?: string;
}

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  amountOfWinners: number;
  deadline: string;
  status: string;
  totalRewardValue: number;
  rewardTiers: Array<{
    position: number;
    name: string;
    cashAmount: number;
    creditAmount: number;
  }>;
  submissionsCount: number;
  createdAt: string;
}

interface PublicBrandData {
  brand: Brand;
  briefs: Brief[];
}

const PublicBrandBriefs: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const { theme } = useTheme();
  const [data, setData] = useState<PublicBrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchBrandBriefs = async () => {
      if (!brandId) {
        setError('Brand ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/brands/${brandId}/briefs`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Brand not found');
          } else {
            setError('Failed to load brand briefs');
          }
          setLoading(false);
          return;
        }

        const brandData = await response.json();
        setData(brandData);
      } catch (err) {
        setError('Failed to load brand briefs');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandBriefs();
  }, [brandId]);



  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Deadline passed';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const getDeadlineColor = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'text-red-500';
    } else if (diffDays <= 3) {
      return 'text-orange-500';
    } else {
      return 'text-green-500';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-white'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-white'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300 dark:text-gray-400 mb-6">{error}</p>
            <Link 
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-white'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Data Found</h1>
            <Link 
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-white'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-700'} border-b`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                DraftBoard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login"
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-600 text-gray-300 hover:bg-gray-50'
                } transition-colors`}
              >
                Log In
              </Link>
              <Link 
                to="/creator/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join DraftBoard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Brand Info */}
      <div className="container mx-auto px-4 py-8">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-8`}>
          <div className="flex items-center space-x-4 mb-4">
            {data.brand.logo && (
              <img 
                src={data.brand.logo} 
                alt={`${data.brand.companyName} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{data.brand.companyName}</h1>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-300'}`}>
                Active Briefs: {data.briefs.length}
              </p>
            </div>
          </div>

          {/* Social Links */}
          {(data.brand.socialInstagram || data.brand.socialTwitter || data.brand.socialLinkedIn || data.brand.socialWebsite) && (
            <div className="flex items-center space-x-4">
              {data.brand.socialWebsite && (
                <a 
                  href={data.brand.socialWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'} transition-colors`}
                >
                  🌐 Website
                </a>
              )}
              {data.brand.socialInstagram && (
                <a 
                  href={`https://instagram.com/${data.brand.socialInstagram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'} transition-colors`}
                >
                  📷 Instagram
                </a>
              )}
              {data.brand.socialTwitter && (
                <a 
                  href={`https://twitter.com/${data.brand.socialTwitter}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'} transition-colors`}
                >
                  🐦 Twitter
                </a>
              )}
              {data.brand.socialLinkedIn && (
                <a 
                  href={`https://linkedin.com/company/${data.brand.socialLinkedIn}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'} transition-colors`}
                >
                  💼 LinkedIn
                </a>
              )}
            </div>
          )}
        </div>

        {/* Briefs */}
        {data.briefs.length === 0 ? (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center`}>
            <h2 className="text-xl font-semibold mb-2">No Active Briefs</h2>
                          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-300'} mb-6`}>
                This brand doesn&apos;t have any active briefs at the moment.
              </p>
            <Link 
              to="/creator/register"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join DraftBoard to Create Briefs
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.briefs.map((brief) => (
              <div 
                key={brief.id} 
                className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-700'} rounded-lg shadow-lg border p-6 hover:shadow-xl transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{brief.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    brief.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {brief.status}
                  </span>
                </div>

                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-300'} text-sm mb-4 line-clamp-3`}>
                  {brief.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Reward:</span>
                    <span className="font-semibold text-green-600">
                      ${brief.totalRewardValue > 0 ? brief.totalRewardValue : brief.reward}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Winners:</span>
                    <span className="font-semibold">{brief.amountOfWinners}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Submissions:</span>
                    <span className="font-semibold">{brief.submissionsCount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Deadline:</span>
                    <span className={`font-semibold ${getDeadlineColor(brief.deadline)}`}>
                      {formatDeadline(brief.deadline)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link 
                    to="/creator/register"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Apply Now
                  </Link>
                  <button 
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedBrief(brief);
                      setShowModal(true);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 mt-8 text-center`}>
          <h2 className="text-2xl font-bold mb-4">Want to Create Your Own Briefs?</h2>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-300'} mb-6`}>
            Join DraftBoard as a brand to create engaging briefs and connect with talented creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register as Brand
            </Link>
            <Link 
              to="/creator/register"
              className={`px-6 py-3 border rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-50'
              }`}
            >
              Register as Creator
            </Link>
          </div>
        </div>
      </div>

      {/* Brief Details Modal */}
      {showModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedBrief.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Description
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-300'}`}>
                    {selectedBrief.description}
                  </p>
                </div>

                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Requirements
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-300'}`}>
                    {selectedBrief.requirements}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Reward:</span>
                    <p className="font-semibold text-green-600">
                      ${selectedBrief.totalRewardValue > 0 ? selectedBrief.totalRewardValue : selectedBrief.reward}
                    </p>
                  </div>
                  <div>
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Winners:</span>
                    <p className="font-semibold">{selectedBrief.amountOfWinners}</p>
                  </div>
                  <div>
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Submissions:</span>
                    <p className="font-semibold">{selectedBrief.submissionsCount}</p>
                  </div>
                  <div>
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Deadline:</span>
                    <p className={`font-semibold ${getDeadlineColor(selectedBrief.deadline)}`}>
                      {formatDeadline(selectedBrief.deadline)}
                    </p>
                  </div>
                </div>

                {selectedBrief.rewardTiers && selectedBrief.rewardTiers.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Reward Tiers
                    </h3>
                    <div className="space-y-2">
                      {selectedBrief.rewardTiers.map((tier, index) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{tier.name}</span>
                            <span className="text-green-600 font-semibold">
                              ${tier.cashAmount + tier.creditAmount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Link 
                    to="/creator/register"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBrandBriefs;
