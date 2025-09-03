import React, { useState } from 'react';
import DefaultAvatar from './DefaultAvatar';

interface Submission {
  id: string;
  creatorName: string;
  content: string;
  submittedAt: string;
  amount: number;
  creator: {
    id: string;
    userName: string;
    fullName: string;
    email: string;
  };
}

interface Brief {
  id: string;
  title: string;
  reward: number;
  amountOfWinners: number;
}

interface Winner {
  id: string;
  submissionId: string;
  creatorId: string;
  position: number;
  rewardId?: string;
  submission: {
    creator: {
      fullName: string;
      email: string;
    };
  };
}

interface SimplifiedWinnerSelectionProps {
  submissions: Submission[];
  brief: Brief;
  onWinnersSelected: (winners: Winner[]) => void;
  onBack: () => void;
}

const SimplifiedWinnerSelection: React.FC<SimplifiedWinnerSelectionProps> = ({
  submissions,
  brief,
  onWinnersSelected,
  onBack
}) => {
  const [selectedWinners, setSelectedWinners] = useState<{ submissionId: string; position: number }[]>([]);
  const [hoveredSubmission, setHoveredSubmission] = useState<string | null>(null);

  const handleWinnerSelect = (submissionId: string, position: number) => {
    setSelectedWinners(prev => {
      const filtered = prev.filter(w => w.position !== position);
      return [...filtered, { submissionId, position }];
    });
  };

  const handleWinnerRemove = (position: number) => {
    setSelectedWinners(prev => prev.filter(w => w.position !== position));
  };

  const handleConfirmWinners = () => {
    const winners: Winner[] = selectedWinners.map((winner, index) => ({
      id: `winner-${index}`,
      submissionId: winner.submissionId,
      creatorId: submissions.find(s => s.id === winner.submissionId)?.creator.id || '',
      position: winner.position,
      submission: {
        creator: {
          fullName: submissions.find(s => s.id === winner.submissionId)?.creator.fullName || '',
          email: submissions.find(s => s.id === winner.submissionId)?.creator.email || ''
        }
      }
    }));
    
    onWinnersSelected(winners);
  };

  const getSelectedSubmission = (position: number) => {
    const winner = selectedWinners.find(w => w.position === position);
    return submissions.find(s => s.id === winner?.submissionId);
  };

  const getRewardAmount = (position: number) => {
    return brief.reward * (1 - (position - 1) * 0.1);
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return { label: '1st Place', color: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-600 dark:text-yellow-400' };
      case 2: return { label: '2nd Place', color: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' };
      case 3: return { label: '3rd Place', color: 'bg-orange-100 dark:bg-orange-900', textColor: 'text-orange-600 dark:text-orange-400' };
      default: return { label: `${position}th Place`, color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-400' };
    }
  };

  const totalRewardAmount = selectedWinners.reduce((sum, winner) => {
    return sum + getRewardAmount(winner.position);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Winners
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose the best submissions for your brief
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Review
          </button>
        </div>

        {/* Winner Selection Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((position) => {
            const selectedSubmission = getSelectedSubmission(position);
            const rewardAmount = getRewardAmount(position);
            const positionInfo = getPositionLabel(position);
            
            return (
              <div key={position} className={`border-2 border-dashed rounded-lg p-4 min-h-[220px] transition-all ${
                selectedSubmission 
                  ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}>
                <div className="text-center mb-4">
                  <div className={`w-12 h-12 ${positionInfo.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <span className={`text-lg font-bold ${positionInfo.textColor}`}>
                      {position}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {positionInfo.label}
                  </h4>
                  <p className="text-sm text-emerald-500 dark:text-emerald-400 font-medium">
                    ${rewardAmount.toFixed(2)}
                  </p>
                </div>

                {selectedSubmission ? (
                  <div className="text-center">
                    <DefaultAvatar name={selectedSubmission.creatorName} size="md" />
                    <p className="font-medium text-gray-900 dark:text-white mt-2">
                      {selectedSubmission.creatorName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{selectedSubmission.creator.userName}
                    </p>
                    <div className="mt-2 space-y-1">
                      <button
                        onClick={() => handleWinnerRemove(position)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm">Select a winner</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Available Submissions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Available Submissions ({submissions.length})
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Click to assign to a position
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {submissions.map((submission) => {
              const isSelected = selectedWinners.some(w => w.submissionId === submission.id);
              const selectedPosition = selectedWinners.find(w => w.submissionId === submission.id)?.position;
              const positionInfo = selectedPosition ? getPositionLabel(selectedPosition) : null;
              
              return (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : hoveredSubmission === submission.id
                      ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => {
                    if (!isSelected) {
                      // Find next available position
                      const usedPositions = selectedWinners.map(w => w.position);
                      const nextPosition = [1, 2, 3].find(pos => !usedPositions.includes(pos));
                      if (nextPosition) {
                        handleWinnerSelect(submission.id, nextPosition);
                      }
                    }
                  }}
                  onMouseEnter={() => setHoveredSubmission(submission.id)}
                  onMouseLeave={() => setHoveredSubmission(null)}
                >
                  <div className="flex items-center space-x-3">
                    <DefaultAvatar name={submission.creatorName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate">
                        {submission.creatorName}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{submission.creator.userName}
                      </p>
                    </div>
                    {isSelected && (
                      <div className={`w-6 h-6 ${positionInfo?.color} rounded-full flex items-center justify-center`}>
                        <span className={`text-white text-xs font-bold ${positionInfo?.textColor}`}>{selectedPosition}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {submission.content}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    <span className="font-medium text-emerald-500 dark:text-emerald-400">${submission.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary and Action Buttons */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWinners.length} of {brief.amountOfWinners} winners selected
              </p>
              {selectedWinners.length > 0 && (
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  Total Reward Amount: <span className="text-emerald-500 dark:text-emerald-400">${totalRewardAmount.toFixed(2)}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleConfirmWinners}
              disabled={selectedWinners.length < brief.amountOfWinners}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedWinners.length >= brief.amountOfWinners
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedWinners.length >= brief.amountOfWinners ? 'Confirm Winners' : `Select ${brief.amountOfWinners - selectedWinners.length} more`}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h5 className="font-medium text-blue-900 dark:text-blue-100">How to select winners:</h5>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                <li>• Click on any submission to assign it to the next available position</li>
                <li>• 1st place gets 100% of the reward, 2nd place gets 90%, 3rd place gets 80%</li>
                <li>• You can change selections by clicking &quot;Remove&quot; and selecting a different submission</li>
                <li>• All positions must be filled before proceeding to payment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedWinnerSelection;



