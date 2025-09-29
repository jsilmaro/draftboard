import React, { useState, useEffect, useCallback } from 'react';

interface RewardTier {
  id?: string;
  tierNumber: number;
  name: string;
  description: string;
  amount: number;
  position: number;
  isActive: boolean;
}

interface RewardTierManagerProps {
  tiers: RewardTier[];
  onTiersChange: (tiers: RewardTier[]) => void;
  isDark: boolean;
  disabled?: boolean;
  totalRewardAmount: number;
  amountOfWinners: number;
}

const RewardTierManager: React.FC<RewardTierManagerProps> = ({ 
  tiers, 
  onTiersChange, 
  isDark, 
  // disabled = false,
  totalRewardAmount,
  amountOfWinners
}) => {
  const [localTiers, setLocalTiers] = useState<RewardTier[]>(tiers);

  // Initialize local tiers only once
  useEffect(() => {
    if (tiers && tiers.length > 0) {
      setLocalTiers(tiers);
    }
  }, [tiers]); // Include tiers dependency

  const getDistributionPercentages = (winners: number): number[] => {
    // Fair distribution based on number of winners
    if (winners === 1) return [1.0];
    if (winners === 2) return [0.6, 0.4]; // 60% first, 40% second
    if (winners === 3) return [0.5, 0.3, 0.2]; // 50%, 30%, 20%
    if (winners === 4) return [0.4, 0.3, 0.2, 0.1]; // 40%, 30%, 20%, 10%
    if (winners === 5) return [0.35, 0.25, 0.2, 0.15, 0.05]; // 35%, 25%, 20%, 15%, 5%
    
    // For more than 5 winners, use a more gradual distribution
    const percentages: number[] = [];
    const basePercentage = 0.4; // First place gets 40%
    const remainingPercentage = 0.6; // Remaining 60% distributed among others
    
    percentages.push(basePercentage);
    
    for (let i = 1; i < winners; i++) {
      const remainingWinners = winners - 1;
      const percentage = remainingPercentage / remainingWinners;
      percentages.push(percentage);
    }
    
    return percentages;
  };

  const getTierName = (position: number): string => {
    const names = ['1st Place', '2nd Place', '3rd Place', '4th Place', '5th Place'];
    if (position <= names.length) {
      return names[position - 1];
    }
    return `${position}th Place`;
  };

  const generateAutoTiers = useCallback((totalAmount: number, winners: number): RewardTier[] => {
    const tiers: RewardTier[] = [];
    
    // Safety checks
    if (!totalAmount || totalAmount <= 0 || !winners || winners <= 0) {
      return tiers;
    }
    
    // Define distribution percentages based on number of winners
    const distributions = getDistributionPercentages(winners);
    
    for (let i = 0; i < winners; i++) {
      const percentage = distributions[i] || 0;
      const amount = Math.round((totalAmount * percentage) * 100) / 100; // Round to 2 decimal places
      
      tiers.push({
        tierNumber: i + 1,
        name: getTierName(i + 1),
        description: `${Math.round(percentage * 100)}% of total reward`,
        amount: amount,
        position: i + 1,
        isActive: true
      });
    }
    
    return tiers;
  }, []);

  // Auto-generate reward tiers based on total amount and number of winners
  useEffect(() => {
    if (totalRewardAmount > 0 && amountOfWinners > 0) {
      const autoTiers = generateAutoTiers(totalRewardAmount, amountOfWinners);
      setLocalTiers(autoTiers);
      onTiersChange(autoTiers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRewardAmount, amountOfWinners, generateAutoTiers]);

  // Auto-generated tiers are read-only, no manual management needed

  const calculateTotalBudget = () => {
    return localTiers.reduce((total, tier) => total + Number(tier.amount || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Auto-Generated Reward Tiers
        </h3>
      </div>

      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Reward tiers are automatically distributed based on your total reward amount and number of winners. The distribution ensures fair allocation across all positions.
      </div>

      {localTiers.length === 0 && (
        <div className={`text-center py-8 border-2 border-dashed rounded-lg ${
          isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
        }`}>
          <p>No reward tiers generated yet.</p>
          <p className="text-sm mt-1">Set total reward amount and number of winners to auto-generate tiers.</p>
        </div>
      )}

      {localTiers && localTiers.length > 0 && localTiers.map((tier, index) => (
        <div
          key={index}
          className={`border rounded-lg p-4 ${
            isDark 
              ? 'border-gray-700 bg-gray-800/50' 
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {tier.tierNumber}
              </div>
              <div>
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tier.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                ${Number(tier.amount || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}

      {localTiers.length > 0 && (
        <div className={`mt-6 p-4 rounded-lg ${
          isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Total Budget:
            </span>
            <span className={`text-xl font-bold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              ${Number(calculateTotalBudget()).toFixed(2)}
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            This is the total amount that will be charged when you fund the brief.
          </p>
        </div>
      )}
    </div>
  );
};

export default RewardTierManager;
