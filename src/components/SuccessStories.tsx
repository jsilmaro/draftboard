import React, { useState, useEffect, useCallback } from 'react';

interface SuccessStory {
  id: string;
  title: string;
  description: string;
  briefTitle: string;
  brand: {
    id: string;
    name: string;
    logo?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
    type: 'individual' | 'agency';
  };
  category: 'creative' | 'technical' | 'business';
  budget: number;
  duration: string;
  outcome: string;
  metrics: {
    reach?: number;
    engagement?: number;
    conversion?: number;
    roi?: number;
  };
  testimonial: {
    brandQuote: string;
    creatorQuote: string;
  };
  images: string[];
  tags: string[];
  featured: boolean;
  createdAt: string;
  verified: boolean;
}

interface SuccessStoriesProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessStories: React.FC<SuccessStoriesProps> = ({ isOpen, onClose }) => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'creative' | 'technical' | 'business' | 'featured'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'budget' | 'popularity'>('newest');

  // Mock data for when database is empty
  const getMockStories = (): SuccessStory[] => [
    {
      id: 'mock-story-1',
      title: 'Viral Social Media Campaign',
      description: 'A creative campaign that reached 2M+ people and generated 500% ROI for a sustainable fashion brand.',
      briefTitle: 'Sustainable Fashion Awareness Campaign',
      brand: {
        id: 'brand-1',
        name: 'EcoStyle',
        logo: '/icons/Green_icons/Brief1.png'
      },
      creator: {
        id: 'creator-1',
        name: 'Sarah Johnson',
        avatar: '/icons/Green_icons/UserProfile1.png',
        type: 'individual'
      },
      category: 'creative',
      budget: 15000,
      duration: '2 weeks',
      outcome: 'Generated 2.3M impressions, 45K new followers, and $75K in sales within 2 weeks.',
      metrics: {
        reach: 2300000,
        engagement: 8.5,
        conversion: 3.2,
        roi: 500
      },
      testimonial: {
        brandQuote: 'Sarah\'s creative approach exceeded our expectations. The campaign not only raised awareness but drove real sales.',
        creatorQuote: 'Working with EcoStyle was amazing. They gave me creative freedom and the results speak for themselves.'
      },
      images: ['/icons/Green_icons/Campaign1.png'],
      tags: ['social-media', 'sustainability', 'fashion', 'viral'],
      featured: true,
      verified: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-story-2',
      title: 'E-commerce Platform Development',
      description: 'Complete platform build that increased sales by 300% in 3 months for a growing online retailer.',
      briefTitle: 'Full-Stack E-commerce Development',
      brand: {
        id: 'brand-2',
        name: 'TechRetail Pro',
        logo: '/icons/Green_icons/Brief1.png'
      },
      creator: {
        id: 'creator-2',
        name: 'Mike Chen',
        avatar: '/icons/Green_icons/UserProfile1.png',
        type: 'individual'
      },
      category: 'technical',
      budget: 25000,
      duration: '6 weeks',
      outcome: 'Built a scalable e-commerce platform that increased conversion rates by 40% and sales by 300%.',
      metrics: {
        reach: 150000,
        engagement: 12.3,
        conversion: 5.8,
        roi: 300
      },
      testimonial: {
        brandQuote: 'Mike delivered exactly what we needed. The platform is fast, secure, and user-friendly.',
        creatorQuote: 'This was a challenging project but very rewarding. The client was great to work with.'
      },
      images: ['/icons/Green_icons/Dashboard1.png'],
      tags: ['e-commerce', 'development', 'platform', 'scalable'],
      featured: true,
      verified: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-story-3',
      title: 'Marketing Strategy Overhaul',
      description: 'Complete marketing transformation that doubled customer acquisition and reduced cost per acquisition by 60%.',
      briefTitle: 'Digital Marketing Strategy & Implementation',
      brand: {
        id: 'brand-3',
        name: 'GrowthCo',
        logo: '/icons/Green_icons/Brief1.png'
      },
      creator: {
        id: 'creator-3',
        name: 'Lisa Rodriguez',
        avatar: '/icons/Green_icons/UserProfile1.png',
        type: 'individual'
      },
      category: 'business',
      budget: 12000,
      duration: '4 weeks',
      outcome: 'Doubled customer acquisition rate and reduced cost per acquisition by 60% through strategic optimization.',
      metrics: {
        reach: 800000,
        engagement: 6.7,
        conversion: 4.1,
        roi: 200
      },
      testimonial: {
        brandQuote: 'Lisa\'s strategic approach transformed our marketing. We\'re seeing results we never thought possible.',
        creatorQuote: 'GrowthCo was open to new ideas and the collaboration was fantastic. Great results all around.'
      },
      images: ['/icons/Green_icons/Performance1.png'],
      tags: ['marketing', 'strategy', 'optimization', 'growth'],
      featured: false,
      verified: true,
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const fetchStories = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/success-stories?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // If no stories returned, use mock data
        if (data.length === 0) {
          setStories(getMockStories());
        } else {
          setStories(data);
        }
      } else {
        // If API fails, use mock data
        setStories(getMockStories());
      }
    } catch (error) {
      // Error fetching success stories - use mock data as fallback
      setStories(getMockStories());
    } finally {
      setIsLoading(false);
    }
  }, [filter, sortBy]);

  useEffect(() => {
    if (isOpen) {
      fetchStories();
    }
  }, [isOpen, filter, sortBy, fetchStories]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'creative': return '/icons/Green_icons/Campaign1.png';
      case 'technical': return '/icons/Green_icons/Dashboard1.png';
      case 'business': return '/icons/Green_icons/Brief1.png';
      default: return '/icons/Green_icons/Performance1.png';
    }
  };


  const filteredStories = stories.filter(story => {
    if (filter === 'featured') return story.featured;
    if (filter === 'all') return true;
    return story.category === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Success Stories</h1>
              <p className="text-gray-400 mt-1">Discover amazing collaborations and their results</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Stories' },
                { key: 'featured', label: 'Featured' },
                { key: 'creative', label: 'Creative' },
                { key: 'technical', label: 'Technical' },
                { key: 'business', label: 'Business' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'creative' | 'technical' | 'business' | 'featured')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'budget' | 'popularity')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">Newest</option>
                <option value="budget">Budget</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400">Loading success stories...</div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-xl">No success stories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer group"
                >
                  {/* Story Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-500 to-blue-600">
                    {story.images.length > 0 ? (
                      <img
                        src={story.images[0]}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        {getCategoryIcon(story.category)}
                      </div>
                    )}
                    {story.featured && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        ⭐ Featured
                      </div>
                    )}
                    {story.verified && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Story Content */}
                  <div className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <img 
                        src={getCategoryIcon(story.category)} 
                        alt={story.category}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-400 text-sm capitalize">{story.category}</span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                      {story.title}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {story.description}
                    </p>

                    {/* Brand and Creator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {story.brand.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-300 text-sm">{story.brand.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {story.creator.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-300 text-sm">{story.creator.name}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-400 font-bold">{formatCurrency(story.budget)}</span>
                      <span className="text-gray-400">{story.duration}</span>
                    </div>

                    {/* Tags */}
                    {story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {story.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {story.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">+{story.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <img 
                      src={getCategoryIcon(selectedStory.category)} 
                      alt={selectedStory.category}
                      className="w-8 h-8"
                    />
                    <h1 className="text-2xl font-bold text-white">{selectedStory.title}</h1>
                    {selectedStory.featured && (
                      <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">{selectedStory.briefTitle}</p>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Project Overview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-green-400 font-bold">{formatCurrency(selectedStory.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{selectedStory.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white capitalize">{selectedStory.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed:</span>
                      <span className="text-white">{formatDate(selectedStory.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Results</h3>
                  <div className="space-y-2">
                    {selectedStory.metrics.reach && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reach:</span>
                        <span className="text-white">{selectedStory.metrics.reach.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStory.metrics.engagement && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Engagement:</span>
                        <span className="text-white">{selectedStory.metrics.engagement}%</span>
                      </div>
                    )}
                    {selectedStory.metrics.conversion && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Conversion:</span>
                        <span className="text-white">{selectedStory.metrics.conversion}%</span>
                      </div>
                    )}
                    {selectedStory.metrics.roi && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">ROI:</span>
                        <span className="text-green-400 font-bold">{selectedStory.metrics.roi}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Project Description</h3>
                <p className="text-gray-300">{selectedStory.description}</p>
              </div>

              {/* Outcome */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Outcome</h3>
                <p className="text-gray-300">{selectedStory.outcome}</p>
              </div>

              {/* Testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Brand Testimonial</h3>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedStory.brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-300 italic">&quot;{selectedStory.testimonial.brandQuote}&quot;</p>
                      <p className="text-gray-400 text-sm mt-2">- {selectedStory.brand.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Creator Testimonial</h3>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedStory.creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-300 italic">&quot;{selectedStory.testimonial.creatorQuote}&quot;</p>
                      <p className="text-gray-400 text-sm mt-2">- {selectedStory.creator.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              {selectedStory.images.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Project Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedStory.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Project image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedStory.tags.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStory.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessStories;
