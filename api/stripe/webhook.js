// Vercel serverless function for Stripe webhook
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    // For now, we'll simulate the webhook processing
    // In a real implementation, you'd verify the session with Stripe
    // eslint-disable-next-line no-console
    console.log('Webhook received for session:', sessionId);

    // Simulate wallet funding
    try {
      // This is a simplified version - in production you'd get the actual session data
      const mockAmount = 1000; // Default amount for testing
      const mockBrandId = 'test-brand-id'; // You'd get this from the session

      // Find or create wallet
      let wallet = await prisma.brandWallet.findUnique({
        where: { brandId: mockBrandId }
      });

      if (!wallet) {
        wallet = await prisma.brandWallet.create({
          data: {
            brandId: mockBrandId,
            balance: 0,
            totalSpent: 0,
            totalDeposited: 0
          }
        });
      }

      await prisma.$transaction(async (tx) => {
        // Update wallet balance
        const updatedWallet = await tx.brandWallet.update({
          where: { brandId: mockBrandId },
          data: {
            balance: { increment: mockAmount },
            totalDeposited: { increment: mockAmount }
          }
        });

        // Create transaction record
        await tx.brandWalletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'deposit',
            amount: mockAmount,
            description: `Wallet funding via Stripe Checkout (Vercel)`,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            referenceId: sessionId
          }
        });
      });

      // eslint-disable-next-line no-console
      console.log(`✅ Vercel webhook wallet funding successful: $${mockAmount} added to brand ${mockBrandId} wallet`);
    } catch (dbError) {
      // eslint-disable-next-line no-console
      console.log('Database error in Vercel webhook:', dbError.message);
    }

    res.json({ received: true, source: 'vercel-webhook' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing Vercel webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};
