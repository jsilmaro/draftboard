import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import MarketplaceNav from './MarketplaceNav';

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  deadline: string;
  status: string;
  createdAt: string;
  additionalFields?: string;
  location?: string;
  amountOfWinners: number;
  brand: {
    id: string;
    companyName: string;
    contactName: string;
    logo?: string;
    socialWebsite?: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
  };
  submissions: Array<{
    id: string;
    status: string;
    submittedAt: string;
  }>;
  winners: Array<{
    id: string;
    position: number;
    selectedAt?: string;
  }>;
}

const PublicBriefDetails = () => {
  const { briefId } = useParams<{ briefId: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBriefDetails = useCallback(async () => {
    if (!briefId) {
      setError('Brief ID is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/briefs/${briefId}/public`);
      if (response.ok) {
        const data = await response.json();
        setBrief(data);
      } else {
        setError('Brief not found');
      }
    } catch (error) {
      setError('Failed to load brief details');
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    if (briefId && briefId.trim() !== '') {
      fetchBriefDetails();
    } else {
      setError('Invalid brief ID');
      setLoading(false);
    }
  }, [briefId, fetchBriefDetails]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const hasMeaningfulAdditionalFields = (additionalFields: string | undefined): boolean => {
    if (!additionalFields || additionalFields.trim() === '') {
      return false;
    }
    
    // Check if it's an empty JSON object
    if (additionalFields === '{}' || additionalFields === 'null') {
      return false;
    }
    
    // Try to parse as JSON and check if it has meaningful content
    try {
      const parsed = JSON.parse(additionalFields);
      if (typeof parsed === 'object' && parsed !== null) {
        // Check if the object has any non-empty values
        return Object.values(parsed).some(value => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== '' && value !== null && value !== undefined;
        });
      }
    } catch {
      // If it's not valid JSON, check if it has meaningful text content
      return additionalFields.trim().length > 0;
    }
    
    return false;
  };

  const handleApplyClick = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login', { state: { returnUrl: `/brief/${briefId}` } });
    } else if (user.type !== 'creator') {
      // Show message that only creators can apply
      alert('Only creators can apply to briefs. Please log in with a creator account.');
    } else {
      // Navigate to application form
      navigate(`/brief/${briefId}/apply`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Brief Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/marketplace"
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(brief.deadline);
  const isExpired = daysRemaining < 0;
  const canApply = !isExpired && brief.status === 'published';

  return (
    <div className="min-h-screen bg-black text-white">
      <MarketplaceNav />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/marketplace"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Marketplace
            </Link>
            <div className="flex space-x-4">
              {!user ? (
                <>
                  <Link
                    to="/creator/register"
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Join as Creator
                  </Link>
                  <Link
                    to="/login"
                    className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/creator/dashboard"
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                >
                  My Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brief Header */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                {brief.brand.logo ? (
                  <img
                    src={brief.brand.logo}
                    alt={brief.brand.companyName}
                    className="w-12 h-12 rounded"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {brief.brand.companyName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{brief.title}</h1>
                <p className="text-gray-400">by {brief.brand.companyName}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {formatCurrency(brief.reward)}
              </div>
              <div className="text-sm text-gray-400">
                {brief.amountOfWinners} winner{brief.amountOfWinners > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Status and Deadline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                brief.status === 'published' ? 'bg-green-100 text-green-800' :
                brief.status === 'active' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
              </span>
              <span className="text-gray-400">
                Posted {formatDate(brief.createdAt)}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                {isExpired ? 'Expired' : `${daysRemaining} days left`}
              </div>
              <div className="text-sm text-gray-400">
                Deadline: {formatDate(brief.deadline)}
              </div>
            </div>
          </div>
        </div>

                 {/* Main Content */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column - Brief Details */}
           <div className="lg:col-span-2 space-y-8 overflow-hidden">
                         {/* Description */}
             <div className="bg-gray-900 rounded-lg p-6 w-full">
               <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
               <div className="text-gray-300 leading-relaxed break-words overflow-hidden">
                 <div className="whitespace-pre-wrap max-w-full text-wrap">
                   {brief.description}
                 </div>
               </div>
             </div>

                         {/* Requirements */}
             <div className="bg-gray-900 rounded-lg p-6 w-full">
               <h2 className="text-xl font-semibold text-white mb-4">Requirements</h2>
                                <div className="text-gray-300 leading-relaxed break-words overflow-hidden">
                   <div className="whitespace-pre-wrap max-w-full text-wrap">
                     {brief.requirements}
                   </div>
                 </div>
             </div>

                                      {/* Additional Fields */}
                           {hasMeaningfulAdditionalFields(brief.additionalFields) && (
                <div className="bg-gray-900 rounded-lg p-6 w-full">
                  <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
                  <div className="text-gray-300 leading-relaxed break-words overflow-hidden">
                    <div className="whitespace-pre-wrap max-w-full text-wrap">
                      {(() => {
                        try {
                          const parsed = JSON.parse(brief.additionalFields || '{}');
                          if (typeof parsed === 'object' && parsed !== null) {
                            return (
                              <div className="space-y-3">
                                {Object.entries(parsed).map(([key, value]) => {
                                  if (value === '' || value === null || value === undefined) return null;
                                  
                                  const formattedKey = key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                    .replace(/([a-z])([A-Z])/g, '$1 $2');
                                  
                                  if (Array.isArray(value)) {
                                    return (
                                      <div key={key} className="mb-3">
                                        <h4 className="font-medium text-white mb-2">{formattedKey}:</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {value.map((item, index) => (
                                            <span 
                                              key={index}
                                              className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div key={key} className="mb-3">
                                      <h4 className="font-medium text-white mb-1">{formattedKey}:</h4>
                                      <p className="text-gray-300">{String(value)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return brief.additionalFields;
                        } catch {
                          return brief.additionalFields;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

                         {/* Stats */}
             <div className="bg-gray-900 rounded-lg p-6 w-full">
              <h2 className="text-xl font-semibold text-white mb-4">Brief Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {brief.submissions.length}
                  </div>
                  <div className="text-gray-400">Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {brief.winners.length}
                  </div>
                  <div className="text-gray-400">Winners Selected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Apply Button */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ready to Apply?</h3>
              {canApply ? (
                <button
                  onClick={handleApplyClick}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 mb-4"
                >
                  {user ? 'Apply Now' : 'Sign Up to Apply'}
                </button>
              ) : (
                <div className="text-center py-4">
                  <div className="text-red-400 font-medium mb-2">
                    {isExpired ? 'Applications Closed' : 'Applications Not Open'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {isExpired ? 'This brief has expired' : 'This brief is not accepting applications'}
                  </div>
                </div>
              )}
              
              {!user && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    Already have an account?
                  </p>
                  <Link
                    to="/login"
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    Sign in to apply
                  </Link>
                </div>
              )}
            </div>

            {/* Brand Info */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">About {brief.brand.companyName}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Contact:</span>
                  <div className="text-white">{brief.brand.contactName}</div>
                </div>
                
                {/* Social Links */}
                {(brief.brand.socialWebsite || brief.brand.socialInstagram || brief.brand.socialTwitter || brief.brand.socialLinkedIn) && (
                  <div>
                    <span className="text-gray-400">Follow:</span>
                    <div className="flex space-x-3 mt-2">
                      {brief.brand.socialWebsite && (
                        <a
                          href={brief.brand.socialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Website
                        </a>
                      )}
                      {brief.brand.socialInstagram && (
                        <a
                          href={`https://instagram.com/${brief.brand.socialInstagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          Instagram
                        </a>
                      )}
                      {brief.brand.socialTwitter && (
                        <a
                          href={`https://twitter.com/${brief.brand.socialTwitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Twitter
                        </a>
                      )}
                      {brief.brand.socialLinkedIn && (
                        <a
                          href={`https://linkedin.com/company/${brief.brand.socialLinkedIn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {brief.location && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                <div className="text-gray-300">
                  {brief.location}
                </div>
              </div>
            )}

            {/* More from this brand */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">More from {brief.brand.companyName}</h3>
              <Link
                to={`/brand/${brief.brand.id}/briefs`}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                View all briefs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBriefDetails;
