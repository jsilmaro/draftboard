import React, { useState, useEffect } from 'react';
import AnimatedNotification from './AnimatedNotification';

interface Brief {
  id: string;
  title: string;
  status: string;
  submissions: number;
  shortlistedCount: number;
  rewardType?: string;
}

interface Submission {
  id: string;
  creatorName: string;
  briefTitle: string;
  status: string;
  submittedAt: string;
}

interface RewardTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  winnerId?: string;
  winnerName?: string;
  type: 'CASH' | 'CREDIT' | 'PRIZES';
  // CASH specific fields
  paymentMethod?: string;
  bankDetails?: string;
  // CREDIT specific fields
  creditAmount?: number;
  platformPoints?: number;
  redemptionRules?: string;
  // PRIZES specific fields
  itemDescription?: string;
  shippingDetails?: string;
  deliveryTracking?: string;
}

interface CreateRewardProps {
  onBack?: () => void;
  draftToEdit?: {
    briefId: string;
    briefTitle: string;
    rewardTiers: RewardTier[];
    savedAt: string;
  };
}

const CreateReward: React.FC<CreateRewardProps> = ({ onBack, draftToEdit }) => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [shortlistedSubmissions, setShortlistedSubmissions] = useState<Submission[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedRewardType, setSelectedRewardType] = useState<'CASH' | 'CREDIT' | 'PRIZES' | ''>('');

  useEffect(() => {
    fetchBriefs();
    
    // If we have a draft to edit, load it
    if (draftToEdit) {
      setSelectedBrief({
        id: draftToEdit.briefId,
        title: draftToEdit.briefTitle,
        status: 'active',
        submissions: 0,
        shortlistedCount: 0
      });
      setRewardTiers(draftToEdit.rewardTiers);
    }
  }, [draftToEdit]);

    const fetchBriefs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/briefs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const briefsData = await response.json();
        
        // Show all briefs, not just active ones
        const allBriefs = briefsData;
        
        // Fetch shortlisted counts for each brief
        const briefsWithShortlistedCounts = await Promise.all(
          allBriefs.map(async (brief: Brief) => {
            try {
              const submissionsResponse = await fetch('/api/brands/submissions', {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (submissionsResponse.ok) {
                const submissionsData = await submissionsResponse.json();
                const shortlistedCount = submissionsData.filter((sub: Submission) => 
                  sub.briefTitle === brief.title && sub.status === 'approved'
                ).length;
                
                return {
                  ...brief,
                  shortlistedCount
                };
              }
            } catch (error) {
              // Error fetching submissions for brief
            }
    
            return {
              ...brief,
              shortlistedCount: 0
            };
          })
        );
        
        setBriefs(briefsWithShortlistedCounts);
      }
    } catch (error) {
      // Error fetching briefs
    }
  };

  const handlePublishBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'active'
        })
      });

      if (response.ok) {
        // Refresh the briefs data
        fetchBriefs();
        alert('Brief published successfully!');
      } else {
        alert('Failed to publish brief. Please try again.');
      }
    } catch (error) {
      alert('Error publishing brief. Please try again.');
    }
  };

  const handleBriefSelect = async (brief: Brief) => {
    // Warn if trying to select a draft brief
    if (brief.status === 'draft') {
      const confirmed = window.confirm(
        'This brief is still in draft status and hasn\'t received any submissions yet. ' +
        'You should publish the brief first to receive submissions before creating rewards. ' +
        'Do you want to continue anyway?'
      );
      if (!confirmed) return;
    }
    
    setSelectedBrief(brief);
    
    // Set the reward type based on the brief's rewardType
    if (brief.rewardType) {
      setSelectedRewardType(brief.rewardType as 'CASH' | 'CREDIT' | 'PRIZES');
    }
    

    
    // Fetch shortlisted submissions for this brief
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const submissionsData = await response.json();
        const shortlisted = submissionsData.filter((sub: Submission) => 
          sub.briefTitle === brief.title && sub.status === 'approved'
        );
        setShortlistedSubmissions(shortlisted);
      }
    } catch (error) {
      // Error fetching shortlisted submissions
    }
  };

  const addRewardTier = () => {
    if (!selectedRewardType) {
      alert('Please select a reward type first');
      return;
    }

    const newTier: RewardTier = {
      id: Date.now().toString(),
      name: `${selectedRewardType} Reward ${rewardTiers.length + 1}`,
      amount: 0,
      description: '',
      type: selectedRewardType,
      // Initialize type-specific fields
      ...(selectedRewardType === 'CASH' && {
        paymentMethod: '',
        bankDetails: ''
      }),
      ...(selectedRewardType === 'CREDIT' && {
        creditAmount: 0,
        platformPoints: 0,
        redemptionRules: ''
      }),
      ...(selectedRewardType === 'PRIZES' && {
        itemDescription: '',
        shippingDetails: '',
        deliveryTracking: ''
      })
    };
    setRewardTiers([...rewardTiers, newTier]);
  };

  const updateRewardTier = (id: string, field: keyof RewardTier, value: string | number) => {
    setRewardTiers(prev => prev.map(tier => 
      tier.id === id ? { ...tier, [field]: value } : tier
    ));
  };

  const removeRewardTier = (id: string) => {
    setRewardTiers(prev => prev.filter(tier => tier.id !== id));
  };

  const selectWinner = (tier: RewardTier) => {
    setSelectedTier(tier);
    setShowWinnerModal(true);
  };

  const assignWinner = (submissionId: string, creatorName: string) => {
    if (!selectedTier) return;

    setRewardTiers(prev => prev.map(tier => 
      tier.id === selectedTier.id 
        ? { ...tier, winnerId: submissionId, winnerName: creatorName }
        : tier
    ));
    setShowWinnerModal(false);
    setSelectedTier(null);
  };



  const handleSaveRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/rewards/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          briefId: selectedBrief?.id,
          briefTitle: selectedBrief?.title,
          rewardTiers,
          savedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Rewards saved as draft successfully!');
      } else {
        alert('Failed to save rewards. Please try again.');
      }
    } catch (error) {
      // Error saving awards
      alert('Error saving rewards. Please try again.');
    }
  };

  const handleSubmitRewards = () => {
    // Check if all tiers have winners assigned
    const incompleteTiers = rewardTiers.filter(tier => !tier.winnerId);
    if (incompleteTiers.length > 0) {
      alert('Please assign winners to all reward tiers before submitting.');
      return;
    }

    setShowWarningModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          briefId: selectedBrief?.id,
          briefTitle: selectedBrief?.title,
          rewardTiers,
          submittedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Close the brief
        const closeBriefResponse = await fetch(`/api/brands/briefs/${selectedBrief?.id}/close`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (closeBriefResponse.ok) {
          setShowSuccessNotification(true);
          setShowWarningModal(false);
          // Reset form
          setSelectedBrief(null);
          setRewardTiers([]);
          setShortlistedSubmissions([]);
          setSelectedRewardType('');
        } else {
          const errorData = await closeBriefResponse.json();
          // Failed to close brief
          alert(`Rewards submitted successfully, but there was an issue closing the brief: ${errorData.error || 'Unknown error'}. Please contact support.`);
        }
      } else {
        alert('Failed to submit rewards. Please try again.');
      }
    } catch (error) {
      alert('Error submitting rewards. Please try again.');
    }
  };

  const renderRewardTypeForm = (tier: RewardTier) => {
    switch (tier.type) {
      case 'CASH':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={tier.paymentMethod || ''}
                onChange={(e) => updateRewardTier(tier.id, 'paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select payment method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
              <input
                type="text"
                value={tier.bankDetails || ''}
                onChange={(e) => updateRewardTier(tier.id, 'bankDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bank account details or payment instructions"
              />
            </div>
          </div>
        );

      case 'CREDIT':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
              <input
                type="number"
                value={tier.creditAmount || 0}
                onChange={(e) => updateRewardTier(tier.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Credit amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Points</label>
              <input
                type="number"
                value={tier.platformPoints || 0}
                onChange={(e) => updateRewardTier(tier.id, 'platformPoints', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Platform points"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Rules</label>
              <textarea
                value={tier.redemptionRules || ''}
                onChange={(e) => updateRewardTier(tier.id, 'redemptionRules', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Rules for redeeming credits/points"
              />
            </div>
          </div>
        );

      case 'PRIZES':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
              <textarea
                value={tier.itemDescription || ''}
                onChange={(e) => updateRewardTier(tier.id, 'itemDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Detailed description of the prize item"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Details</label>
              <input
                type="text"
                value={tier.shippingDetails || ''}
                onChange={(e) => updateRewardTier(tier.id, 'shippingDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Shipping information"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Tracking</label>
              <input
                type="text"
                value={tier.deliveryTracking || ''}
                onChange={(e) => updateRewardTier(tier.id, 'deliveryTracking', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tracking number or delivery info"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          )}
          <h2 className="text-2xl font-bold text-gray-900">Create Rewards</h2>
        </div>
      </div>

      {/* Step 1: Select Brief */}
      {!selectedBrief && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select a Brief</h3>
          <p className="text-gray-600 mb-4">Choose which brief you want to create rewards for:</p>
          
          {briefs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No briefs found</h4>
              <p className="text-gray-600 mb-4">You need to create and publish a brief before you can create rewards.</p>
              <button 
                onClick={() => window.location.href = '/brand/dashboard?tab=briefs'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Briefs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefs.map((brief) => (
                <div 
                  key={brief.id}
                  onClick={() => handleBriefSelect(brief)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    brief.status === 'active' 
                      ? 'border-green-300 hover:border-green-400 hover:bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900">{brief.title}</h4>
                  <p className="text-sm text-gray-600">Shortlisted: {brief.shortlistedCount}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      brief.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : brief.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {brief.status === 'active' ? '✅ Active' : 
                       brief.status === 'draft' ? '📝 Draft' : 
                       brief.status === 'completed' ? '🏁 Completed' : brief.status}
                    </span>
                    {brief.rewardType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {brief.rewardType === 'CASH' ? '💰 Cash' : 
                         brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                         brief.rewardType === 'PRIZES' ? '🎁 Prizes' : brief.rewardType}
                      </span>
                    )}
                  </div>
                  {brief.status === 'draft' && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-600 mb-1">
                        ⚠️ Publish this brief to receive submissions
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishBrief(brief.id);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Publish Brief
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Create Rewards */}
      {selectedBrief && (
        <div className="space-y-6">
          {/* Brief Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Brief: {selectedBrief.title}</h3>
            <p className="text-blue-700">Shortlisted Submissions: {shortlistedSubmissions.length}</p>
            <button 
              onClick={() => setSelectedBrief(null)}
              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
            >
              ← Change Brief
            </button>
          </div>

          {/* Reward Type Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Reward Type</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type</label>
              {selectedBrief?.rewardType ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {selectedBrief.rewardType === 'CASH' ? '💰' : 
                       selectedBrief.rewardType === 'CREDIT' ? '🎫' : 
                       selectedBrief.rewardType === 'PRIZES' ? '🎁' : ''}
                    </span>
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedBrief.rewardType === 'CASH' ? 'Cash Rewards' : 
                         selectedBrief.rewardType === 'CREDIT' ? 'Credit Rewards' : 
                         selectedBrief.rewardType === 'PRIZES' ? 'Prize Rewards' : selectedBrief.rewardType}
                      </p>
                      <p className="text-sm text-blue-700">Pre-selected based on your brief configuration</p>
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedRewardType}
                  onChange={(e) => setSelectedRewardType(e.target.value as 'CASH' | 'CREDIT' | 'PRIZES' | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reward type</option>
                  <option value="CASH">💰 CASH - Monetary rewards</option>
                  <option value="CREDIT">🎫 CREDIT - Platform credits/points</option>
                  <option value="PRIZES">🎁 PRIZES - Physical items & experiences</option>
                </select>
              )}
            </div>
            
            {selectedRewardType && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedRewardType === 'CASH' && '💰 Cash Rewards'}
                  {selectedRewardType === 'CREDIT' && '🎫 Credit Rewards'}
                  {selectedRewardType === 'PRIZES' && '🎁 Prize Rewards'}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedRewardType === 'CASH' && 'Monetary rewards paid directly to creators'}
                  {selectedRewardType === 'CREDIT' && 'Platform credits or points that creators can redeem'}
                  {selectedRewardType === 'PRIZES' && 'Physical items, gift cards, or experiences'}
                </p>
              </div>
            )}
          </div>

          {/* Reward Tiers */}
          {selectedRewardType && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Step 3: Create Reward Tiers</h3>
                <button 
                  onClick={addRewardTier}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add {selectedRewardType} Reward
                </button>
              </div>

              {rewardTiers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">
                    {selectedRewardType === 'CASH' && '💰'}
                    {selectedRewardType === 'CREDIT' && '🎫'}
                    {selectedRewardType === 'PRIZES' && '🎁'}
                  </div>
                  <p>No {selectedRewardType.toLowerCase()} reward tiers yet. Click &quot;Add {selectedRewardType} Reward&quot; to get started!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rewardTiers.map((tier, _index) => (
                    <div key={tier.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) => updateRewardTier(tier.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 1st Place, Best Design, Special Recognition"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {tier.type === 'CASH' ? 'Amount ($)' : 
                                 tier.type === 'CREDIT' ? 'Credit Value' : 'Prize Value ($)'}
                              </label>
                              <input
                                type="number"
                                value={tier.amount}
                                onChange={(e) => updateRewardTier(tier.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <input
                                type="text"
                                value={tier.description}
                                onChange={(e) => updateRewardTier(tier.id, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief description of this reward"
                              />
                            </div>
                          </div>

                          {/* Type-specific fields */}
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                              {tier.type} Specific Details
                            </h4>
                            {renderRewardTypeForm(tier)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeRewardTier(tier.id)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Winner Selection */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Winner:</span>
                            {tier.winnerName ? (
                              <span className="ml-2 text-sm text-green-600 font-medium">
                                {tier.winnerName} ✅
                              </span>
                            ) : (
                              <span className="ml-2 text-sm text-gray-500">Not selected</span>
                            )}
                          </div>
                          <button
                            onClick={() => selectWinner(tier)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            {tier.winnerName ? 'Change Winner' : 'Select Winner'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}


            </div>
          )}

          {/* Save and Submit Buttons */}
          {rewardTiers.length > 0 && (
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSaveRewards}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmitRewards}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Submit & Release
              </button>
            </div>
          )}
        </div>
      )}

      {/* Winner Selection Modal */}
      {showWinnerModal && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Winner for {selectedTier.name}</h3>
              <button
                onClick={() => setShowWinnerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {shortlistedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No shortlisted submissions found for this brief.</p>
                <p className="text-sm">Make sure to approve some submissions first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shortlistedSubmissions.map((submission) => (
                  <div 
                    key={submission.id}
                    onClick={() => assignWinner(submission.id, submission.creatorName)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{submission.creatorName}</h4>
                        <p className="text-sm text-gray-600">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-green-600">✓</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Final Warning</h3>
              <p className="text-gray-600 mb-6">
                Once you submit these rewards, the list of winners will be released to the public. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Submit & Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <AnimatedNotification
          message="Rewards have been saved successfully! 🎁"
          type="success"
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
    </div>
  );
};

export default CreateReward; 