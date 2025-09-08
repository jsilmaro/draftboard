import React, { useState, useEffect } from 'react';
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
  rewardTiers: RewardTier[];
  additionalFields: Record<string, string | string[]>;
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
    rewardTiers: [],
    additionalFields: {} as Record<string, string | string[]>
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Ensure form is always empty on mount
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🎯 Component mounted - resetting form to empty');
    setFormData({
      title: '',
      description: '',
      requirements: '',
      reward: 0,
      deadline: '',
      amountOfWinners: 1,
      rewardTiers: [],
      additionalFields: {}
    });
  }, []);

  const templates: BriefTemplate[] = [
    {
      id: 'podcast-live',
      name: 'Podcast & Live Events',
      description: 'Perfect for promoting podcast episodes, live streams, or virtual events',
      icon: '/icons/Green_icons/Video1.png',
      fields: {
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value
        deadline: '',
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
      icon: '/icons/Green_icons/Campaign1.png',
      fields: {
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value
        deadline: '',
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
      icon: '/icons/Green_icons/Trophy1.png',
      fields: {
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value
        deadline: '',
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
      icon: '/icons/Green_icons/Campaign1.png',
      fields: {
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value
        deadline: '',
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
      icon: '/icons/Green_icons/Campaign1.png',
      fields: {
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value
        deadline: '',
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
    // eslint-disable-next-line no-console
    console.log('🎯 Template selected:', templateId);
    setSelectedTemplate(templateId);
    
    // Force form reset with empty values
    const emptyFormData = {
      title: '',
      description: '',
      requirements: '',
      reward: 0,
      deadline: '',
      amountOfWinners: 1,
      rewardTiers: [],
      additionalFields: templateId && templateId !== 'scratch' ? 
        (() => {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            const emptyAdditionalFields: Record<string, string | string[]> = {};
            Object.keys(template.fields.additionalFields).forEach(key => {
              if (Array.isArray(template.fields.additionalFields[key])) {
                emptyAdditionalFields[key] = [];
              } else {
                emptyAdditionalFields[key] = '';
              }
            });
            return emptyAdditionalFields;
          }
          return {};
        })() : {}
    };
    
    // eslint-disable-next-line no-console
    console.log('🎯 Setting empty form data:', emptyFormData);
    setFormData(emptyFormData);
    
    // Force form re-render
    setFormKey(prev => prev + 1);
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
      const baseReward = prev.reward || 0;
      
      // Divide the total reward equally among all winners
      const rewardPerWinner = baseReward / amount;
      
      for (let i = 1; i <= amount; i++) {
        newRewardTiers.push({
          position: i,
          cashAmount: rewardPerWinner,
          creditAmount: 0,
          prizeDescription: `Reward ${i} - Equal share ($${rewardPerWinner.toFixed(2)})`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to create a brief');
      return;
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.description.trim() || !formData.requirements.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.deadline) {
      alert('Please set a deadline');
      return;
    }

    if (formData.amountOfWinners < 1) {
      alert('Please set at least 1 winner');
      return;
    }

    // Validate reward tiers
    if (formData.rewardTiers.length === 0) {
      alert('Please add at least one reward tier');
      return;
    }

    const totalReward = calculateTotalReward();
    if (totalReward <= 0) {
      alert('Please set reward amounts for at least one tier');
      return;
    }

    try {
      const response = await fetch('/api/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          rewardTiers: formData.rewardTiers
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBriefId(result.id);
        setShowShareModal(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create brief');
      }
    } catch (error) {
      alert('Failed to create brief. Please try again.');
    }
  };

  const shareableLink = briefId ? `${window.location.origin}/brief/${briefId}` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Create a New Brief
            </h1>
            <p className="text-gray-300">
              Choose a template or start from scratch to create your campaign brief
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Start from Scratch */}
            <div
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedTemplate === 'scratch'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                     : 'border-gray-700/50 bg-gray-900/20 backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-600/50'
              }`}
              onClick={() => handleTemplateSelect('scratch')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start from Scratch
                </h3>
                <p className="text-sm text-gray-300">
                  Create a custom brief with your own specifications
                </p>
              </div>
            </div>

            {/* Template Options */}
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-700/50 bg-gray-900/20 backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-600/50'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <img src={template.icon} alt={template.name} className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Continue with {selectedTemplate === 'scratch' ? 'Scratch' : 'Template'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
                 <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-sm border border-white/20 dark:border-gray-600/30 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              Create Brief
            </h1>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to Templates
            </button>
          </div>

          <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brief Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter brief title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe your brief"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Requirements *
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="What do you want creators to do?"
                  required
                />
              </div>
            </div>

            {/* Reward Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Reward Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Reward Amount *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.reward}
                    onChange={(e) => handleInputChange('reward', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Total reward amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount of Winners *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.amountOfWinners}
                    onChange={(e) => handleAmountOfWinnersChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="How many creators can win?"
                  />
                </div>
              </div>

              {formData.rewardTiers.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-300">Reward Tiers (Auto-Calculated)</h4>
                  <div className="text-sm text-gray-400 mb-3">
                    Rewards are automatically distributed: 1st (40%), 2nd (30%), 3rd (20%), 4th+ (10%)
                  </div>
                  {formData.rewardTiers.map((tier, _index) => (
                    <div key={tier.position} className="border border-gray-700 dark:border-gray-600 rounded-lg p-4 bg-gray-800/50">
                      <h5 className="font-medium text-white mb-3">
                        Reward {tier.position}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 dark:text-gray-400 mb-1">
                            Cash Amount ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={tier.cashAmount}
                            onChange={(e) => handleRewardTierChange(tier.position, 'cashAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 dark:text-gray-400 mb-1">
                            Credit Amount ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={tier.creditAmount}
                            onChange={(e) => handleRewardTierChange(tier.position, 'creditAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 dark:text-gray-400 mb-1">
                            Prize Description
                          </label>
                          <input
                            type="text"
                            value={tier.prizeDescription}
                            onChange={(e) => handleRewardTierChange(tier.position, 'prizeDescription', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., Product, Gift Card, etc."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Total Reward Value:</strong> ${calculateTotalReward().toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Fields from Template */}
            {Object.keys(formData.additionalFields).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {Object.entries(formData.additionalFields).map(([key, value]) => {
                    const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    if (Array.isArray(value)) {
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {fieldName}
                          </label>
                          <select
                            value={Array.isArray(formData.additionalFields[key]) ? (formData.additionalFields[key] as string[])[0] || '' : ''}
                            onChange={(e) => handleAdditionalFieldChange(key, [e.target.value])}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select {fieldName}</option>
                                        {value.map((option, _index) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, ' ')}
              </option>
            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {fieldName}
                        </label>
                        <input
                          type="text"
                          value={formData.additionalFields[key] as string}
                          onChange={(e) => handleAdditionalFieldChange(key, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder={`Enter ${fieldName.toLowerCase()}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Privacy Settings
              </h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-300">
                  Make this brief private (only invited creators can see it)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Brief
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 border border-white/20 dark:border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">
              Brief Created Successfully!
            </h3>
            <p className="text-gray-300 mb-4">
              Share this link with creators to invite them to your brief:
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/brand/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBrief; 