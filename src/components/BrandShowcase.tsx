import React, { useState, useEffect, useCallback } from 'react';

interface Brand {
  id: string;
  companyName: string;
  email: string;
  description?: string;
  website?: string;
  logo?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  foundedYear?: number;
  verified: boolean;
  rating: number;
  totalProjects: number;
  totalSpent: number;
  averageResponseTime: string;
  memberSince: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'completed' | 'active' | 'draft';
  completedAt?: string;
  briefsCount: number;
  submissionsCount: number;
  winnersCount: number;
  thumbnail?: string;
  category: string;
}

interface Testimonial {
  id: string;
  creatorName: string;
  creatorAvatar?: string;
  briefTitle: string;
  rating: number;
  comment: string;
  completedAt: string;
}

interface BrandShowcaseProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
}

const BrandShowcase: React.FC<BrandShowcaseProps> = ({ brandId, isOpen, onClose }) => {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'testimonials'>('overview');

  useEffect(() => {
    if (isOpen && brandId) {
      fetchBrandData();
    }
  }, [isOpen, brandId, fetchBrandData]);

  const fetchBrandData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [brandResponse, campaignsResponse, testimonialsResponse] = await Promise.all([
        fetch(`/api/brands/${brandId}/showcase`),
        fetch(`/api/brands/${brandId}/campaigns`),
        fetch(`/api/brands/${brandId}/testimonials`)
      ]);

      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        setBrand(brandData);
      }

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

      if (testimonialsResponse.ok) {
        const testimonialsData = await testimonialsResponse.json();
        setTestimonials(testimonialsData);
      }
    } catch (error) {
      // Error fetching brand data - could implement proper error handling here
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
      >
        ★
      </span>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {brand?.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.companyName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {brand?.companyName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">{brand?.companyName}</h1>
                  {brand?.verified && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    {renderStars(brand?.rating || 0)}
                    <span className="text-gray-400 text-sm ml-1">
                      ({brand?.totalProjects || 0} projects)
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    Member since {formatDate(brand?.memberSince || '')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'campaigns', label: 'Campaigns' },
              { key: 'testimonials', label: 'Testimonials' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'overview' | 'campaigns' | 'testimonials')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400">Loading brand information...</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
                      <div className="space-y-3">
                        {brand?.description && (
                          <div>
                            <span className="text-gray-400 text-sm">Description:</span>
                            <p className="text-white mt-1">{brand.description}</p>
                          </div>
                        )}
                        {brand?.industry && (
                          <div>
                            <span className="text-gray-400 text-sm">Industry:</span>
                            <p className="text-white mt-1">{brand.industry}</p>
                          </div>
                        )}
                        {brand?.companySize && (
                          <div>
                            <span className="text-gray-400 text-sm">Company Size:</span>
                            <p className="text-white mt-1">{brand.companySize}</p>
                          </div>
                        )}
                        {brand?.location && (
                          <div>
                            <span className="text-gray-400 text-sm">Location:</span>
                            <p className="text-white mt-1">{brand.location}</p>
                          </div>
                        )}
                        {brand?.foundedYear && (
                          <div>
                            <span className="text-gray-400 text-sm">Founded:</span>
                            <p className="text-white mt-1">{brand.foundedYear}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Projects:</span>
                          <span className="text-white font-medium">{brand?.totalProjects || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Spent:</span>
                          <span className="text-white font-medium">{formatCurrency(brand?.totalSpent || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average Response Time:</span>
                          <span className="text-white font-medium">{brand?.averageResponseTime || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rating:</span>
                          <div className="flex items-center space-x-1">
                            {renderStars(brand?.rating || 0)}
                            <span className="text-white ml-1">({brand?.rating || 0}/5)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(brand?.website || brand?.socialInstagram || brand?.socialTwitter || brand?.socialLinkedIn) && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                      <div className="flex flex-wrap gap-4">
                        {brand?.website && (
                          <a
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <span>🌐</span>
                            <span>Website</span>
                          </a>
                        )}
                        {brand?.socialInstagram && (
                          <a
                            href={brand.socialInstagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-pink-400 hover:text-pink-300"
                          >
                            <span>📷</span>
                            <span>Instagram</span>
                          </a>
                        )}
                        {brand?.socialTwitter && (
                          <a
                            href={brand.socialTwitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <span>🐦</span>
                            <span>Twitter</span>
                          </a>
                        )}
                        {brand?.socialLinkedIn && (
                          <a
                            href={brand.socialLinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-500"
                          >
                            <span>💼</span>
                            <span>LinkedIn</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h3>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-4">📊</div>
                      <p>No campaigns available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">{campaign.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              campaign.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                              campaign.status === 'active' ? 'bg-blue-900/20 text-blue-400' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-400 font-medium">{formatCurrency(campaign.budget)}</span>
                            <span className="text-gray-400">
                              {campaign.briefsCount} briefs • {campaign.submissionsCount} submissions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'testimonials' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Creator Testimonials</h3>
                  {testimonials.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-4">💬</div>
                      <p>No testimonials available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {testimonial.creatorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="text-white font-medium">{testimonial.creatorName}</h4>
                                  <p className="text-gray-400 text-sm">{testimonial.briefTitle}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {renderStars(testimonial.rating)}
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm">{testimonial.comment}</p>
                              <p className="text-gray-500 text-xs mt-2">
                                Completed on {formatDate(testimonial.completedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandShowcase;
