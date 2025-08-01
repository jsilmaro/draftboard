import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedNotification from './AnimatedNotification';

interface Brief {
  id: string;
  title: string;
  status: string;
  submissions: number;
  shortlistedCount: number;
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
  const { user } = useAuth();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [shortlistedSubmissions, setShortlistedSubmissions] = useState<Submission[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

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
        const activeBriefs = briefsData.filter((brief: Brief) => brief.status === 'active');
        
        // Fetch shortlisted counts for each brief
        const briefsWithShortlistedCounts = await Promise.all(
          activeBriefs.map(async (brief) => {
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
              console.error('Error fetching submissions for brief:', error);
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
      console.error('Error fetching briefs:', error);
    }
  };

  const handleBriefSelect = async (brief: Brief) => {
    setSelectedBrief(brief);
    
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
      console.error('Error fetching shortlisted submissions:', error);
    }
  };

  const addRewardTier = () => {
    const newTier: RewardTier = {
      id: Date.now().toString(),
      name: `Reward ${rewardTiers.length + 1}`,
      amount: 0,
      description: ''
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
        alert('Awards saved as draft successfully!');
      } else {
        alert('Failed to save awards. Please try again.');
      }
    } catch (error) {
      console.error('Error saving awards:', error);
      alert('Error saving awards. Please try again.');
    }
  };

  const handleSubmitRewards = () => {
         // Check if all tiers have winners assigned
     const incompleteTiers = rewardTiers.filter(tier => !tier.winnerId);
     if (incompleteTiers.length > 0) {
       alert('Please assign winners to all award tiers before submitting.');
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
         } else {
           const errorData = await closeBriefResponse.json();
           console.error('Failed to close brief:', errorData);
           alert(`Awards submitted successfully, but there was an issue closing the brief: ${errorData.error || 'Unknown error'}. Please contact support.`);
         }
       } else {
         alert('Failed to submit awards. Please try again.');
       }
     } catch (error) {
       console.error('Error submitting awards:', error);
       alert('Error submitting awards. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900">Create Awards</h2>
        </div>
      </div>

      {/* Step 1: Select Brief */}
      {!selectedBrief && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select a Brief</h3>
                     <p className="text-gray-600 mb-4">Choose which brief you want to create awards for:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map((brief) => (
              <div 
                key={brief.id}
                onClick={() => handleBriefSelect(brief)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                                 <h4 className="font-semibold text-gray-900">{brief.title}</h4>
                 <p className="text-sm text-gray-600">Shortlisted: {brief.shortlistedCount}</p>
                 <p className="text-sm text-gray-600">Status: {brief.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

             {/* Step 2: Create Awards */}
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

          {/* Reward Tiers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                         <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Step 2: Create Award Tiers</h3>
               <button 
                 onClick={addRewardTier}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
               >
                 + Add Award Tier
               </button>
             </div>

                         {rewardTiers.length === 0 ? (
               <div className="text-center py-8 text-gray-500">
                 <div className="text-4xl mb-2">🏆</div>
                 <p>No award tiers yet. Click "Add Award Tier" to get started!</p>
               </div>
             ) : (
              <div className="space-y-4">
                {rewardTiers.map((tier, index) => (
                  <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => updateRewardTier(tier.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 1st Place, Best Design, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
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
                            placeholder="Brief description of this award"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeRewardTier(tier.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
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
                 Once you submit these awards, the list of winners will be released to the public. 
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
             <AnimatedNotification
         isVisible={showSuccessNotification}
         onClose={() => setShowSuccessNotification(false)}
         type="success"
         title="Awards Published! 🏆"
         message="The winners have been announced and the awards are now live!"
         icon="🎉"
       />
    </div>
  );
};

export default CreateReward; 