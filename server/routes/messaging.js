const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { prisma } = require('../prisma');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    console.log('📨 Fetching conversations for user:', req.user);
    const userId = req.user.id;

    // Get conversations where user is either participant1 or participant2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format conversations for frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      let participant1, participant2;
      
      // Get participant details based on their type
      if (conv.participant1Type === 'brand') {
        const brand = await prisma.brand.findUnique({
          where: { id: conv.participant1Id },
          select: { id: true, companyName: true, contactName: true, logo: true }
        });
        participant1 = {
          id: brand.id,
          name: brand.companyName,
          type: 'brand',
          avatar: brand.logo
        };
      } else {
        const creator = await prisma.creator.findUnique({
          where: { id: conv.participant1Id },
          select: { id: true, userName: true, fullName: true }
        });
        participant1 = {
          id: creator.id,
          name: creator.userName,
          type: 'creator',
          avatar: null // Creator model doesn't have avatar field
        };
      }

      if (conv.participant2Type === 'brand') {
        const brand = await prisma.brand.findUnique({
          where: { id: conv.participant2Id },
          select: { id: true, companyName: true, contactName: true, logo: true }
        });
        participant2 = {
          id: brand.id,
          name: brand.companyName,
          type: 'brand',
          avatar: brand.logo
        };
      } else {
        const creator = await prisma.creator.findUnique({
          where: { id: conv.participant2Id },
          select: { id: true, userName: true, fullName: true }
        });
        participant2 = {
          id: creator.id,
          name: creator.userName,
          type: 'creator',
          avatar: null // Creator model doesn't have avatar field
        };
      }
      
      return {
        id: conv.id,
        participant1,
        participant2,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt
      };
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get available users for starting new conversations
router.get('/available-users', authenticateToken, async (req, res) => {
  try {
    console.log('👥 Fetching available users for user:', req.user);
    const userId = req.user.id;
    const userType = req.user.type;

    let availableUsers = [];

    if (userType === 'brand') {
      // If current user is a brand, show creators
      const creators = await prisma.creator.findMany({
        where: {
          id: { not: userId }
        },
        select: {
          id: true,
          userName: true,
          email: true,
          fullName: true
        },
        orderBy: { userName: 'asc' }
      });
      
      availableUsers = creators.map(creator => ({
        id: creator.id,
        name: creator.userName,
        email: creator.email,
        fullName: creator.fullName,
        userName: creator.userName,
        type: 'creator',
        avatar: null // Creator model doesn't have avatar field
      }));
    } else {
      // If current user is a creator, show brands
      const brands = await prisma.brand.findMany({
        where: {
          id: { not: userId }
        },
        select: {
          id: true,
          companyName: true,
          email: true,
          contactName: true,
          logo: true
        },
        orderBy: { companyName: 'asc' }
      });
      
      availableUsers = brands.map(brand => ({
        id: brand.id,
        name: brand.companyName,
        email: brand.email,
        fullName: brand.contactName,
        userName: brand.companyName,
        type: 'brand',
        avatar: brand.logo // Brand model uses 'logo' field
      }));
    }

    res.json(availableUsers);
  } catch (error) {
    console.error('❌ Error fetching available users:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to fetch available users' });
  }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { receiverId, initialMessage } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !initialMessage) {
      return res.status(400).json({ error: 'Receiver ID and initial message are required' });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: senderId, participant2Id: receiverId },
          { participant1Id: receiverId, participant2Id: senderId }
        ]
      }
    });

    if (existingConversation) {
      return res.status(400).json({ error: 'Conversation already exists' });
    }

    // Determine receiver type by checking both Brand and Creator tables
    let receiverType = null;
    let receiver = null;
    
    const brandReceiver = await prisma.brand.findUnique({
      where: { id: receiverId },
      select: { id: true, companyName: true, contactName: true, logo: true }
    });
    
    if (brandReceiver) {
      receiverType = 'brand';
      receiver = {
        id: brandReceiver.id,
        name: brandReceiver.companyName,
        type: 'brand',
        avatar: brandReceiver.logo
      };
    } else {
      const creatorReceiver = await prisma.creator.findUnique({
        where: { id: receiverId },
        select: { id: true, userName: true, fullName: true }
      });
      
      if (creatorReceiver) {
        receiverType = 'creator';
        receiver = {
          id: creatorReceiver.id,
          name: creatorReceiver.userName,
          type: 'creator',
          avatar: null // Creator model doesn't have avatar field
        };
      }
    }

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: senderId,
        participant2Id: receiverId,
        participant1Type: req.user.type,
        participant2Type: receiverType,
        lastMessageAt: new Date()
      }
    });

    // Create the initial message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: senderId,
        receiverId: receiverId,
        senderType: req.user.type,
        receiverType: receiverType,
        content: initialMessage,
        type: 'TEXT',
        isRead: false
      }
    });

    // Get sender details
    let sender = null;
    if (req.user.type === 'brand') {
      const brandSender = await prisma.brand.findUnique({
        where: { id: senderId },
        select: { id: true, companyName: true, contactName: true, logo: true }
      });
      sender = {
        id: brandSender.id,
        name: brandSender.companyName,
        type: 'brand',
        avatar: brandSender.logo
      };
    } else {
      const creatorSender = await prisma.creator.findUnique({
        where: { id: senderId },
        select: { id: true, userName: true, fullName: true }
      });
      sender = {
        id: creatorSender.id,
        name: creatorSender.userName,
        type: 'creator',
        avatar: null // Creator model doesn't have avatar field
      };
    }

    // Format response
    const formattedConversation = {
      id: conversation.id,
      participant1: sender,
      participant2: receiver,
      lastMessage: {
        id: message.id,
        content: message.content,
        timestamp: message.createdAt,
        type: message.type,
        isRead: message.isRead
      },
      unreadCount: 0,
      updatedAt: conversation.lastMessageAt
    };

    res.status(201).json(formattedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation
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

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const userId = req.user.id;

    // Verify user is part of this conversation
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

    // Determine receiver
    const receiverId = conversation.participant1Id === userId 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        senderType: req.user.type,
        receiverType: conversation.participant1Id === userId ? conversation.participant2Type : conversation.participant1Type,
        content,
        type: type.toUpperCase()
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload file and send as message
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify user is part of this conversation
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

    // Determine receiver
    const receiverId = conversation.participant1Id === userId 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    // Create message with file
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content: req.file.originalname,
        type: 'file',
        fileName: req.file.originalname,
        fileUrl: `/uploads/messages/${req.file.filename}`,
        fileSize: req.file.size
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Mark messages as read
router.post('/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation
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

    // Mark all messages in this conversation as read for this user
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { participant2Id, briefId, briefTitle } = req.body;
    const userId = req.user.id;

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: userId,
            participant2Id: participant2Id
          },
          {
            participant1Id: participant2Id,
            participant2Id: userId
          }
        ]
      }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: userId,
        participant2Id: participant2Id,
        briefId: briefId || null,
        briefTitle: briefTitle || null
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Like a message
router.post('/:messageId/like', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Check if user already liked this message
    const existingLike = await prisma.messageLike.findFirst({
      where: {
        messageId,
        userId
      }
    });

    if (existingLike) {
      // Unlike the message
      await prisma.messageLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Like the message
      await prisma.messageLike.create({
        data: {
          messageId,
          userId
        }
      });
    }

    // Get updated like count
    const likeCount = await prisma.messageLike.count({
      where: { messageId }
    });

    res.json({ likeCount, isLiked: !existingLike });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({ error: 'Failed to like message' });
  }
});

module.exports = router;
