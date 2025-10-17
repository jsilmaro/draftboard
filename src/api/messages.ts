import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email?: string;
}

// Get user ID from JWT token
const getUserIdFromToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// Get conversations for a user
export const getConversations = async (req: Request, res: Response) => {
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
        participant1: {
          select: {
            id: true,
            email: true,
            type: true,
            brand: {
              select: {
                companyName: true,
                handle: true
              }
            },
            creator: {
              select: {
                name: true,
                handle: true
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            email: true,
            type: true,
            brand: {
              select: {
                companyName: true,
                handle: true
              }
            },
            creator: {
              select: {
                name: true,
                handle: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
      const lastMessage = conv.messages[0];
      
      return {
        id: conv.id,
        name: otherParticipant.type === 'brand' 
          ? otherParticipant.brand?.companyName 
          : otherParticipant.creator?.name,
        handle: otherParticipant.type === 'brand'
          ? otherParticipant.brand?.handle
          : otherParticipant.creator?.handle,
        avatar: otherParticipant.type === 'brand'
          ? otherParticipant.brand?.companyName?.charAt(0).toUpperCase()
          : otherParticipant.creator?.name?.charAt(0).toUpperCase(),
        lastMessage: lastMessage?.content || '',
        timestamp: lastMessage?.createdAt ? formatTimestamp(lastMessage.createdAt) : '',
        unread: conv.unreadCount > 0,
        type: otherParticipant.type
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req: Request, res: Response) => {
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
      },
      include: {
        participant1: {
          select: {
            id: true,
            email: true,
            type: true,
            brand: {
              select: {
                companyName: true,
                handle: true
              }
            },
            creator: {
              select: {
                name: true,
                handle: true
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            email: true,
            type: true,
            brand: {
              select: {
                companyName: true,
                handle: true
              }
            },
            creator: {
              select: {
                name: true,
                handle: true
              }
            }
          }
        }
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

    const otherParticipant = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1;
    
    const conversationInfo = {
      participantName: otherParticipant.type === 'brand' 
        ? otherParticipant.brand?.companyName 
        : otherParticipant.creator?.name,
      participantHandle: otherParticipant.type === 'brand'
        ? otherParticipant.brand?.handle
        : otherParticipant.creator?.handle,
      participantType: otherParticipant.type
    };

    // Mark messages as read
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
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
    // eslint-disable-next-line no-console
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a new message
export const sendMessage = async (req: Request, res: Response) => {
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

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        senderId: userId,
        conversationId: conversationId
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        unreadCount: {
          increment: 1
        }
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
    // eslint-disable-next-line no-console
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new conversation
export const createConversation = async (req: Request, res: Response) => {
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

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: userId,
        participant2Id: participantId
      }
    });

    res.json({ conversationId: conversation.id });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get suggested users
export const getSuggestedUsers = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current user to determine type
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { type: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get users of different type (brands suggest creators, creators suggest brands)
    const suggestedType = currentUser.type === 'brand' ? 'creator' : 'brand';
    
    const suggestedUsers = await prisma.user.findMany({
      where: {
        type: suggestedType,
        id: { not: userId }
      },
      include: {
        brand: {
          select: {
            companyName: true,
            handle: true
          }
        },
        creator: {
          select: {
            name: true,
            handle: true
          }
        }
      },
      take: 10
    });

    const formattedUsers = suggestedUsers.map(user => ({
      id: user.id,
      name: user.type === 'brand' 
        ? user.brand?.companyName 
        : user.creator?.name,
      handle: user.type === 'brand'
        ? user.brand?.handle
        : user.creator?.handle,
      avatar: user.type === 'brand'
        ? user.brand?.companyName?.charAt(0).toUpperCase()
        : user.creator?.name?.charAt(0).toUpperCase(),
      type: user.type
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to format timestamp
function formatTimestamp(date: Date): string {
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

