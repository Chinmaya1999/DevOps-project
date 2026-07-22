const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, adminAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Payment configuration (you can update these with your actual details)
const PAYMENT_CONFIG = {
  upiId: 'chinmayakumarmallick@ybl',
  upiQRCode: '/uploads/qrcode.png', // Place your PhonePe QR code image at backend/uploads/qrcode.png
  bankDetails: {
    accountName: 'Chinmaya Kumar Mallick',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India'
  },
  pricing: {
    monthly: 999,
    yearly: 9999
  }
};

// Get payment configuration (public)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: PAYMENT_CONFIG
  });
});

// Submit payment request (authenticated users)
router.post('/submit', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const { paymentMethod, transactionId, subscriptionType, notes } = req.body;
    const userId = req.user._id;

    // Validation
    if (!paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method and transaction ID are required'
      });
    }

    if (!['upi', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription type'
      });
    }

    // Check if transaction ID already exists
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'This transaction ID has already been used'
      });
    }

    // Check if user already has a pending payment
    const pendingPayment = await Payment.findOne({
      user: userId,
      status: 'pending'
    });

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending payment request. Please wait for verification.'
      });
    }

    // Calculate amount based on subscription type
    const amount = subscriptionType === 'monthly' ? PAYMENT_CONFIG.pricing.monthly : PAYMENT_CONFIG.pricing.yearly;

    // Create payment record
    const payment = new Payment({
      user: userId,
      amount,
      currency: 'INR',
      paymentMethod,
      transactionId,
      screenshotUrl: req.file ? `/uploads/payments/${req.file.filename}` : null,
      subscriptionType,
      notes
    });

    await payment.save();

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment submitted successfully. Please wait for verification.'
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit payment'
    });
  }
});

// Get user's payment history (authenticated)
router.get('/my-payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('verifiedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

// Get all payments (admin only)
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const payments = await Payment.find(filter)
      .populate('user', 'username email')
      .populate('verifiedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Verify payment (admin only)
router.put('/verify/:paymentId', auth, adminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    const payment = await Payment.findById(paymentId).populate('user');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Payment has already been processed'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    if (action === 'approve') {
      // Update payment status
      payment.status = 'verified';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();

      // Update user subscription with 5-day trial period
      const user = payment.user;
      const now = new Date();
      const subscriptionDuration = payment.subscriptionType === 'monthly' ? 30 : 365;
      const trialDuration = 5; // 5 days trial
      
      // Set trial period
      user.subscription.type = 'trial';
      user.subscription.startDate = now;
      user.subscription.trialEndDate = new Date(now.getTime() + trialDuration * 24 * 60 * 60 * 1000);
      user.subscription.endDate = new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000);
      user.subscription.subscriptionType = payment.subscriptionType;
      
      await user.save();
    } else {
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason;
    }

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: action === 'approve' ? 'Payment verified and subscription activated' : 'Payment rejected'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

// Get payment statistics (admin only)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = {
      total: await Payment.countDocuments(),
      pending: await Payment.countDocuments({ status: 'pending' }),
      verified: await Payment.countDocuments({ status: 'verified' }),
      rejected: await Payment.countDocuments({ status: 'rejected' }),
      totalRevenue: await Payment.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      recentPayments: await Payment.find()
        .populate('user', 'username email')
        .sort({ createdAt: -1 })
        .limit(10)
    };

    stats.totalRevenue = stats.totalRevenue[0]?.total || 0;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics'
    });
  }
});

module.exports = router;
