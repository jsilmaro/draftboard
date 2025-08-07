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
    additionalFields: Record<string, any>;
  };
}

const CreateBrief: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    reward: 0,
    rewardType: '' as 'CASH' | 'CREDIT' | 'PRIZES' | '',
    deadline: '',
    additionalFields: {} as Record<string, any>
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
    }
  ];

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);
    if (templateId && templateId !== 'scratch') {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          ...template.fields,
          rewardType: '' // Initialize with empty reward type
        });
      }
    } else if (templateId === 'scratch') {
      setFormData({
        title: '',
        description: '',
        requirements: '',
        reward: 0, // Default value since we removed the budget field
        rewardType: '',
        deadline: '',
        additionalFields: {}
      });
    }
    setCurrentStep(2);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdditionalFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: {
        ...prev.additionalFields,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const briefData = {
        ...formData,
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
      }
    } catch (error) {
      console.error('Error creating brief:', error);
    }
  };

  const copyToClipboard = async () => {
    if (briefId) {
      const shareableLink = `${window.location.origin}/brief/${briefId}`;
      try {
        await navigator.clipboard.writeText(shareableLink);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
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
                    Reward Type *
                  </label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => handleInputChange('rewardType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a reward type</option>
                    <option value="CASH">💰 CASH - Monetary rewards</option>
                    <option value="CREDIT">🎫 CREDIT - Platform credits/points</option>
                    <option value="PRIZES">🎁 PRIZES - Physical items & experiences</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You'll set the specific reward amounts and tiers in the Rewards page after creating this brief.
                </p>
              </div>
            </div>
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
              Private briefs won't appear in the public marketplace but you'll still get a shareable link to send to creators directly.
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