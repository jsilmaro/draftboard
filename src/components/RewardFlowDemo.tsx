import React, { useState } from 'react';
import RewardFlowManager from './RewardFlowManager';
import { useToast } from '../contexts/ToastContext';

// Mock data for demonstration
const mockBrief = {
  id: 'brief-1',
  title: 'Design a Modern Logo for Tech Startup',
  reward: 1000,
  amountOfWinners: 3
};

const mockSubmissions = [
  {
    id: 'sub-1',
    creatorName: 'Sarah Johnson',
    content: 'I created a minimalist logo design that represents innovation and growth. The design uses a modern geometric approach with a subtle gradient that gives it a professional yet approachable feel.',
    files: 'logo-design.ai, mockup.png',
    submittedAt: '2024-01-15T10:30:00Z',
    amount: 1000,
    creator: {
      id: 'creator-1',
      userName: 'sarahdesigns',
      fullName: 'Sarah Johnson',
      email: 'sarah@example.com'
    }
  },
  {
    id: 'sub-2',
    creatorName: 'Mike Chen',
    content: 'My design focuses on the tech aspect with clean lines and a bold color palette. The logo is scalable and works well across all platforms and sizes.',
    files: 'tech-logo.svg, variations.pdf',
    submittedAt: '2024-01-14T15:45:00Z',
    amount: 1000,
    creator: {
      id: 'creator-2',
      userName: 'mikechen',
      fullName: 'Mike Chen',
      email: 'mike@example.com'
    }
  },
  {
    id: 'sub-3',
    creatorName: 'Emma Rodriguez',
    content: 'I approached this with a fresh perspective, creating a logo that combines technology and human connection. The design is memorable and distinctive.',
    files: 'logo-concept.psd, brand-guidelines.pdf',
    submittedAt: '2024-01-13T09:20:00Z',
    amount: 1000,
    creator: {
      id: 'creator-3',
      userName: 'emmarodriguez',
      fullName: 'Emma Rodriguez',
      email: 'emma@example.com'
    }
  },
  {
    id: 'sub-4',
    creatorName: 'David Kim',
    content: 'My design emphasizes simplicity and recognition. The logo is built to last and can evolve with the company as it grows.',
    files: 'simple-logo.ai, applications.jpg',
    submittedAt: '2024-01-12T14:15:00Z',
    amount: 1000,
    creator: {
      id: 'creator-4',
      userName: 'davidkim',
      fullName: 'David Kim',
      email: 'david@example.com'
    }
  },
  {
    id: 'sub-5',
    creatorName: 'Lisa Wang',
    content: 'I created a dynamic logo that represents movement and progress. The design is modern and captures the energy of a startup environment.',
    files: 'dynamic-logo.eps, animations.gif',
    submittedAt: '2024-01-11T11:30:00Z',
    amount: 1000,
    creator: {
      id: 'creator-5',
      userName: 'lisawang',
      fullName: 'Lisa Wang',
      email: 'lisa@example.com'
    }
  },
  {
    id: 'sub-6',
    creatorName: 'Alex Thompson',
    content: 'My approach was to create something timeless yet contemporary. The logo works across all mediums and maintains its impact.',
    files: 'timeless-logo.png, mockups.zip',
    submittedAt: '2024-01-10T16:45:00Z',
    amount: 1000,
    creator: {
      id: 'creator-6',
      userName: 'alexthompson',
      fullName: 'Alex Thompson',
      email: 'alex@example.com'
    }
  }
];

const RewardFlowDemo: React.FC = () => {
  const [showFlow, setShowFlow] = useState(false);
  const { showSuccessToast } = useToast();

  const handleFlowComplete = () => {
    showSuccessToast('Reward flow completed successfully! 🎉');
    setShowFlow(false);
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showFlow ? (
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Reward & Payment Flow Demo
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Experience our comprehensive reward and payment system designed to streamline the process from submission review to winner payment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-900 rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
            </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Review Submissions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse through all submitted content with detailed previews and creator information.
                </p>
      </div>

              <div className="bg-gray-900 rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select Winners
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose the best submissions and assign positions with automatic reward calculations.
                </p>
            </div>

              <div className="bg-gray-900 rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Process Payments
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure payment processing through Stripe with immediate reward distribution.
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-8 shadow-sm max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Demo Brief Information
              </h2>
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Brief Title:</h3>
                  <p className="text-gray-600 dark:text-gray-400">{mockBrief.title}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Total Reward:</h3>
                  <p className="text-emerald-500 dark:text-emerald-400 font-semibold">${mockBrief.reward}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Submissions Received:</h3>
                  <p className="text-gray-600 dark:text-gray-400">{mockSubmissions.length} submissions</p>
              </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Winners to Select:</h3>
                  <p className="text-gray-600 dark:text-gray-400">{mockBrief.amountOfWinners} winners</p>
              </div>
            </div>
            </div>

              <button
              onClick={() => setShowFlow(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
              >
              Start Reward Flow Demo
              </button>
            </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reward Flow Demo
              </h1>
              <button
                onClick={() => setShowFlow(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                ← Back to Demo Overview
              </button>
            </div>

            <RewardFlowManager
              brief={mockBrief}
              submissions={mockSubmissions}
              onComplete={handleFlowComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardFlowDemo;



