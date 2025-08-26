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

  const handleWinnerSelect = (submissionId: string, position: number) => {
    setSelectedWinners(prev => {
      const filtered = prev.filter(w => w.position !== position);
      return [...filtered, { submissionId, position }];
    });
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Winners
          </h3>
          <button
            onClick={onBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Review
          </button>
        </div>

        {/* Winner Selection Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((position) => {
            const selectedSubmission = getSelectedSubmission(position);
            const rewardAmount = brief.reward * (1 - (position - 1) * 0.1);
            
            return (
              <div key={position} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[200px]">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {position}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {position === 1 ? '1st Place' : position === 2 ? '2nd Place' : '3rd Place'}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
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
                      {selectedSubmission.creator.userName}
                    </p>
                    <button
                      onClick={() => handleWinnerSelect(selectedSubmission.id, position)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Change Selection
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No winner selected</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Available Submissions */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Available Submissions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {submissions.map((submission) => {
              const isSelected = selectedWinners.some(w => w.submissionId === submission.id);
              const selectedPosition = selectedWinners.find(w => w.submissionId === submission.id)?.position;
              
              return (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
                >
                  <div className="flex items-center space-x-3">
                    <DefaultAvatar name={submission.creatorName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate">
                        {submission.creatorName}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {submission.creator.userName}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedPosition}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {submission.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedWinners.length} of {brief.amountOfWinners} winners selected
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
            Confirm Winners
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedWinnerSelection;



