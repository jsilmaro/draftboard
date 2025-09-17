import React, { useState } from 'react';
import StripeIntegration from './StripeIntegration';
import CreatorStripeOnboarding from './CreatorStripeOnboarding';
import WinnerSelectionModal from './WinnerSelectionModal';
import CreatorRewardsDashboard from './CreatorRewardsDashboard';

interface RewardDistributionResults {
  successful: number;
  failed: number;
  details: string[];
}

/**
 * Demo component showing how to integrate Stripe reward system
 * into your existing DraftBoard app
 */
const StripeDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'funding' | 'onboarding' | 'rewards' | 'selection'>('funding');
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Sample data - replace with your actual data
  const sampleBrief = {
    id: 'brief-123',
    title: 'Social Media Campaign',
    amount: 500.00,
    brandId: 'brand-456'
  };

  const sampleCreator = {
    id: 'creator-789',
    email: 'creator@example.com',
    name: 'John Doe'
  };

  const sampleSubmissions = [
    {
      id: 'sub-1',
      creatorId: 'creator-789',
      creatorName: 'John Doe',
      creatorEmail: 'creator@example.com',
      submittedAt: new Date().toISOString(),
      content: 'This is a sample submission for the brief...',
      hasStripeAccount: true
    },
    {
      id: 'sub-2',
      creatorId: 'creator-790',
      creatorName: 'Jane Smith',
      creatorEmail: 'jane@example.com',
      submittedAt: new Date().toISOString(),
      content: 'Another great submission for the campaign...',
      hasStripeAccount: false
    }
  ];

  const handleFundingSuccess = () => {
    alert('Brief funded successfully! 🎉');
  };

  const handleFundingError = (error: string) => {
    alert(`Funding failed: ${error}`);
  };

  const handleOnboardingSuccess = () => {
    alert('Stripe account created successfully!');
  };

  const handleOnboardingError = (error: string) => {
    alert(`Onboarding failed: ${error}`);
  };

  const handleRewardDistribution = (results: RewardDistributionResults) => {
    alert(`Rewards distributed successfully! ${results.successful} successful, ${results.failed} failed.`);
    setShowWinnerModal(false);
  };

  return (
    <div className="stripe-demo">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🎉 Stripe Reward System Integration
        </h1>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'funding', label: '💰 Brand Funding', icon: '💳' },
              { key: 'onboarding', label: '👥 Creator Onboarding', icon: '🔗' },
              { key: 'rewards', label: '🏆 Rewards Dashboard', icon: '📊' },
              { key: 'selection', label: '🎯 Winner Selection', icon: '⭐' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'funding' | 'onboarding' | 'rewards' | 'selection')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {activeTab === 'funding' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Brand Funding with Stripe
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This component allows brands to fund their briefs using Stripe Checkout.
                It integrates with your existing brief system.
              </p>
              
              <StripeIntegration
                briefId={sampleBrief.id}
                amount={sampleBrief.amount}
                brandId={sampleBrief.brandId}
                briefTitle={sampleBrief.title}
                onSuccess={handleFundingSuccess}
                onError={handleFundingError}
              />

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Integration Code:
                </h3>
                <pre className="text-sm text-blue-800 dark:text-blue-300 overflow-x-auto">
{`import StripeIntegration from './components/StripeIntegration';

<StripeIntegration
  briefId={brief.id}
  amount={brief.reward}
  brandId={brand.id}
  briefTitle={brief.title}
  onSuccess={() => console.log('Funded!')}
  onError={(error) => console.error(error)}
/>`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'onboarding' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Creator Stripe Onboarding
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This component allows creators to connect their Stripe accounts
                to receive cash rewards directly.
              </p>
              
              <CreatorStripeOnboarding
                onComplete={handleOnboardingSuccess}
                onCancel={() => handleOnboardingError('Onboarding cancelled')}
              />

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Integration Code:
                </h3>
                <pre className="text-sm text-blue-800 dark:text-blue-300 overflow-x-auto">
{`import CreatorStripeOnboarding from './components/CreatorStripeOnboarding';

<CreatorStripeOnboarding
  creatorId={creator.id}
  creatorEmail={creator.email}
  creatorName={creator.fullName}
  onSuccess={(accountId) => console.log('Connected!')}
  onError={(error) => console.error(error)}
/>`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Creator Rewards Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This component shows creators their reward history, credit balance,
                and allows them to redeem credits for cash.
              </p>
              
              <CreatorRewardsDashboard creatorId={sampleCreator.id} />

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Integration Code:
                </h3>
                <pre className="text-sm text-blue-800 dark:text-blue-300 overflow-x-auto">
{`import CreatorRewardsDashboard from './components/CreatorRewardsDashboard';

<CreatorRewardsDashboard creatorId={creator.id} />`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'selection' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Winner Selection & Reward Distribution
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This component allows brands to select winners and distribute
                different types of rewards (cash, credit, or prizes).
              </p>
              
              <button
                onClick={() => setShowWinnerModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
                style={{
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Select Winners & Distribute Rewards
              </button>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Integration Code:
                </h3>
                <pre className="text-sm text-blue-800 dark:text-blue-300 overflow-x-auto">
{`import WinnerSelectionModal from './components/WinnerSelectionModal';

<WinnerSelectionModal
  briefId={brief.id}
  submissions={submissions}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(results) => console.log('Rewards distributed!')}
/>`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Winner Selection Modal */}
        <WinnerSelectionModal
          briefId={sampleBrief.id}
          submissions={sampleSubmissions}
          isOpen={showWinnerModal}
          onClose={() => setShowWinnerModal(false)}
          onSuccess={handleRewardDistribution}
        />

        {/* Integration Instructions */}
        <div className="mt-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Ready to Integrate?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Backend Setup:</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Stripe routes added to server</li>
                <li>✅ Database schema updated</li>
                <li>✅ Webhook handlers implemented</li>
                <li>✅ Reward distribution system ready</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Frontend Components:</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ StripeIntegration for funding</li>
                <li>✅ CreatorStripeOnboarding</li>
                <li>✅ CreatorRewardsDashboard</li>
                <li>✅ WinnerSelectionModal</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white/20 rounded-lg">
            <p className="text-sm">
              <strong>Next Steps:</strong> Add your Stripe API keys to environment variables,
              run database migrations, and integrate these components into your existing pages!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeDemo;


