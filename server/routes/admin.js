const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Audit logging middleware
const logAdminAction = async (adminId, action, details, targetType, targetId) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details,
        targetType,
        targetId,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// ===== BRAND MANAGEMENT =====

// Create new brand
router.post('/brands', authenticateAdmin, async (req, res) => {
  try {
    const { companyName, email, contactName, isVerified } = req.body;

    // Validate required fields
    if (!companyName || !email || !contactName) {
      return res.status(400).json({ error: 'Company name, email, and contact name are required' });
    }

    // Check if email already exists
    const existingBrand = await prisma.brand.findUnique({ where: { email } });
    if (existingBrand) {
      return res.status(400).json({ error: 'Brand with this email already exists' });
    }

    // Create brand with custom password or default
    const password = req.body.password || 'changeme123';
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const brand = await prisma.brand.create({
      data: {
        companyName,
        email,
        contactName,
        password: hashedPassword,
        isVerified: isVerified || false
      }
    });

    await logAdminAction(req.admin.id, 'CREATE_BRAND', `Created brand: ${companyName}`, 'brand', brand.id);
    
    res.status(201).json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all brands with pagination and search
router.get('/brands', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.isVerified = status === 'verified';
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          email: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { briefs: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.brand.count({ where })
    ]);

    res.json({
      brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brand by ID
router.get('/brands/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        briefs: {
          include: {
            _count: { select: { submissions: true } }
          }
        },
        wallet: true
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    await logAdminAction(req.admin.id, 'VIEW_BRAND', `Viewed brand: ${brand.companyName}`, 'brand', id);
    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update brand
router.put('/brands/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, email, contactName, isVerified } = req.body;

    // Validate required fields
    if (!companyName || !email || !contactName) {
      return res.status(400).json({ error: 'Company name, email, and contact name are required' });
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({ where: { id } });
    if (!existingBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check if email is being changed and if it conflicts with another brand
    if (email !== existingBrand.email) {
      const emailConflict = await prisma.brand.findUnique({ where: { email } });
      if (emailConflict) {
        return res.status(400).json({ error: 'Email is already in use by another brand' });
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        companyName,
        email,
        contactName,
        isVerified: isVerified || false
      }
    });

    await logAdminAction(req.admin.id, 'UPDATE_BRAND', `Updated brand: ${companyName}`, 'brand', id);
    
    res.json(updatedBrand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete brand
router.delete('/brands/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({ where: { id } });
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    await prisma.brand.delete({ where: { id } });
    await logAdminAction(req.admin.id, 'DELETE_BRAND', `Deleted brand: ${brand.companyName}`, 'brand', id);
    
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== CREATOR MANAGEMENT =====

// Create new creator
router.post('/creators', authenticateAdmin, async (req, res) => {
  try {
    const { userName, email, fullName, isVerified } = req.body;

    // Validate required fields
    if (!userName || !email || !fullName) {
      return res.status(400).json({ error: 'Username, email, and full name are required' });
    }

    // Check if username or email already exists
    const existingCreator = await prisma.creator.findFirst({
      where: {
        OR: [
          { userName },
          { email }
        ]
      }
    });
    
    if (existingCreator) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create creator with custom password or default
    const password = req.body.password || 'changeme123';
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const creator = await prisma.creator.create({
      data: {
        userName,
        email,
        fullName,
        password: hashedPassword,
        isVerified: isVerified || false
      }
    });

    await logAdminAction(req.admin.id, 'CREATE_CREATOR', `Created creator: ${userName}`, 'creator', creator.id);
    
    res.status(201).json(creator);
  } catch (error) {
    console.error('Error creating creator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all creators with pagination and search
router.get('/creators', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.isVerified = status === 'verified';
    }

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        select: {
          id: true,
          userName: true,
          fullName: true,
          email: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.creator.count({ where })
    ]);

    res.json({
      creators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get creator by ID
router.get('/creators/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            brief: true
          }
        },
        wallet: true,
        withdrawalRequests: true
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    await logAdminAction(req.admin.id, 'VIEW_CREATOR', `Viewed creator: ${creator.userName}`, 'creator', id);
    res.json(creator);
  } catch (error) {
    console.error('Error fetching creator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update creator
router.put('/creators/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, email, fullName, isVerified } = req.body;

    // Validate required fields
    if (!userName || !email || !fullName) {
      return res.status(400).json({ error: 'Username, email, and full name are required' });
    }

    // Check if creator exists
    const existingCreator = await prisma.creator.findUnique({ where: { id } });
    if (!existingCreator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if username or email is being changed and if it conflicts with another creator
    if (userName !== existingCreator.userName || email !== existingCreator.email) {
      const conflict = await prisma.creator.findFirst({
        where: {
          OR: [
            { userName },
            { email }
          ],
          NOT: { id }
        }
      });
      
      if (conflict) {
        return res.status(400).json({ error: 'Username or email is already in use' });
      }
    }

    const updatedCreator = await prisma.creator.update({
      where: { id },
      data: {
        userName,
        email,
        fullName,
        isVerified: isVerified || false
      }
    });

    await logAdminAction(req.admin.id, 'UPDATE_CREATOR', `Updated creator: ${userName}`, 'creator', id);
    
    res.json(updatedCreator);
  } catch (error) {
    console.error('Error updating creator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete creator
router.delete('/creators/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await prisma.creator.findUnique({ where: { id } });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    await prisma.creator.delete({ where: { id } });
    await logAdminAction(req.admin.id, 'DELETE_CREATOR', `Deleted creator: ${creator.userName}`, 'creator', id);
    
    res.json({ message: 'Creator deleted successfully' });
  } catch (error) {
    console.error('Error deleting creator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== BRIEF MANAGEMENT =====

// Create new brief
router.post('/briefs', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, requirements, reward, deadline, status, isPrivate, additionalFields, brandId } = req.body;

    // Validate required fields
    if (!title || !description || !requirements || !reward || !deadline || !brandId) {
      return res.status(400).json({ error: 'Title, description, requirements, reward, deadline, and brand ID are required' });
    }

    // Check if brand exists
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return res.status(400).json({ error: 'Brand not found' });
    }

    const brief = await prisma.brief.create({
      data: {
        title,
        description,
        requirements,
        reward: parseFloat(reward),
        deadline: new Date(deadline),
        status: status || 'draft',
        isPrivate: isPrivate || false,
        additionalFields: additionalFields ? JSON.stringify(additionalFields) : null,
        brandId
      }
    });

    await logAdminAction(req.admin.id, 'CREATE_BRIEF', `Created brief: ${title}`, 'brief', brief.id);
    
    res.status(201).json(brief);
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all briefs with pagination and search
router.get('/briefs', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [briefs, total] = await Promise.all([
      prisma.brief.findMany({
        where,
        include: {
          brand: {
            select: { companyName: true }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.brief.count({ where })
    ]);

    res.json({
      briefs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching briefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brief by ID
router.get('/briefs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const brief = await prisma.brief.findUnique({
      where: { id },
      include: {
        brand: {
          select: { companyName: true, email: true }
        },
        submissions: {
          include: {
            creator: {
              select: { userName: true, fullName: true }
            }
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    await logAdminAction(req.admin.id, 'VIEW_BRIEF', `Viewed brief: ${brief.title}`, 'brief', id);
    res.json(brief);
  } catch (error) {
    console.error('Error fetching brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update brief
router.put('/briefs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, reward, deadline, status, isPrivate, additionalFields, brandId } = req.body;

    // Validate required fields
    if (!title || !description || !requirements || !reward || !deadline || !brandId) {
      return res.status(400).json({ error: 'Title, description, requirements, reward, deadline, and brand ID are required' });
    }

    // Check if brief exists
    const existingBrief = await prisma.brief.findUnique({ where: { id } });
    if (!existingBrief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Check if brand exists
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return res.status(400).json({ error: 'Brand not found' });
    }

    const updatedBrief = await prisma.brief.update({
      where: { id },
      data: {
        title,
        description,
        requirements,
        reward: parseFloat(reward),
        deadline: new Date(deadline),
        status: status || 'draft',
        isPrivate: isPrivate || false,
        additionalFields: additionalFields ? JSON.stringify(additionalFields) : null,
        brandId
      }
    });

    await logAdminAction(req.admin.id, 'UPDATE_BRIEF', `Updated brief: ${title}`, 'brief', id);
    
    res.json(updatedBrief);
  } catch (error) {
    console.error('Error updating brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete brief
router.delete('/briefs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const brief = await prisma.brief.findUnique({ where: { id } });
    
    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    await prisma.brief.delete({ where: { id } });
    await logAdminAction(req.admin.id, 'DELETE_BRIEF', `Deleted brief: ${brief.title}`, 'brief', id);
    
    res.json({ message: 'Brief deleted successfully' });
  } catch (error) {
    console.error('Error deleting brief:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SUBMISSION MONITORING =====

// Get all submissions with pagination and search
router.get('/submissions', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { brief: { title: { contains: search, mode: 'insensitive' } } },
        { creator: { userName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          brief: {
            select: { title: true, reward: true, description: true, additionalFields: true }
          },
          creator: {
            select: { userName: true, fullName: true, email: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.submission.count({ where })
    ]);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submission by ID for detailed view
router.get('/submissions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        brief: {
          select: { 
            title: true, 
            description: true, 
            reward: true, 
            additionalFields: true,
            status: true,
            brand: {
              select: { companyName: true, email: true }
            }
          }
        },
        creator: {
          select: { 
            userName: true, 
            fullName: true, 
            email: true,
            isVerified: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await logAdminAction(req.admin.id, 'VIEW_SUBMISSION', `Viewed submission for ${submission.brief.title}`, 'submission', id);
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete submission
router.delete('/submissions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { brief: true, creator: true }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await prisma.submission.delete({ where: { id } });
    await logAdminAction(req.admin.id, 'DELETE_SUBMISSION', `Deleted submission for ${submission.brief.title} by ${submission.creator.userName}`, 'submission', id);
    
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review submission (approve/reject)
router.put('/submissions/:id/review', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { brief: true, creator: true }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: { 
        status,
        reviewedAt: new Date()
      }
    });

    await logAdminAction(
      req.admin.id, 
      `REVIEW_SUBMISSION_${status.toUpperCase()}`, 
      `Reviewed submission for ${submission.brief.title} by ${submission.creator.userName}`,
      'submission',
      id
    );

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== WITHDRAWAL MANAGEMENT =====

// Get all withdrawal requests
router.get('/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          creator: {
            select: { userName: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.withdrawalRequest.count({ where })
    ]);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve withdrawal
router.put('/withdrawals/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: { 
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.admin.id
      }
    });

    await logAdminAction(
      req.admin.id,
      'APPROVE_WITHDRAWAL',
      `Approved withdrawal request for ${withdrawal.creator.userName}`,
      'withdrawal',
      id
    );

    res.json(updatedWithdrawal);
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject withdrawal
router.put('/withdrawals/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.admin.id,
        rejectionReason: reason
      }
    });

    await logAdminAction(
      req.admin.id,
      'REJECT_WITHDRAWAL',
      `Rejected withdrawal request for ${withdrawal.creator.userName}`,
      'withdrawal',
      id
    );

    res.json(updatedWithdrawal);
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PAYOUT MANAGEMENT =====

// Get all payouts
router.get('/payouts', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      prisma.submission.findMany({
        where: { status: 'approved' },
        include: {
          brief: {
            select: { title: true }
          },
          creator: {
            select: { userName: true, fullName: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.submission.count({ where: { status: 'approved' } })
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payout by ID
router.get('/payouts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await prisma.submission.findUnique({
      where: { id },
      include: {
        brief: {
          select: { title: true, reward: true }
        },
        creator: {
          select: { userName: true, fullName: true, email: true }
        }
      }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    await logAdminAction(req.admin.id, 'VIEW_PAYOUT', `Viewed payout details`, 'payout', id);
    res.json(payout);
  } catch (error) {
    console.error('Error fetching payout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ANALYTICS =====

// Get comprehensive analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    
    
    

         const [
       totalBrands,
       totalCreators,
       totalBriefs,
       totalSubmissions,
       approvedSubmissions,
       totalWithdrawals
     ] = await Promise.all([
      prisma.brand.count(),
      prisma.creator.count(),
      prisma.brief.count(),
      prisma.submission.count(),
      prisma.submission.findMany({
        where: { status: 'approved' },
        select: { amount: true }
      }),
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true }
      })
    ]);

    const totalPayoutAmount = approvedSubmissions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const totalWithdrawalAmount = totalWithdrawals._sum.amount || 0;
    const monthlyRevenue = totalPayoutAmount * 0.3; // 30% platform fee

    res.json({
      totalBrands,
      totalCreators,
      totalBriefs,
      totalSubmissions,
      totalPayouts: totalPayoutAmount,
      totalWithdrawals: totalWithdrawalAmount,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== AUDIT LOGS =====

// Get audit logs
router.get('/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', targetType = '', startDate = '', endDate = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (targetType) {
      where.targetType = targetType;
    }
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: { email: true, fullName: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export audit logs
router.get('/audit-logs/export', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: { email: true, fullName: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Convert to CSV format
    const csv = [
      ['Timestamp', 'Admin', 'Action', 'Details', 'Target Type', 'Target ID'].join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        log.admin.email,
        log.action,
        log.details,
        log.targetType,
        log.targetId
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== DATABASE MANAGEMENT =====

// Get database health status
router.get('/database/health', authenticateAdmin, async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;

    // Get table counts
    const [brands, creators, briefs, submissions, withdrawals] = await Promise.all([
      prisma.brand.count(),
      prisma.creator.count(),
      prisma.brief.count(),
      prisma.submission.count(),
      prisma.withdrawalRequest.count()
    ]);

    res.json({
      status: 'healthy',
      connectionTime: `${connectionTime}ms`,
      tables: {
        brands,
        creators,
        briefs,
        submissions,
        withdrawals
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== NOTIFICATIONS =====

// Get admin notifications
router.get('/notifications', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { adminId: req.admin.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.adminNotification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.adminNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
