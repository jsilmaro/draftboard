import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface BriefTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: {
    title: string;
    description: string;
    requirements: string;
    reward: number;
    deadline: string;
    additionalFields: Record<string, string | string[]>;
  };
}

interface RewardTier {
  position: number;
  cashAmount: number;
  creditAmount: number;
  prizeDescription: string;
}

interface FormData {
  title: string;
  description: string;
  requirements: string;
  reward: number;
  deadline: string;
  amountOfWinners: number;
  location: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  rewardTiers: RewardTier[];
  additionalFields: Record<string, string | string[]>;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  province?: string;
  country?: string;
}

interface NominatimSearchResult {
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    province?: string;
    road?: string;
    street?: string;
  };
}

const CreateBrief: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    requirements: '',
    reward: 0,
    deadline: '',
    amountOfWinners: 1,
    location: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    rewardTiers: [],
    additionalFields: {} as Record<string, string | string[]>
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);

  const templates: BriefTemplate[] = [
    {
      id: 'podcast-live',
      name: 'Podcast & Live Events',
      description: 'Perfect for promoting podcast episodes, live streams, or virtual events',
      icon: '🎙️',
      fields: {
        title: 'Podcast Promotion Campaign',
        description: 'Create engaging content to promote our podcast episodes and live events',
        requirements: 'Create social media content, video clips, or graphics that highlight key moments from our podcast. Include call-to-action to subscribe and follow.',
        reward: 0, // Default value
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalFields: {
          podcastName: '',
          episodeTopics: '',
          targetAudience: '',
          contentType: ['social-media', 'video', 'graphics']
        }
      }
    },
    {
      id: 'ecommerce-product',
      name: 'E-commerce & Product',
      description: 'Ideal for product launches, reviews, and e-commerce campaigns',
      icon: '🛍️',
      fields: {
        title: 'Product Launch Campaign',
        description: 'Generate buzz and drive sales for our new product launch',
        requirements: 'Create authentic product reviews, unboxing videos, or lifestyle content featuring our products. Include honest feedback and genuine user experience.',
        reward: 0, // Default value
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalFields: {
          productName: '',
          productCategory: '',
          targetDemographic: '',
          contentStyle: ['review', 'unboxing', 'lifestyle', 'tutorial']
        }
      }
    },
    {
      id: 'talent-giveaway',
      name: 'Talent Giveaways',
      description: 'Great for contests, giveaways, and community engagement campaigns',
      icon: '🎁',
      fields: {
        title: 'Talent Giveaway Campaign',
        description: 'Run an exciting giveaway to engage our community and reward our audience',
        requirements: 'Create engaging content that promotes our giveaway, explains the prizes, and encourages participation. Include clear entry instructions and deadline.',
        reward: 0, // Default value
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalFields: {
          giveawayType: '',
          prizes: '',
          entryRequirements: '',
          promotionChannels: ['instagram', 'tiktok', 'youtube', 'twitter']
        }
      }
    },
    {
      id: 'tweets',
      name: 'Tweets',
      description: 'Perfect for Twitter/X campaigns, viral content, and social media engagement',
      icon: '🐦',
      fields: {
        title: 'Twitter/X Campaign',
        description: 'Create engaging tweets and Twitter content to boost brand awareness and engagement',
        requirements: 'Create compelling tweets, threads, or Twitter content that resonates with our audience. Focus on engagement, virality, and brand voice consistency.',
        reward: 0, // Default value
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalFields: {
          campaignTheme: '',
          hashtags: '',
          targetAudience: '',
          tweetStyle: ['informative', 'humorous', 'promotional', 'storytelling', 'thread']
        }
      }
    },
    {
      id: 'ig-story-blitz',
      name: 'IG Story Blitz',
      description: 'Ideal for Instagram Stories campaigns, quick engagement, and visual storytelling',
      icon: '📱',
      fields: {
        title: 'Instagram Stories Campaign',
        description: 'Create engaging Instagram Stories content to drive engagement and brand awareness',
        requirements: 'Create visually appealing Instagram Stories that tell our brand story, showcase products, or engage followers. Include interactive elements and compelling visuals.',
        reward: 0, // Default value
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        additionalFields: {
          storyTheme: '',
          visualStyle: '',
          interactiveElements: '',
          storyFormat: ['single-story', 'story-series', 'highlights', 'reels']
        }
      }
    }
  ];

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);
    if (templateId && templateId !== 'scratch') {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          ...template.fields,
          reward: 0, // Initialize with empty reward type
          amountOfWinners: 1,
          location: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          rewardTiers: []
        });
      }
    } else if (templateId === 'scratch') {
      setFormData({
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value for reward field
        deadline: '',
        amountOfWinners: 1,
        location: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        rewardTiers: [],
        additionalFields: {}
      });
    }
    setCurrentStep(2);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdditionalFieldChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: {
        ...prev.additionalFields,
        [field]: value
      }
    }));
  };

  const handleAmountOfWinnersChange = (amount: number) => {
    setFormData(prev => {
      const newRewardTiers = [];
      for (let i = 1; i <= amount; i++) {
        newRewardTiers.push({
          position: i,
          cashAmount: 0,
          creditAmount: 0,
          prizeDescription: ''
        });
      }
      return {
        ...prev,
        amountOfWinners: amount,
        rewardTiers: newRewardTiers
      };
    });
  };

  const handleRewardTierChange = (position: number, field: keyof RewardTier, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      rewardTiers: prev.rewardTiers.map(tier => 
        tier.position === position 
          ? { ...tier, [field]: value }
          : tier
      )
    }));
  };

  const calculateTotalReward = () => {
    return formData.rewardTiers.reduce((total, tier) => {
      return total + (tier.cashAmount || 0) + (tier.creditAmount || 0);
    }, 0);
  };

    const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{
    countries: string[];
    cities: string[];
    states: string[];
    streets: string[];
  }>({
    countries: [],
    cities: [],
    states: [],
    streets: []
  });
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<{
    countries: boolean;
    cities: boolean;
    states: boolean;
    streets: boolean;
  }>({
    countries: false,
    cities: false,
    states: false,
    streets: false
  });

  const handleLocationFieldChange = (field: keyof FormData['location'], value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const searchCountries = async (query: string) => {
    if (query.trim().length < 2) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=&limit=10&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json() as NominatimSearchResult[];
        const countries = [...new Set(data.map((item: NominatimSearchResult) => item.address?.country).filter(Boolean))] as string[];
        return countries.slice(0, 5);
      }
    } catch (error) {
      // Silent fail
    }
    return [];
  };

  const searchCities = async (query: string, country?: string) => {
    if (query.trim().length < 2) return [];
    
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=city&limit=10&addressdetails=1`;
      if (country) {
        url += `&countrycodes=${country}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as NominatimSearchResult[];
        const cities = [...new Set(data.map((item: NominatimSearchResult) => 
          item.address?.city || item.address?.town || item.address?.village
        ).filter(Boolean))] as string[];
        return cities.slice(0, 5);
      }
    } catch (error) {
      // Silent fail
    }
    return [];
  };

  const searchStates = async (query: string, country?: string) => {
    if (query.trim().length < 2) return [];
    
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=state&limit=10&addressdetails=1`;
      if (country) {
        url += `&countrycodes=${country}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as NominatimSearchResult[];
        const states = [...new Set(data.map((item: NominatimSearchResult) => 
          item.address?.state || item.address?.province
        ).filter(Boolean))] as string[];
        return states.slice(0, 5);
      }
    } catch (error) {
      // Silent fail
    }
    return [];
  };

  const searchStreets = async (query: string, city?: string) => {
    if (query.trim().length < 2) return [];
    
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=street&limit=10&addressdetails=1`;
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as NominatimSearchResult[];
        const streets = [...new Set(data.map((item: NominatimSearchResult) => 
          item.address?.road || item.address?.street
        ).filter(Boolean))] as string[];
        return streets.slice(0, 5);
      }
    } catch (error) {
      // Silent fail
    }
    return [];
  };

  const handleLocationFieldInput = async (field: keyof FormData['location'], value: string) => {
    handleLocationFieldChange(field, value);
    
    if (value.trim().length >= 2) {
      setIsValidatingLocation(true);
      
      try {
        let suggestions: string[] = [];
        
        switch (field) {
          case 'country':
            suggestions = await searchCountries(value);
            setLocationSuggestions(prev => ({ ...prev, countries: suggestions }));
            setShowLocationSuggestions(prev => ({ ...prev, countries: true }));
            break;
          case 'city':
            suggestions = await searchCities(value, formData.location.country);
            setLocationSuggestions(prev => ({ ...prev, cities: suggestions }));
            setShowLocationSuggestions(prev => ({ ...prev, cities: true }));
            break;
          case 'state':
            suggestions = await searchStates(value, formData.location.country);
            setLocationSuggestions(prev => ({ ...prev, states: suggestions }));
            setShowLocationSuggestions(prev => ({ ...prev, states: true }));
            break;
          case 'street':
            suggestions = await searchStreets(value, formData.location.city);
            setLocationSuggestions(prev => ({ ...prev, streets: suggestions }));
            setShowLocationSuggestions(prev => ({ ...prev, streets: true }));
            break;
        }
      } catch (error) {
        // Silent fail
      } finally {
        setIsValidatingLocation(false);
      }
    } else {
      setShowLocationSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleLocationSuggestionSelect = (field: keyof FormData['location'], suggestion: string) => {
    handleLocationFieldChange(field, suggestion);
    setShowLocationSuggestions(prev => ({ ...prev, [field]: false }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get standardized location
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              const address = data.address as NominatimAddress;
              const city = address.city || address.town || address.village || address.county || '';
              const state = address.state || address.province || '';
              const country = address.country || '';
              
              // Update location fields with detected values
              setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  city: city,
                  state: state,
                  country: country
                }
              }));
            }
          }
        } catch (error) {
          alert('Could not detect location. Please enter location manually.');
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location services or search for a location.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable. Please search for a location.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please search for a location.');
            break;
          default:
            alert('An unknown error occurred while getting location. Please search for a location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };



      const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate location before submission
      const { country, city } = formData.location;
      if (!country.trim()) {
        alert('Country is required. Please enter a valid country.');
        return;
      }
      if (!city.trim()) {
        alert('City is required. Please enter a valid city.');
        return;
      }
      
      try {
        // Create a formatted location string for the API
        const locationParts = [
          formData.location.street,
          formData.location.city,
          formData.location.state,
          formData.location.zipCode,
          formData.location.country
        ].filter(Boolean);
        
        const formattedLocation = locationParts.join(', ');
        
        const briefData = {
          ...formData,
          location: formattedLocation, // Convert back to string for API compatibility
          rewardTiers: formData.rewardTiers, // Include reward tiers
          brandId: user?.id,
          status: 'draft',
          isPrivate,
          createdAt: new Date().toISOString()
        };
      
        const response = await fetch('/api/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(briefData)
              });
      
        if (response.ok) {
          const result = await response.json();
          setBriefId(result.id);
        setShowShareModal(true);
              } else {
          const errorData = await response.json();
          alert('Failed to create brief: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error creating brief: ' + error);
      }
  };

  const copyToClipboard = async () => {
    if (briefId) {
      const shareableLink = `${window.location.origin}/brief/${briefId}`;
      try {
        await navigator.clipboard.writeText(shareableLink);
        alert('Link copied to clipboard!');
      } catch (error) {
        // Failed to copy link
      }
    }
  };

  const renderTemplateSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create a New Brief</h1>
        <p className="text-lg text-gray-600">Choose a template to get started or start from scratch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">{template.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </button>
        ))}

        <button
          onClick={() => handleTemplateSelect('scratch')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left border-dashed border-gray-300"
        >
          <div className="text-4xl mb-4">✏️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start from Scratch</h3>
          <p className="text-sm text-gray-600">Create a custom brief with your own requirements</p>
        </button>
      </div>
    </div>
  );

  const renderBriefForm = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setCurrentStep(1)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to templates
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {template ? `${template.name} Brief` : 'Custom Brief'}
          </h2>
          <p className="text-gray-600">Fill in the details for your campaign brief</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount of Rewards *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.amountOfWinners}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 1 && value <= 50) {
                        handleAmountOfWinnersChange(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of rewards (1-50)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 50</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">Location Details *</h4>
                  
                  {/* Country */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) => handleLocationFieldInput('country', e.target.value)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(prev => ({ ...prev, countries: false })), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search for a country..."
                      required
                    />
                    {showLocationSuggestions.countries && locationSuggestions.countries.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.countries.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSuggestionSelect('country', suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleLocationFieldInput('city', e.target.value)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(prev => ({ ...prev, cities: false })), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search for a city..."
                      required
                    />
                    {showLocationSuggestions.cities && locationSuggestions.cities.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.cities.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSuggestionSelect('city', suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State/Province */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) => handleLocationFieldInput('state', e.target.value)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(prev => ({ ...prev, states: false })), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search for a state or province..."
                    />
                    {showLocationSuggestions.states && locationSuggestions.states.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.states.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSuggestionSelect('state', suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Street Address */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.location.street}
                      onChange={(e) => handleLocationFieldInput('street', e.target.value)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(prev => ({ ...prev, streets: false })), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search for a street address..."
                    />
                    {showLocationSuggestions.streets && locationSuggestions.streets.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.streets.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSuggestionSelect('street', suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ZIP/Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.location.zipCode}
                      onChange={(e) => handleLocationFieldChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter ZIP or postal code..."
                    />
                  </div>

                  {/* Auto-detect location button */}
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
                    >
                      📍 Auto-detect Location
                    </button>
                  </div>

                  {/* Loading indicator */}
                  {isValidatingLocation && (
                    <div className="absolute right-2 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reward Tiers Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Tiers</h3>
            <p className="text-sm text-gray-600 mb-6">
              Set rewards for each reward tier. You can mix cash, credits, and prizes for each position.
            </p>
            
            {formData.rewardTiers.length > 0 && (
              <div className="space-y-4">
                {formData.rewardTiers.map((tier) => (
                  <div key={tier.position} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Reward {tier.position}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cash Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.cashAmount || ''}
                          onChange={(e) => handleRewardTierChange(tier.position, 'cashAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credit Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={tier.creditAmount || ''}
                          onChange={(e) => handleRewardTierChange(tier.position, 'creditAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Description
                        </label>
                        <input
                          type="text"
                          value={tier.prizeDescription || ''}
                          onChange={(e) => handleRewardTierChange(tier.position, 'prizeDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Product bundle, Gift card, Experience"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total Calculator */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Campaign Total:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      ${calculateTotalReward().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Total cash value of all rewards (excluding prizes)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Template-specific fields */}
          {template && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{template.name} Specific Fields</h3>
              
              {template.id === 'podcast-live' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Podcast Name</label>
                    <input
                      type="text"
                      value={formData.additionalFields.podcastName || ''}
                      onChange={(e) => handleAdditionalFieldChange('podcastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Episode Topics</label>
                    <textarea
                      value={formData.additionalFields.episodeTopics || ''}
                      onChange={(e) => handleAdditionalFieldChange('episodeTopics', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Key topics, guests, or themes to highlight"
                    />
                  </div>
                </div>
              )}

              {template.id === 'ecommerce-product' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={formData.additionalFields.productName || ''}
                      onChange={(e) => handleAdditionalFieldChange('productName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                    <input
                      type="text"
                      value={formData.additionalFields.productCategory || ''}
                      onChange={(e) => handleAdditionalFieldChange('productCategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Electronics, Fashion, Beauty"
                    />
                  </div>
                </div>
              )}

              {template.id === 'talent-giveaway' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giveaway Type</label>
                    <input
                      type="text"
                      value={formData.additionalFields.giveawayType || ''}
                      onChange={(e) => handleAdditionalFieldChange('giveawayType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Product giveaway, Experience, Gift card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prizes</label>
                    <textarea
                      value={formData.additionalFields.prizes || ''}
                      onChange={(e) => handleAdditionalFieldChange('prizes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the prizes and their value"
                    />
                  </div>
                </div>
              )}

              {template.id === 'tweets' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Theme</label>
                    <input
                      type="text"
                      value={formData.additionalFields.campaignTheme || ''}
                      onChange={(e) => handleAdditionalFieldChange('campaignTheme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Product launch, Brand awareness, Customer testimonials"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                    <input
                      type="text"
                      value={formData.additionalFields.hashtags || ''}
                      onChange={(e) => handleAdditionalFieldChange('hashtags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., #BrandName #ProductLaunch #Innovation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <textarea
                      value={formData.additionalFields.targetAudience || ''}
                      onChange={(e) => handleAdditionalFieldChange('targetAudience', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your target audience demographics and interests"
                    />
                  </div>
                </div>
              )}

              {template.id === 'ig-story-blitz' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Story Theme</label>
                    <input
                      type="text"
                      value={formData.additionalFields.storyTheme || ''}
                      onChange={(e) => handleAdditionalFieldChange('storyTheme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Behind the scenes, Product showcase, User-generated content"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visual Style</label>
                    <input
                      type="text"
                      value={formData.additionalFields.visualStyle || ''}
                      onChange={(e) => handleAdditionalFieldChange('visualStyle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Minimalist, Bold colors, Vintage, Modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interactive Elements</label>
                    <textarea
                      value={formData.additionalFields.interactiveElements || ''}
                      onChange={(e) => handleAdditionalFieldChange('interactiveElements', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Polls, Questions, Swipe-up links, Music stickers"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                Make this brief private
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Private briefs won&apos;t appear in the public marketplace but you&apos;ll still get a shareable link to send to creators directly.
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/brand/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Brief
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderShareModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Brief Created Successfully! 🎉</h3>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Your brief has been created and is ready to share with creators.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Shareable Link:</p>
            <p className="text-sm text-gray-600 break-all">
              {briefId ? `${window.location.origin}/brief/${briefId}` : 'Loading...'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Copy Link
            </button>
            <button
              onClick={() => {
                setShowShareModal(false);
                navigate('/brand/dashboard');
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {currentStep === 1 && renderTemplateSelection()}
      {currentStep === 2 && renderBriefForm()}
      {showShareModal && renderShareModal()}
    </div>
  );
};

export default CreateBrief; 