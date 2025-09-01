const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and get user type
    let user = null;
    let userType = null;

    // Check if user is a brand
    const brand = await prisma.brand.findUnique({
      where: { id: decoded.id }
    });

    if (brand) {
      user = brand;
      userType = 'brand';
    } else {
      // Check if user is a creator
      const creator = await prisma.creator.findUnique({
        where: { id: decoded.id }
      });

      if (creator) {
        user = creator;
        userType = 'creator';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      type: userType
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;
