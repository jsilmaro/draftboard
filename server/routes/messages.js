const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Get user ID from JWT token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded.userId; // Support both formats
  } catch (error) {
    return null;
  }
};

// Get conversations for a user
router.get('/conversations', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Get participant details for each conversation
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const otherParticipantType = conv.participant1Id === userId ? conv.participant2Type : conv.participant1Type;
      const lastMessage = conv.messages[0];
      
      // Get other participant details
      let participantDetails = {};
      if (otherParticipantType === 'brand') {
        const brand = await prisma.brand.findUnique({
          where: { id: otherParticipantId },
          select: { companyName: true, email: true }
        });
        participantDetails = {
          name: brand?.companyName || 'Unknown Brand',
          handle: brand?.email ? `@${brand.email.split('@')[0]}` : '@unknown',
          avatar: brand?.companyName?.charAt(0).toUpperCase() || 'U'
        };
      } else {
        const creator = await prisma.creator.findUnique({
          where: { id: otherParticipantId },
          select: { fullName: true, userName: true }
        });
        participantDetails = {
          name: creator?.fullName || 'Unknown Creator',
          handle: creator?.userName ? `@${creator.userName}` : '@unknown',
          avatar: creator?.fullName?.charAt(0).toUpperCase() || 'U'
        };
      }
      
      return {
        id: conv.id,
        name: participantDetails.name,
        handle: participantDetails.handle,
        avatar: participantDetails.avatar,
        lastMessage: lastMessage?.content || '',
        timestamp: lastMessage?.createdAt ? formatTimestamp(lastMessage.createdAt) : '',
        unread: !lastMessage?.isRead && lastMessage?.senderId !== userId,
        type: otherParticipantType
      };
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const otherParticipantId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
    const otherParticipantType = conversation.participant1Id === userId ? conversation.participant2Type : conversation.participant1Type;
    
    // Get other participant details
    let conversationInfo = {};
    if (otherParticipantType === 'brand') {
      const brand = await prisma.brand.findUnique({
        where: { id: otherParticipantId },
        select: { companyName: true, email: true }
      });
      conversationInfo = {
        participantName: brand?.companyName || 'Unknown Brand',
        participantHandle: brand?.email ? `@${brand.email.split('@')[0]}` : '@unknown',
        participantType: 'brand'
      };
    } else {
      const creator = await prisma.creator.findUnique({
        where: { id: otherParticipantId },
        select: { fullName: true, userName: true }
      });
      conversationInfo = {
        participantName: creator?.fullName || 'Unknown Creator',
        participantHandle: creator?.userName ? `@${creator.userName}` : '@unknown',
        participantType: 'creator'
      };
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ 
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        type: msg.type
      })),
      conversationInfo
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a new message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get other participant details
    const otherParticipantId = conversation.participant1Id === userId 
      ? conversation.participant2Id 
      : conversation.participant1Id;
    const otherParticipantType = conversation.participant1Id === userId 
      ? conversation.participant2Type 
      : conversation.participant1Type;

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type: type.toUpperCase(),
        senderId: userId,
        receiverId: otherParticipantId,
        senderType: conversation.participant1Id === userId ? conversation.participant1Type : conversation.participant2Type,
        receiverType: otherParticipantType,
        conversationId: conversationId
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date()
      }
    });

    res.json({ 
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
        type: message.type
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new conversation
router.post('/conversations', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: userId,
            participant2Id: participantId
          },
          {
            participant1Id: participantId,
            participant2Id: userId
          }
        ]
      }
    });

    if (existingConversation) {
      return res.json({ conversationId: existingConversation.id });
    }

    // Get user types by checking Brand and Creator tables
    let currentUserType = null;
    const currentBrand = await prisma.brand.findUnique({ where: { id: userId } });
    if (currentBrand) {
      currentUserType = 'brand';
    } else {
      const currentCreator = await prisma.creator.findUnique({ where: { id: userId } });
      if (currentCreator) {
        currentUserType = 'creator';
      }
    }

    let otherUserType = null;
    const otherBrand = await prisma.brand.findUnique({ where: { id: participantId } });
    if (otherBrand) {
      otherUserType = 'brand';
    } else {
      const otherCreator = await prisma.creator.findUnique({ where: { id: participantId } });
      if (otherCreator) {
        otherUserType = 'creator';
      }
    }

    if (!currentUserType || !otherUserType) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: userId,
        participant2Id: participantId,
        participant1Type: currentUserType,
        participant2Type: otherUserType
      }
    });

    res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to format timestamp
function formatTimestamp(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

module.exports = router;
