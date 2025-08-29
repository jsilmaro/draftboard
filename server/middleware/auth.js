const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    let user;
    if (decoded.type === 'brand') {
      user = await prisma.brand.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          companyName: true,
          type: true
        }
      });
    } else if (decoded.type === 'creator') {
      user = await prisma.creator.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          userName: true,
          fullName: true,
          type: true
        }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      type: user.type,
      name: user.companyName || user.userName || user.fullName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;

