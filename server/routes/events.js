const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const prisma = require('../prisma');

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

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter, category, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    // Apply filters
    if (filter && filter !== 'all') {
      if (filter === 'upcoming') {
        where.date = { gte: new Date() };
        where.status = 'upcoming';
      } else if (filter === 'live') {
        where.status = 'live';
      } else {
        where.type = filter;
      }
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
            bio: true
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { date: 'asc' }
      ],
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.event.count({ where });

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get a specific event
router.get('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
            bio: true
          }
        },
        attendees: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create a new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      date,
      time,
      duration,
      timezone,
      maxAttendees,
      price,
      currency,
      isFree,
      isRecorded,
      tags,
      requirements,
      learningOutcomes,
      agenda
    } = req.body;

    const userId = req.user.id;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        category,
        date: new Date(date),
        time,
        duration,
        timezone,
        maxAttendees: parseInt(maxAttendees),
        price: parseFloat(price) || 0,
        currency: currency || 'USD',
        isFree: isFree || false,
        isRecorded: isRecorded || false,
        tags: tags || [],
        requirements: requirements || [],
        learningOutcomes: learningOutcomes || [],
        agenda: agenda || [],
        hostId: userId,
        status: 'upcoming'
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Register for an event
router.post('/:eventId/register', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if event exists and is not full
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            attendees: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event._count.attendees >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    if (event.status !== 'upcoming') {
      return res.status(400).json({ error: 'Event registration is closed' });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Register user for event
    await prisma.eventRegistration.create({
      data: {
        eventId,
        userId
      }
    });

    // Update attendee count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        currentAttendees: { increment: 1 }
      }
    });

    res.json({ success: true, message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Check if user is registered for an event
router.get('/:eventId/registration', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId
      }
    });

    res.json({ isRegistered: !!registration });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ error: 'Failed to check registration' });
  }
});

// Cancel event registration
router.delete('/:eventId/register', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Find and delete registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.eventRegistration.delete({
      where: { id: registration.id }
    });

    // Update attendee count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        currentAttendees: { decrement: 1 }
      }
    });

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// Update event status (for hosts)
router.patch('/:eventId/status', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Check if user is the host
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        hostId: userId
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or you are not the host' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Add event recording URL (for hosts)
router.patch('/:eventId/recording', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { recordingUrl } = req.body;
    const userId = req.user.id;

    // Check if user is the host
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        hostId: userId
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or you are not the host' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { recordingUrl },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event recording:', error);
    res.status(500).json({ error: 'Failed to update event recording' });
  }
});

// Get user's registered events
router.get('/user/registered', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                type: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        event: {
          date: 'asc'
        }
      }
    });

    const events = registrations.map(reg => reg.event);

    res.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// Get user's hosted events
router.get('/user/hosted', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await prisma.event.findMany({
      where: { hostId: userId },
      include: {
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching hosted events:', error);
    res.status(500).json({ error: 'Failed to fetch hosted events' });
  }
});

module.exports = router;
