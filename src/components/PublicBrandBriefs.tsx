import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

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
      return 'text-red-400';
    } else if (diffDays <= 3) {
      return 'text-orange-400';
    } else {
      return 'text-emerald-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
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
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300 mb-6">{error}</p>
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
      <div className="min-h-screen bg-black text-white">
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
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      {/* Sophisticated Background with Glass-morphism */}
      <div className="absolute inset-0">
        {/* Primary dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        {/* Subtle neon blue lighting effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${window.innerWidth / 2}px ${window.innerHeight / 2}px, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`
          }}
        ></div>
      </div>

                    {/* Header with Glass-morphism */}
        <header className="relative z-10 bg-gray-900/20 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                                 <Link to="/" className="group">
                                                                      <img 
                       src="/logo-light2.svg" 
                       className="w-28 h-14 group-hover:scale-110 transition-transform duration-300"
                     />
                 </Link>
              </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login"
                className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                Log In
              </Link>
              <Link 
                to="/creator/register"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Join DraftBoard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Brand Info Card with Glass-morphism */}
        <div className="bg-gray-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 mb-8 hover:shadow-3xl transition-all duration-500">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              {data.brand.logo ? (
                <img 
                  src={data.brand.logo} 
                  alt={`${data.brand.companyName} logo`}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {data.brand.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{data.brand.companyName}</h1>
              <div className="flex items-center space-x-4">
                <span className="px-4 py-2 bg-emerald-900/30 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/30">
                  Active Briefs: {data.briefs.length}
                </span>
              </div>
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
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  🌐 Website
                </a>
              )}
              {data.brand.socialInstagram && (
                <a 
                  href={`https://instagram.com/${data.brand.socialInstagram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  📷 Instagram
                </a>
              )}
              {data.brand.socialTwitter && (
                <a 
                  href={`https://twitter.com/${data.brand.socialTwitter}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  🐦 Twitter
                </a>
              )}
              {data.brand.socialLinkedIn && (
                <a 
                  href={`https://linkedin.com/company/${data.brand.socialLinkedIn}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  💼 LinkedIn
                </a>
              )}
            </div>
          )}
        </div>

        {/* Briefs Grid */}
        {data.briefs.length === 0 ? (
          <div className="bg-gray-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-12 text-center hover:shadow-3xl transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-4 text-white">No Active Briefs</h2>
            <p className="text-gray-400 mb-8 text-lg">
              This brand doesn&apos;t have any active briefs at the moment.
            </p>
            <Link 
              to="/creator/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-medium"
            >
              Join DraftBoard to Create Briefs
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {data.briefs.map((brief) => (
              <div 
                key={brief.id} 
                className="bg-gray-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 hover:shadow-3xl hover:border-white/20 transition-all duration-500 transform hover:-translate-y-2 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold line-clamp-2 text-white group-hover:text-blue-300 transition-colors duration-300">{brief.title}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    brief.status === 'published' 
                      ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                  }`}>
                    {brief.status}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {brief.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Reward:</span>
                    <span className="font-bold text-emerald-400 text-lg">
                      ${brief.totalRewardValue > 0 ? brief.totalRewardValue : brief.reward}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Winners:</span>
                    <span className="font-semibold text-white">{brief.amountOfWinners}</span>
                  </div>
                  
                  {brief.amountOfWinners > 1 && brief.rewardTiers && brief.rewardTiers.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2">Reward Distribution:</div>
                      <div className="space-y-1">
                        {brief.rewardTiers.slice(0, 3).map((tier) => (
                          <div key={tier.position} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">
                              {tier.position === 1 ? '🥇' : tier.position === 2 ? '🥈' : '🥉'}
                            </span>
                            <span className="text-white">
                              ${(tier.cashAmount + tier.creditAmount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {brief.amountOfWinners > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{brief.amountOfWinners - 3} more tiers
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Submissions:</span>
                    <span className="font-semibold text-white">{brief.submissionsCount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Deadline:</span>
                    <span className={`font-semibold ${getDeadlineColor(brief.deadline)}`}>
                      {formatDeadline(brief.deadline)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link 
                    to="/creator/register"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                  >
                    Apply Now
                  </Link>
                  <button 
                    className="px-4 py-3 border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 rounded-xl text-sm transition-all duration-300 backdrop-blur-sm"
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
        <div className="bg-gray-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-12 mt-12 text-center hover:shadow-3xl transition-all duration-500">
          <h2 className="text-3xl font-bold mb-6 text-white">Want to Create Your Own Briefs?</h2>
          <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
            Join DraftBoard as a brand to create engaging briefs and connect with talented creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/brand/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-medium"
            >
              Register as Brand
            </Link>
            <Link 
              to="/creator/register"
              className="px-8 py-4 border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm text-lg font-medium"
            >
              Register as Creator
            </Link>
          </div>
        </div>
      </div>

      {/* Brief Details Modal */}
      {showModal && selectedBrief && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-white">{selectedBrief.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-3 rounded-xl transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-200">
                    Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedBrief.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-200">
                    Requirements
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedBrief.requirements}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 text-sm">Reward:</span>
                    <p className="font-bold text-emerald-400 text-xl">
                      ${selectedBrief.totalRewardValue > 0 ? selectedBrief.totalRewardValue : selectedBrief.reward}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 text-sm">Winners:</span>
                    <p className="font-bold text-white text-xl">{selectedBrief.amountOfWinners}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 text-sm">Submissions:</span>
                    <p className="font-bold text-white text-xl">{selectedBrief.submissionsCount}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 text-sm">Deadline:</span>
                    <p className={`font-bold ${getDeadlineColor(selectedBrief.deadline)} text-xl`}>
                      {formatDeadline(selectedBrief.deadline)}
                    </p>
                  </div>
                </div>

                {selectedBrief.rewardTiers && selectedBrief.rewardTiers.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">
                      🏆 Reward Tiers
                    </h3>
                    <div className="space-y-3">
                      {selectedBrief.rewardTiers.map((tier, index) => (
                        <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{tier.name}</span>
                            <span className="text-emerald-400 font-bold text-lg">
                              ${tier.cashAmount + tier.creditAmount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-6">
                  <Link 
                    to="/creator/register"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                  >
                    Apply Now
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-4 border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm font-medium"
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
