/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBriefs() {
  try {
    console.log('🔍 Checking database for briefs...');
    
    // Check all briefs
    const allBriefs = await prisma.brief.findMany({
      include: {
        brand: true,
        winnerRewards: true
      }
    });
    
    console.log(`📊 Found ${allBriefs.length} briefs in database:`);
    
    allBriefs.forEach((brief, index) => {
      console.log(`\n${index + 1}. ${brief.title}`);
      console.log(`   Status: ${brief.status}`);
      console.log(`   Brand: ${brief.brand?.companyName || 'Unknown'}`);
      console.log(`   Reward: $${brief.reward}`);
      console.log(`   Amount of Winners: ${brief.amountOfWinners}`);
      console.log(`   Winner Rewards: ${brief.winnerRewards?.length || 0}`);
      console.log(`   Created: ${brief.createdAt}`);
    });
    
    // Check specific statuses
    const publishedBriefs = await prisma.brief.findMany({
      where: { status: 'published' }
    });
    
    const activeBriefs = await prisma.brief.findMany({
      where: { status: 'active' }
    });
    
    console.log(`\n📋 Status breakdown:`);
    console.log(`   Published: ${publishedBriefs.length}`);
    console.log(`   Active: ${activeBriefs.length}`);
    
  } catch (error) {
    console.error('❌ Error checking briefs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBriefs();
