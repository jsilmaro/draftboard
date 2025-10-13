import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import RewardTierManager from './RewardTierManager';
import BriefFundingModal from './BriefFundingModal';

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
  id?: string;
  tierNumber: number;
  name: string;
  description: string;
  amount: number;
  position: number;
  isActive: boolean;
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

interface CreateBriefProps {
  isSideModal?: boolean;
  onClose?: () => void;
  onSuccess?: (brief: { id: string; title: string; [key: string]: unknown }) => void;
}

const CreateBrief: React.FC<CreateBriefProps> = ({ isSideModal = false, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
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
  const [showFundingModal, setShowFundingModal] = useState(false);

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
            Object.keys(template.fields.additionalFields || {}).forEach(key => {
              if (Array.isArray(template.fields.additionalFields?.[key])) {
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
        ...(prev.additionalFields || {}),
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
          id: `tier_${i}`,
          tierNumber: i,
          name: `Reward ${i}`,
          description: `Equal share ($${rewardPerWinner.toFixed(2)})`,
          amount: rewardPerWinner,
          position: i,
          isActive: true
        });
      }
      return {
        ...prev,
        amountOfWinners: amount,
        rewardTiers: newRewardTiers
      };
    });
  };

  // const handleRewardTierChange = (position: number, field: keyof RewardTier, value: string | number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     rewardTiers: prev.rewardTiers.map(tier => 
  //       tier.position === position 
  //         ? { ...tier, [field]: value }
  //         : tier
  //     )
  //   }));
  // };

  const calculateTotalReward = () => {
    return formData.rewardTiers.reduce((total, tier) => {
      return total + (tier.amount || 0);
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

    // Show funding modal instead of creating brief directly
    setShowFundingModal(true);
  };

  const handleFundingSuccess = (briefId: string) => {
    setBriefId(briefId);
    setShowFundingModal(false);
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess({ id: briefId, title: formData.title });
    }
    
    // Show success message
    alert('Brief created and funded successfully! Your brief is now active and visible to creators.');
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      requirements: '',
      reward: 0,
      deadline: '',
      rewardTiers: [{ 
        position: 1, 
        amount: 0, 
        description: '',
        tierNumber: 1,
        name: 'Tier 1',
        isActive: true
      }],
      amountOfWinners: 1,
      additionalFields: {} as Record<string, string | string[]>
    });
    setCurrentStep(1);
    setFormKey(prev => prev + 1);
    
    // Close modal if it's a side modal
    if (isSideModal && onClose) {
      onClose();
    } else {
      navigate('/brand-dashboard?tab=briefs');
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
      <div className={`min-h-screen py-8 ${
        isDark ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button - Only show when not in side modal */}
          {!isSideModal && (
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center transition-colors ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create a New Brief
            </h1>
            <p className={`${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Choose a template or start from scratch to create your campaign brief
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Start from Scratch */}
            <div
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedTemplate === 'scratch'
                  ? isDark 
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-blue-500 bg-blue-50'
                  : isDark
                    ? 'border-gray-900/50 bg-black/20 backdrop-blur-sm hover:border-blue-600/50'
                    : 'border-gray-300 bg-white hover:border-blue-300/50'
              }`}
              onClick={() => handleTemplateSelect('scratch')}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Start from Scratch
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
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
                    ? isDark 
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : isDark
                      ? 'border-gray-900/50 bg-black/20 backdrop-blur-sm hover:border-blue-600/50'
                      : 'border-gray-300 bg-white hover:border-blue-300/50'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <img src={template.icon} alt={template.name} className="w-12 h-12" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {template.name}
                  </h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
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
    <div className={`min-h-screen py-8 ${
      isDark ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className={`backdrop-blur-xl rounded-lg shadow-sm border p-8 ${
          isDark 
            ? 'bg-black/20 border-white/20'
            : 'bg-white border-gray-200'
        }`}>
          {/* Back to Templates Button - Always visible in Step 2 */}
          <div className="mb-6">
            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedTemplate(null);
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
                setFormKey(prev => prev + 1);
              }}
              className={`flex items-center text-sm font-medium transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-green-500'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Templates
            </button>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Brief
            </h1>
            {selectedTemplate && selectedTemplate !== 'scratch' && (
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Using template: {templates.find(t => t.id === selectedTemplate)?.name || 'Custom'}
              </p>
            )}
          </div>

          <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Brief Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter brief title"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Describe your brief"
                  required
                />
              </div>

              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Requirements *
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="What do you want creators to do?"
                  required
                />
              </div>
            </div>

            {/* Reward Configuration */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Reward Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Total Reward Amount *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.reward}
                    onChange={(e) => handleInputChange('reward', parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Total reward amount"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount of Winners *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.amountOfWinners}
                    onChange={(e) => handleAmountOfWinnersChange(parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="How many creators can win?"
                  />
                </div>
              </div>

              <RewardTierManager
                tiers={formData.rewardTiers}
                onTiersChange={(tiers) => setFormData(prev => ({ ...prev, rewardTiers: tiers }))}
                isDark={isDark}
                totalRewardAmount={formData.reward}
                amountOfWinners={formData.amountOfWinners}
              />
            </div>

            {/* Additional Fields from Template */}
            {formData.additionalFields && Object.keys(formData.additionalFields).length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {Object.entries(formData.additionalFields).map(([key, value]) => {
                    const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    if (Array.isArray(value)) {
                      return (
                        <div key={key}>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {fieldName}
                          </label>
                          <select
                            value={Array.isArray(formData.additionalFields?.[key]) ? (formData.additionalFields[key] as string[])[0] || '' : ''}
                            onChange={(e) => handleAdditionalFieldChange(key, [e.target.value])}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              isDark 
                                ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
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
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {fieldName}
                        </label>
                        <input
                          type="text"
                          value={(formData.additionalFields?.[key] as string) || ''}
                          onChange={(e) => handleAdditionalFieldChange(key, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDark 
                              ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
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
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
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
                <label htmlFor="isPrivate" className={`ml-2 block text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Make this brief private (only invited creators can see it)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`px-6 py-2 border rounded-md transition-colors ${
                  isDark 
                    ? 'border-gray-800 text-gray-300 hover:bg-gray-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
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


      {showShareModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${
          isDark ? 'bg-black bg-opacity-50' : 'bg-gray-900 bg-opacity-50'
        }`}>
          <div className={`backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 border ${
            isDark 
              ? 'bg-black/20 border-white/20'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Brief Created Successfully!
            </h3>
            <p className={`mb-4 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Share this link with creators to invite them to your brief:
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
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
                onClick={() => {
                  setShowShareModal(false);
                  if (isSideModal && onClose) {
                    onClose();
                  }
                }}
                className={`px-4 py-2 transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (isSideModal && onClose) {
                    onClose();
                  } else {
                    navigate('/brand/dashboard');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isSideModal ? 'Done' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brief Funding Modal */}
      <BriefFundingModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
        onSuccess={handleFundingSuccess}
        briefData={{
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          reward: calculateTotalReward(),
          amountOfWinners: formData.amountOfWinners,
          deadline: formData.deadline,
          location: '',
          isPrivate: false,
          additionalFields: formData.additionalFields,
          rewardTiers: formData.rewardTiers
        }}
      />
    </div>
  );
};

export default CreateBrief; 