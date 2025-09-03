import React, { useState, lazy, Suspense } from 'react';
import SimplifiedWinnerSelection from './SimplifiedWinnerSelection';
import DefaultAvatar from './DefaultAvatar';
import RewardProgressBar from './RewardProgressBar';
import { useToast } from '../contexts/ToastContext';

// Lazy load PaymentFlow to prevent Stripe from loading unnecessarily
const ModernPaymentFlow = lazy(() => import('./ModernPaymentFlow'));

interface Submission {
  id: string;
  creatorName: string;
  content: string;
  files?: string;
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

interface RewardFlowManagerProps {
  brief: Brief;
  submissions: Submission[];
  onComplete?: () => void;
}

const RewardFlowManager: React.FC<RewardFlowManagerProps> = ({
  brief,
  submissions,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const { showSuccessToast } = useToast();

  const steps = [
    { id: 1, title: 'Review Submissions', description: 'Review all submitted content' },
    { id: 2, title: 'Select Winners', description: 'Choose the winning submissions' },
    { id: 3, title: 'Process Payments', description: 'Pay rewards to winners' }
  ];

  const handleWinnerSelection = (winners: Winner[]) => {
    setWinners(winners);
    setCurrentStep(3);
  };

  const handlePaymentComplete = () => {
    showSuccessToast('Payment completed successfully!');
    if (onComplete) {
      onComplete();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Review Submissions ({submissions.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {submissions.slice(0, 6).map((submission) => (
                  <div key={submission.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <DefaultAvatar name={submission.creatorName} size="sm" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {submission.creatorName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.creator.userName}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                      {submission.content}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      <span className="font-medium text-emerald-500 dark:text-emerald-400">${submission.amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              {submissions.length > 6 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    +{submissions.length - 6} more submissions
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Continue to Winner Selection
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <SimplifiedWinnerSelection
            submissions={submissions}
            brief={brief}
            onWinnersSelected={handleWinnerSelection}
            onBack={() => setCurrentStep(1)}
          />
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Process Payments
              </h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Selected Winners:</h4>
                <div className="space-y-3">
                  {winners.map((winner) => (
                    <div key={winner.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {winner.position}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {winner.submission.creator.fullName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {winner.submission.creator.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${brief.reward * (1 - (winner.position - 1) * 0.1)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {winner.position === 1 ? '1st Place' : winner.position === 2 ? '2nd Place' : '3rd Place'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  ← Back to Winner Selection
                </button>
                <button
                  onClick={() => setShowPaymentFlow(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Process Payments
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <RewardProgressBar currentStep={currentStep} totalSteps={steps.length} />

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Payment Flow Modal */}
      {showPaymentFlow && winners.length > 0 && (
        <Suspense fallback={<div>Loading payment system...</div>}>
          <ModernPaymentFlow
            brief={brief}
            winners={winners}
            onPaymentComplete={handlePaymentComplete}
            onClose={() => setShowPaymentFlow(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default RewardFlowManager;
