const express = require('express');
const DevOpsDocController = require('../controllers/devOpsDocController');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Simple rate limiting middleware
const rateLimit = {
  requests: new Map(),
  limit: 100, // 100 requests per minute
  window: 60 * 1000, // 1 minute
  
  check: function(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.window);
    
    if (validRequests.length >= this.limit) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    next();
  }
};

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const DevOpsDoc = require('../models/DevOpsDoc');
    
    const stats = {
      totalDocs: await DevOpsDoc.countDocuments(),
      activeDocs: await DevOpsDoc.countDocuments({ isActive: true }),
      totalCategories: (await DevOpsDoc.distinct('category')).length,
      totalTechnologies: (await DevOpsDoc.distinct('technology')).length,
      recentUpdates: await DevOpsDoc.find()
        .sort({ lastUpdated: -1 })
        .limit(5)
        .select('technology title lastUpdated')
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// User management routes
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/stats', async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      adminUsers: await User.countDocuments({ role: 'admin' }),
      newUsersThisMonth: await User.countDocuments({
        createdAt: { $gte: firstDayOfMonth }
      }),
      recentRegistrations: await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email role createdAt')
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

router.post('/users', rateLimit.check, async (req, res) => {
  try {
    const { username, email, password, role = 'user', isActive = true } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or username already exists'
      });
    }
    
    const user = new User({
      username,
      email,
      password,
      role,
      isActive
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user'
    });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    const userId = req.params.id;
    
    // Don't allow changing own role to prevent locking yourself out
    if (req.user._id.toString() === userId && req.body.role && req.body.role !== req.user.role) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if email/username is being changed and if it conflicts
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }
    
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }
    }
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow deleting yourself
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// Documentation management routes
router.post('/docs', DevOpsDocController.createDoc);
router.put('/docs/:id', DevOpsDocController.updateDoc);
router.delete('/docs/:id', DevOpsDocController.deleteDoc);
router.get('/docs', DevOpsDocController.getAllDocs);
router.get('/docs/categories', DevOpsDocController.getCategories);
router.get('/docs/technologies', DevOpsDocController.getTechnologies);

module.exports = router;
