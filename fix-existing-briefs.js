/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingBriefs() {
  try {
    console.log('🔧 Fixing existing briefs...');
    
    // Get all briefs that don't have winnerRewards
    const briefsWithoutRewards = await prisma.brief.findMany({
      where: {
        winnerRewards: {
          none: {}
        }
      },
      include: {
        winnerRewards: true
      }
    });
    
    console.log(`📊 Found ${briefsWithoutRewards.length} briefs without winnerRewards`);
    
    for (const brief of briefsWithoutRewards) {
      console.log(`\n🔧 Processing brief: ${brief.title} (ID: ${brief.id})`);
      console.log(`   Reward: $${brief.reward}, Winners: ${brief.amountOfWinners}`);
      
      // Calculate reward tiers based on amountOfWinners
      const rewardTiers = [];
      const baseReward = brief.reward || 0;
      
      if (brief.amountOfWinners === 1) {
        rewardTiers.push({
          position: 1,
          cashAmount: baseReward,
          creditAmount: 0,
          prizeDescription: '1st Place - 100% of total',
          calculatedAmount: baseReward
        });
      } else if (brief.amountOfWinners === 2) {
        rewardTiers.push({
          position: 1,
          cashAmount: baseReward * 0.6,
          creditAmount: 0,
          prizeDescription: '1st Place - 60% of total',
          calculatedAmount: baseReward * 0.6
        });
        rewardTiers.push({
          position: 2,
          cashAmount: baseReward * 0.4,
          creditAmount: 0,
          prizeDescription: '2nd Place - 40% of total',
          calculatedAmount: baseReward * 0.4
        });
      } else if (brief.amountOfWinners === 3) {
        rewardTiers.push({
          position: 1,
          cashAmount: baseReward * 0.5,
          creditAmount: 0,
          prizeDescription: '1st Place - 50% of total',
          calculatedAmount: baseReward * 0.5
        });
        rewardTiers.push({
          position: 2,
          cashAmount: baseReward * 0.3,
          creditAmount: 0,
          prizeDescription: '2nd Place - 30% of total',
          calculatedAmount: baseReward * 0.3
        });
        rewardTiers.push({
          position: 3,
          cashAmount: baseReward * 0.2,
          creditAmount: 0,
          prizeDescription: '3rd Place - 20% of total',
          calculatedAmount: baseReward * 0.2
        });
      } else {
        // For more than 3 winners, distribute evenly
        const rewardPerWinner = baseReward / brief.amountOfWinners;
        for (let i = 1; i <= brief.amountOfWinners; i++) {
          rewardTiers.push({
            position: i,
            cashAmount: rewardPerWinner,
            creditAmount: 0,
            prizeDescription: `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Place`,
            calculatedAmount: rewardPerWinner
          });
        }
      }
      
      // Create winnerRewards for this brief
      for (const tier of rewardTiers) {
        await prisma.winnerReward.create({
          data: {
            briefId: brief.id,
            position: tier.position,
            cashAmount: tier.cashAmount,
            creditAmount: tier.creditAmount,
            prizeDescription: tier.prizeDescription,
            calculatedAmount: tier.calculatedAmount
          }
        });
      }
      
      console.log(`   ✅ Created ${rewardTiers.length} reward tiers`);
    }
    
    console.log('\n🎉 All existing briefs have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing briefs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingBriefs();
