import React, { useState, useEffect } from 'react';

interface Submission {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  submittedAt: string;
  content: string;
  hasStripeAccount?: boolean;
}

interface Winner {
  submissionId: string;
  creatorId: string;
  rewardType: 'cash' | 'credit' | 'prize';
  amount: number;
  description: string;
  prizeDetails?: {
    name?: string;
    description?: string;
    value?: number;
  };
}

interface RewardDistributionResults {
  successful: number;
  failed: number;
  details: string[];
}

interface WinnerSelectionModalProps {
  briefId: string;
  submissions: Submission[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (results: RewardDistributionResults) => void;
}

/**
 * Winner Selection Modal
 * Allows brands to select winners and assign different types of rewards
 */
const WinnerSelectionModal: React.FC<WinnerSelectionModalProps> = ({
  briefId,
  submissions,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedWinners, setSelectedWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedWinners([]);
      setError(null);
    }
  }, [isOpen]);

  // Track scroll position for modal positioning
  const [scrollPosition, setScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    if (isOpen) {
      // Set initial scroll position
      setScrollPosition(window.scrollY);
      // Listen for scroll events
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen]);

  const handleWinnerToggle = (submission: Submission) => {
    const existingWinner = selectedWinners.find(w => w.submissionId === submission.id);
    
    if (existingWinner) {
      // Remove winner
      setSelectedWinners(prev => prev.filter(w => w.submissionId !== submission.id));
    } else {
      // Add winner with default values
      const newWinner: Winner = {
        submissionId: submission.id,
        creatorId: submission.creatorId,
        rewardType: 'cash',
        amount: 0,
        description: `Reward for brief ${briefId}`
      };
      setSelectedWinners(prev => [...prev, newWinner]);
    }
  };

  const updateWinner = (submissionId: string, updates: Partial<Winner>) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.submissionId === submissionId 
          ? { ...winner, ...updates }
          : winner
      )
    );
  };

  const handleDistributeRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate all winners have required data
      for (const winner of selectedWinners) {
        if (winner.rewardType === 'cash' && winner.amount <= 0) {
          throw new Error(`Please set amount for cash reward`);
        }
        if (winner.rewardType === 'credit' && winner.amount <= 0) {
          throw new Error(`Please set amount for credit reward`);
        }
        if (winner.rewardType === 'prize' && (!winner.prizeDetails?.name || !winner.prizeDetails?.description)) {
          throw new Error(`Please provide prize details for prize reward`);
        }
      }

      const response = await fetch('/api/rewards/distribute-with-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefId,
          winners: selectedWinners
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to distribute rewards');
      }

      const results = await response.json();
      onSuccess(results);
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Distribution failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transform: `translateY(${scrollPosition}px)`,
        transition: 'transform 0.1s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{
          maxHeight: '90vh',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Winners & Assign Rewards
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Brief #{briefId} • {submissions.length} submissions
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {submissions.map((submission) => {
              const isSelected = selectedWinners.some(w => w.submissionId === submission.id);
              const winnerData = selectedWinners.find(w => w.submissionId === submission.id);

              return (
                <div key={submission.id} className={`border rounded-lg p-4 ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleWinnerToggle(submission)}
                      className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {submission.creatorName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {submission.hasStripeAccount && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Stripe Connected
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {submission.content.substring(0, 200)}...
                      </p>

                      {/* Reward Configuration */}
                      {isSelected && winnerData && (
                        <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                            Reward Configuration
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Reward Type */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Reward Type
                              </label>
                              <select
                                value={winnerData.rewardType}
                                onChange={(e) => updateWinner(submission.id, { 
                                  rewardType: e.target.value as 'cash' | 'credit' | 'prize' 
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="cash">💰 Cash (Stripe Transfer)</option>
                                <option value="credit">💳 Credit (In-app Balance)</option>
                                <option value="prize">🏆 Prize (Non-cash)</option>
                              </select>
                            </div>

                            {/* Amount (for cash and credit) */}
                            {(winnerData.rewardType === 'cash' || winnerData.rewardType === 'credit') && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Amount ($)
                                </label>
                                <input
                                  type="number"
                                  value={winnerData.amount}
                                  onChange={(e) => updateWinner(submission.id, { 
                                    amount: parseFloat(e.target.value) || 0 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                            )}

                            {/* Prize Details */}
                            {winnerData.rewardType === 'prize' && (
                              <div className="md:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Prize Name
                                    </label>
                                    <input
                                      type="text"
                                      value={winnerData.prizeDetails?.name || ''}
                                      onChange={(e) => updateWinner(submission.id, { 
                                        prizeDetails: { 
                                          ...winnerData.prizeDetails, 
                                          name: e.target.value 
                                        }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g., Gift Card, Product"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Prize Value ($)
                                    </label>
                                    <input
                                      type="number"
                                      value={winnerData.prizeDetails?.value || ''}
                                      onChange={(e) => updateWinner(submission.id, { 
                                        prizeDetails: { 
                                          ...winnerData.prizeDetails, 
                                          value: parseFloat(e.target.value) || 0 
                                        }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Prize Description
                                  </label>
                                  <textarea
                                    value={winnerData.prizeDetails?.description || ''}
                                    onChange={(e) => updateWinner(submission.id, { 
                                      prizeDetails: { 
                                        ...winnerData.prizeDetails, 
                                        description: e.target.value 
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    rows={2}
                                    placeholder="Describe the prize..."
                                  />
                                </div>
                              </div>
                            )}

                            {/* Description */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={winnerData.description}
                                onChange={(e) => updateWinner(submission.id, { 
                                  description: e.target.value 
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Reward description..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {selectedWinners.length} winner{selectedWinners.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDistributeRewards}
                disabled={loading || selectedWinners.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                style={{
                  boxShadow: loading ? 'none' : '0 0 20px rgba(34, 197, 94, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Distributing...
                  </>
                ) : (
                  <>
                    🎉 Distribute Rewards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerSelectionModal;