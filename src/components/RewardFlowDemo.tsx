import React, { useState } from 'react';
import RewardFlowManager from './RewardFlowManager';

const RewardFlowDemo: React.FC = () => {
  const [showFlow, setShowFlow] = useState(false);

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
      creatorName: 'Alex Johnson',
      content: 'I created a minimalist logo design that represents innovation and growth. The design uses a modern geometric approach with a color palette that conveys trust and professionalism.',
      submittedAt: '2024-01-15T10:30:00Z',
      amount: 1000,
      creator: {
        id: 'creator-1',
        userName: 'alexdesigns',
        fullName: 'Alex Johnson',
        email: 'alex@example.com'
      }
    },
    {
      id: 'sub-2',
      creatorName: 'Sarah Chen',
      content: 'My design focuses on the startup\'s core values of creativity and technology. I used a bold, contemporary style with clean typography that will scale well across different platforms.',
      submittedAt: '2024-01-14T15:45:00Z',
      amount: 1000,
      creator: {
        id: 'creator-2',
        userName: 'sarahcreative',
        fullName: 'Sarah Chen',
        email: 'sarah@example.com'
      }
    },
    {
      id: 'sub-3',
      creatorName: 'Mike Rodriguez',
      content: 'I designed a logo that combines traditional business elements with modern tech aesthetics. The design is versatile and works well in both digital and print formats.',
      submittedAt: '2024-01-13T09:20:00Z',
      amount: 1000,
      creator: {
        id: 'creator-3',
        userName: 'mikedesign',
        fullName: 'Mike Rodriguez',
        email: 'mike@example.com'
      }
    },
    {
      id: 'sub-4',
      creatorName: 'Emma Wilson',
      content: 'My approach was to create something memorable and distinctive. The logo design incorporates subtle tech elements while maintaining a professional appearance.',
      submittedAt: '2024-01-12T14:15:00Z',
      amount: 1000,
      creator: {
        id: 'creator-4',
        userName: 'emmadesigns',
        fullName: 'Emma Wilson',
        email: 'emma@example.com'
      }
    },
    {
      id: 'sub-5',
      creatorName: 'David Kim',
      content: 'I focused on creating a logo that tells a story about the company\'s journey. The design elements represent growth, innovation, and the future of technology.',
      submittedAt: '2024-01-11T11:30:00Z',
      amount: 1000,
      creator: {
        id: 'creator-5',
        userName: 'davidkim',
        fullName: 'David Kim',
        email: 'david@example.com'
      }
    },
    {
      id: 'sub-6',
      creatorName: 'Lisa Thompson',
      content: 'My design emphasizes the startup\'s unique position in the market. I used a combination of modern and classic design principles to create something timeless.',
      submittedAt: '2024-01-10T16:45:00Z',
      amount: 1000,
      creator: {
        id: 'creator-6',
        userName: 'lisadesign',
        fullName: 'Lisa Thompson',
        email: 'lisa@example.com'
      }
    }
  ];

  if (showFlow) {
    return (
      <RewardFlowManager
        brief={mockBrief}
        submissions={mockSubmissions}
        onComplete={() => setShowFlow(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Reward & Payment Flow Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Experience the complete reward and payment system with Stripe integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Review Submissions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review all submitted content from creators
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select Winners</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose the winning submissions with positions
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Process Payments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pay rewards securely with Stripe integration
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Demo Brief Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Brief Title</p>
              <p className="font-medium text-gray-900 dark:text-white">{mockBrief.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reward</p>
              <p className="font-medium text-green-600 dark:text-green-400">${mockBrief.reward}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Number of Winners</p>
              <p className="font-medium text-gray-900 dark:text-white">{mockBrief.amountOfWinners}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Submissions Received</p>
              <p className="font-medium text-gray-900 dark:text-white">{mockSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowFlow(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
          >
            Start Reward Flow Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardFlowDemo;



