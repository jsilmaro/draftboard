import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface Submission {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
}

interface Brief {
  id: string;
  title: string;
  description: string;
  reward: number;
  isFunded: boolean;
  fundedAt: string;
  submissions: Submission[];
  _count: {
    submissions: number;
  };
}

interface WinnerSelectionFlowProps {
  brief: Brief;
  onClose: () => void;
  onWinnerSelected?: () => void;
}

const WinnerSelectionFlow: React.FC<WinnerSelectionFlowProps> = ({
  brief,
  onClose,
  onWinnerSelected
}) => {
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [rewardAmount, setRewardAmount] = useState<number>(brief.reward);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

  // Calculate total reward to distribute
  const totalReward = selectedWinners.length * rewardAmount;
  const platformFee = totalReward * 0.05; // 5% platform fee
  const netAmount = totalReward - platformFee;

  const handleWinnerToggle = (submissionId: string) => {
    setSelectedWinners(prev => 
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleTransferToWinner = async (submissionId: string) => {
    try {
      setTransferring(submissionId);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/stripe/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: submissionId,
          amount: rewardAmount,
          description: `Winner reward for brief: ${brief.title}`
        })
      });

      if (response.ok) {
        await response.json();
        showSuccessToast(`Reward of $${rewardAmount} transferred successfully!`);
        
        // Remove from selected winners
        setSelectedWinners(prev => prev.filter(id => id !== submissionId));
        
        // Refresh the brief data
        if (onWinnerSelected) {
          onWinnerSelected();
        }
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || 'Failed to transfer reward');
      }
    } catch (error) {
      showErrorToast('Failed to transfer reward');
    } finally {
      setTransferring(null);
    }
  };

  const handleTransferAll = async () => {
    if (selectedWinners.length === 0) {
      showErrorToast('Please select at least one winner');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const submissionId of selectedWinners) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/stripe/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            submissionId: submissionId,
            amount: rewardAmount,
            description: `Winner reward for brief: ${brief.title}`
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      showSuccessToast(`Successfully transferred rewards to ${successCount} winner(s)`);
      setSelectedWinners([]);
      
      if (onWinnerSelected) {
        onWinnerSelected();
      }
    }

    if (errorCount > 0) {
      showErrorToast(`Failed to transfer ${errorCount} reward(s)`);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select Winners - {brief.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {brief.submissions.length} submissions • Funded: ${brief.reward}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Funding Status */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Brief Successfully Funded</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Funded on: {new Date(brief.fundedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Reward Configuration */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">Reward Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Reward per Winner ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-blue-800 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Selected Winners:</span> {selectedWinners.length}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Total Reward:</span> ${totalReward.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-end">
                <div className="text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Platform Fee (5%):</span> ${platformFee.toFixed(2)}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Net to Creators:</span> ${netAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="mb-6 max-h-96 overflow-y-auto">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Submissions ({brief.submissions.length})
            </h4>
            <div className="space-y-3">
              {brief.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 border rounded-lg ${
                    selectedWinners.includes(submission.id)
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedWinners.includes(submission.id)}
                          onChange={() => handleWinnerToggle(submission.id)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {submission.title}
                        </h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          submission.status === 'winner'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        by {submission.creator.fullName} (@{submission.creator.userName})
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {submission.content}
                      </p>
                    </div>
                    
                    {selectedWinners.includes(submission.id) && submission.status !== 'winner' && (
                      <button
                        onClick={() => handleTransferToWinner(submission.id)}
                        disabled={transferring === submission.id}
                        className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {transferring === submission.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Transferring...
                          </div>
                        ) : (
                          `Transfer $${rewardAmount}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedWinners.length > 0 && (
                <p>
                  {selectedWinners.length} winner(s) selected • Total: ${totalReward.toFixed(2)} • Net: ${netAmount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedWinners.length > 0 && (
                <button
                  onClick={handleTransferAll}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Transferring All...
                    </div>
                  ) : (
                    `Transfer All (${selectedWinners.length})`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerSelectionFlow;

