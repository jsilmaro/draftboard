import React, { useState, useEffect } from 'react';
import DefaultAvatar from './DefaultAvatar';

interface Submission {
  id: string;
  creatorName: string;
  content: string;
  files?: string;
  submittedAt: string;
  amount: number;
}

interface WinnerReward {
  position: number;
  cashAmount: number;
  creditAmount: number;
  prizeDescription: string;
}

interface Brief {
  id: string;
  title: string;
  amountOfWinners?: number;
  rewardType?: string;
}

interface WinnerSelectionModalProps {
  brief: Brief | null;
  submissions: Submission[];
  isOpen: boolean;
  onClose: () => void;
  onWinnersSelected: (winners: { submissionId: string; position: number }[]) => void;
}

const WinnerSelectionModal: React.FC<WinnerSelectionModalProps> = ({
  brief,
  submissions,
  isOpen,
  onClose,
  onWinnersSelected
}) => {
  const [selectedWinners, setSelectedWinners] = useState<{ submissionId: string; position: number }[]>([]);
  const [winnerRewards, setWinnerRewards] = useState<WinnerReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (brief && isOpen) {
      // Initialize winner rewards based on amount of winners
      const initialRewards: WinnerReward[] = [];
      for (let i = 1; i <= (brief.amountOfWinners || 1); i++) {
        initialRewards.push({
          position: i,
          cashAmount: 0,
          creditAmount: 0,
          prizeDescription: ''
        });
      }
      setWinnerRewards(initialRewards);
      setSelectedWinners([]);
    }
  }, [brief, isOpen]);

  const handleWinnerSelect = (submissionId: string, position: number) => {
    // Remove any existing selection for this position
    const updatedWinners = selectedWinners.filter(w => w.position !== position);
    
    // Remove this submission from any other position
    const finalWinners = updatedWinners.filter(w => w.submissionId !== submissionId);
    
    // Add new selection
    finalWinners.push({ submissionId, position });
    
    setSelectedWinners(finalWinners);
  };

  const handleRewardChange = (position: number, field: keyof WinnerReward, value: string | number) => {
    setWinnerRewards(prev => 
      prev.map(reward => 
        reward.position === position 
          ? { ...reward, [field]: value }
          : reward
      )
    );
  };

  const getSelectedCreator = (position: number) => {
    const winner = selectedWinners.find(w => w.position === position);
    if (!winner) return null;
    return submissions.find(s => s.id === winner.submissionId);
  };

  const handleConfirmSelection = async () => {
    if (selectedWinners.length !== (brief?.amountOfWinners || 1)) {
      alert(`Please select exactly ${brief?.amountOfWinners || 1} winners.`);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brands/briefs/select-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          briefId: brief?.id,
          winners: selectedWinners,
          rewards: winnerRewards
        })
      });

      if (response.ok) {
        onWinnersSelected(selectedWinners);
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to select winners');
      }
    } catch (error) {
      alert('Failed to select winners');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !brief) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Select Winners for &quot;{brief.title}&quot;</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submissions ({submissions.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedWinners.some(w => w.submissionId === submission.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const currentPosition = selectedWinners.find(w => w.submissionId === submission.id)?.position;
                    if (currentPosition) {
                      // Remove selection
                      setSelectedWinners(prev => prev.filter(w => w.submissionId !== submission.id));
                    } else {
                      // Find next available position
                      const usedPositions = selectedWinners.map(w => w.position);
                      const nextPosition = Array.from({ length: brief.amountOfWinners }, (_, i) => i + 1)
                        .find(pos => !usedPositions.includes(pos));
                      if (nextPosition) {
                        handleWinnerSelect(submission.id, nextPosition);
                      }
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <DefaultAvatar name={submission.creatorName} size="sm" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{submission.creatorName}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {submission.content}
                      </p>
                      {selectedWinners.some(w => w.submissionId === submission.id) && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Position {selectedWinners.find(w => w.submissionId === submission.id)?.position}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winner Positions and Rewards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Winner Positions & Rewards
            </h3>
                         <div className="space-y-4">
               {Array.from({ length: brief.amountOfWinners || 1 }, (_, i) => i + 1).map((position) => {
                const selectedCreator = getSelectedCreator(position);
                const reward = winnerRewards.find(r => r.position === position);

                return (
                  <div key={position} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        {position === 1 ? '1st Place' : position === 2 ? '2nd Place' : position === 3 ? '3rd Place' : `${position}th Place`}
                      </h4>
                      {selectedCreator && (
                        <span className="text-sm text-green-600 font-medium">
                          ✓ {selectedCreator.creatorName}
                        </span>
                      )}
                    </div>

                    {selectedCreator ? (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <DefaultAvatar name={selectedCreator.creatorName} size="sm" />
                          <span className="text-sm text-gray-700">{selectedCreator.creatorName}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {selectedCreator.content}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Click on a submission to assign to this position</p>
                      </div>
                    )}

                    {/* Reward Configuration */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">Reward Configuration</h5>
                      
                      {brief.rewardType === 'CASH' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Cash Amount ($)</label>
                          <input
                            type="number"
                            value={reward?.cashAmount || 0}
                            onChange={(e) => handleRewardChange(position, 'cashAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {brief.rewardType === 'CREDIT' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Credit Amount</label>
                          <input
                            type="number"
                            value={reward?.creditAmount || 0}
                            onChange={(e) => handleRewardChange(position, 'creditAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                          />
                        </div>
                      )}

                      {brief.rewardType === 'PRIZES' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Prize Description</label>
                          <textarea
                            value={reward?.prizeDescription || ''}
                            onChange={(e) => handleRewardChange(position, 'prizeDescription', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Describe the prize..."
                            rows={2}
                          />
                        </div>
                      )}

                      {/* Mixed rewards */}
                      {brief.rewardType !== 'CASH' && brief.rewardType !== 'CREDIT' && brief.rewardType !== 'PRIZES' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Cash Amount ($)</label>
                            <input
                              type="number"
                              value={reward?.cashAmount || 0}
                              onChange={(e) => handleRewardChange(position, 'cashAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Credit Amount</label>
                            <input
                              type="number"
                              value={reward?.creditAmount || 0}
                              onChange={(e) => handleRewardChange(position, 'creditAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Prize Description</label>
                            <textarea
                              value={reward?.prizeDescription || ''}
                              onChange={(e) => handleRewardChange(position, 'prizeDescription', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Describe the prize..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedWinners.length !== brief.amountOfWinners || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-[#00FF85] to-[#00C853] text-white rounded-md hover:from-[#00E676] hover:to-[#00BFA5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Selecting Winners...' : `Confirm ${selectedWinners.length}/${brief.amountOfWinners || 1} Winners`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerSelectionModal;
