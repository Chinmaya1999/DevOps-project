const express = require('express');
const crypto = require('crypto');
const { limiters } = require('../middleware/security');
const cashfree = require('../services/cashfreeService');
const { reconcileOrder } = require('../services/paymentActivation');
const { ensureInvoiceNumber, buildInvoice } = require('../services/invoicing');
const refunds = require('../services/refunds');
const { recordAudit } = require('../services/audit');
const { PLANS, PRICING, DURATION_DAYS, getEffectivePlan, extendSubscription, priceFor } = require('../services/plans');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unguessable name; extension comes from the validated mimetype, never from user input
    const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'application/pdf': '.pdf' }[file.mimetype] || '';
    cb(null, 'payment-' + crypto.randomBytes(16).toString('hex') + ext);
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

// Public pricing for the pricing page (no personal/bank details are ever exposed)
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    data: {
      currency: 'INR',
      pricing: PRICING,
      plans: {
        free: { generationsPerMonth: PLANS.free.generationsPerMonth, features: PLANS.free.features },
        pro: { features: PLANS.pro.features },
      },
      gatewayEnabled: cashfree.isConfigured(),
    },
  });
});

// Serve QR code image with proper headers
router.get('/qrcode', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const qrCodePath = path.join(__dirname, '../uploads/qrcode.png');
  
  // Check if file exists
  if (fs.existsSync(qrCodePath)) {
    // Set proper headers to allow cross-origin loading
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the file
    res.sendFile(qrCodePath);
  } else {
    res.status(404).json({ error: 'QR code image not found' });
  }
});

// Submit payment request (authenticated users)
// Verify the real file type from its magic bytes — extension and mimetype are client-controlled
const MAGIC = [
  [0xff, 0xd8, 0xff], // jpeg
  [0x89, 0x50, 0x4e, 0x47], // png
  [0x47, 0x49, 0x46, 0x38], // gif
  [0x25, 0x50, 0x44, 0x46], // pdf
];
const verifyFileSignature = (req, res, next) => {
  if (!req.file) return next();
  const head = Buffer.alloc(4);
  const fd = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (!MAGIC.some((sig) => sig.every((b, i) => head[i] === b))) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ success: false, error: 'File content does not match an allowed type' });
  }
  next();
};

// Payment screenshots are private: only the admin or the user who uploaded one may fetch it
router.get('/screenshot/:file', auth, async (req, res) => {
  const file = path.basename(req.params.file);
  if (!/^payment-[\w-]+\.(jpe?g|png|gif|pdf)$/i.test(file)) return res.status(400).json({ error: 'Invalid file' });
  const payment = await Payment.findOne({ screenshotUrl: `/uploads/payments/${file}` }).select('user');
  const isOwner = payment && String(payment.user) === String(req.user._id);
  if (!payment || (!isOwner && req.user.role !== 'admin')) return res.status(404).json({ error: 'Not found' });
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(path.join(uploadDir, file));
});

router.post('/submit', auth, limiters.upload, upload.single('screenshot'), verifyFileSignature, async (req, res) => {
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
      status: 'pending',
      paymentMethod: { $ne: 'cashfree' }
    });

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending payment request. Please wait for verification.'
      });
    }

    // Calculate amount based on subscription type
    const amount = priceFor(subscriptionType);

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

// The signed-in user's billing history (no screenshots, no admin identities)
router.get('/my-payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: { $in: ['verified', 'refunded', 'pending', 'rejected'] } }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: payments.map((p) => ({
        id: p._id,
        paymentNumber: p.paymentNumber,
        createdAt: p.createdAt,
        amount: p.amount,
        currency: p.currency,
        method: p.paymentMethod,
        status: p.status,
        subscriptionType: p.subscriptionType,
        periodStart: p.periodStart || null,
        periodEnd: p.periodEnd || null,
        invoiceNumber: p.invoiceNumber || null,
        refund: { status: p.refund?.status || 'none', amount: p.refund?.amount || null },
        canRequestRefund: refunds.refundEligibility(p).ok,
        rejectionReason: p.status === 'rejected' ? p.rejectionReason || null : null,
      })),
      refundWindowDays: refunds.WINDOW_DAYS(),
    });
  } catch (error) {
    console.error('Get payments error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

// Invoice data for one paid payment. Owner or admin only.
router.get('/invoice/:id', auth, async (req, res) => {
  try {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const payment = await Payment.findById(req.params.id);
    const isOwner = payment && String(payment.user) === String(req.user._id);
    if (!payment || (!isOwner && req.user.role !== 'admin') || !['verified', 'refunded'].includes(payment.status)) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    if (!payment.invoiceNumber) await ensureInvoiceNumber(payment._id); // payments made before invoicing existed
    const fresh = await Payment.findById(payment._id);
    const User = require('../models/User');
    const customer = isOwner ? req.user : await User.findById(payment.user);
    res.json({ success: true, data: buildInvoice(fresh, customer) });
  } catch (error) {
    console.error('Invoice error:', error.message);
    res.status(500).json({ success: false, error: 'Could not load the invoice' });
  }
});

// Customer asks for a refund (within the refund window); an admin then approves it
router.post('/:id/refund-request', auth, limiters.checkout, async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, error: 'Payment not found' });
  const r = await refunds.requestRefund(req.params.id, req.user._id, req.body?.reason);
  if (r.error) return res.status(r.status).json({ success: false, error: r.error });
  res.json({ success: true, message: 'Refund requested. We will review it shortly.' });
});

// Admin: execute the refund through Cashfree
router.post('/:id/refund', auth, adminAuth, async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, error: 'Payment not found' });
  try {
    const r = await refunds.executeRefund(req.params.id, req.user._id, req.body?.note);
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    await recordAudit(req, 'payment.refund', { targetType: 'payment', targetId: req.params.id, targetLabel: r.payment.invoiceNumber || r.payment.paymentNumber, details: { amount: r.payment.amount, status: r.payment.refund && r.payment.refund.status } });
    res.json({ success: true, data: r.payment, message: 'Refund initiated and the subscription period was removed' });
  } catch (e) {
    console.error('Refund error:', e.message);
    res.status(500).json({ success: false, error: 'Refund failed' });
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

    if (payment.paymentMethod === 'cashfree') {
      return res.status(400).json({
        success: false,
        error: 'Online payments are verified automatically'
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

      // Renewals extend from the current end date instead of resetting it
      const user = payment.user;
      extendSubscription(user, payment.subscriptionType);
      payment.subscriptionApplied = true;
      payment.periodEnd = user.subscription.endDate;
      payment.periodStart = new Date(user.subscription.endDate.getTime() - DURATION_DAYS[payment.subscriptionType] * 86400000);
      await user.save();
    } else {
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason;
    }

    await payment.save();
    if (action === 'approve') await ensureInvoiceNumber(payment._id);
    await recordAudit(req, action === 'approve' ? 'payment.approve' : 'payment.reject', { targetType: 'payment', targetId: payment._id, targetLabel: payment.paymentNumber, details: { amount: payment.amount } });

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

// ---------------------------------------------------------------------------
// Online payments (Cashfree)
// ---------------------------------------------------------------------------

// Plans, prices and what the signed-in user currently has
router.get('/plans', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      pricing: PRICING,
      current: getEffectivePlan(req.user),
      gatewayEnabled: cashfree.isConfigured(),
    },
  });
});

// Create a checkout order. The AMOUNT is decided here on the server — never taken from the client.
router.post('/cashfree/order', auth, limiters.checkout, async (req, res) => {
  try {
    if (!cashfree.isConfigured()) {
      return res.status(503).json({ success: false, error: 'Online payments are temporarily unavailable' });
    }
    // Live Cashfree keys only work from a whitelisted domain; localhost can never be whitelisted.
    // Say so clearly instead of sending the user to Cashfree's "Broken Link" page.
    const origin = req.get('origin') || '';
    if (cashfree.environment() === 'production' && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)) {
      return res.status(400).json({
        success: false,
        error: 'Live payments cannot be started from localhost. For local testing set CASHFREE_ENV=sandbox with your Cashfree test keys.',
      });
    }
    const { subscriptionType, phone } = req.body || {};
    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return res.status(400).json({ success: false, error: 'Invalid subscription type' });
    }
    if (!/^[6-9]\d{9}$/.test(String(phone || ''))) {
      return res.status(400).json({ success: false, error: 'Enter a valid 10-digit Indian mobile number' });
    }

    // abandoned checkouts must not block a new one
    await Payment.updateMany(
      { user: req.user._id, paymentMethod: 'cashfree', status: 'pending' },
      { $set: { status: 'cancelled' } }
    );

    const amount = priceFor(subscriptionType);
    const orderId = 'ord_' + crypto.randomBytes(12).toString('hex');
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      currency: 'INR',
      paymentMethod: 'cashfree',
      transactionId: orderId,
      gatewayOrderId: orderId,
      subscriptionType,
      status: 'pending',
    });

    const frontend = (process.env.FRONTEND_URL || 'https://cmcloud.online').replace(/\/$/, '');
    const api = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    let order;
    try {
      order = await cashfree.createOrder({
        orderId,
        amount,
        customer: { id: String(req.user._id), email: req.user.email, phone: String(phone), name: req.user.username },
        returnUrl: `${frontend}/payment/status?order_id={order_id}`,
        notifyUrl: api ? `${api}/api/payment/cashfree/webhook` : undefined,
      });
    } catch (e) {
      payment.status = 'cancelled';
      await payment.save();
      console.error('Cashfree create order failed:', e.response?.status, e.response?.data?.message || e.message);
      return res.status(502).json({ success: false, error: 'Could not start the payment. Please try again in a moment.' });
    }

    res.json({
      success: true,
      data: { orderId, paymentSessionId: order.payment_session_id, environment: cashfree.environment() },
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// The customer returns from checkout: verify with Cashfree, then activate. Owner only.
router.get('/cashfree/status/:orderId', auth, async (req, res) => {
  try {
    const orderId = String(req.params.orderId);
    const own = await Payment.findOne({ gatewayOrderId: orderId, user: req.user._id }).select('_id');
    if (!own) return res.status(404).json({ success: false, error: 'Order not found' });

    const result = await reconcileOrder(orderId);
    const User = require('../models/User');
    const fresh = await User.findById(req.user._id);
    res.json({
      success: true,
      data: { status: result.status, plan: getEffectivePlan(fresh), message: result.payment?.rejectionReason || undefined },
    });
  } catch (error) {
    console.error('Order status error:', error.response?.data?.message || error.message);
    res.status(502).json({ success: false, error: 'Could not verify the payment right now. It will be activated automatically once confirmed.' });
  }
});

// Cashfree -> us. Authenticated by HMAC signature over the RAW body (see express.json verify in server.js).
router.post('/cashfree/webhook', async (req, res) => {
  const ok = cashfree.verifyWebhookSignature(req.rawBody, req.get('x-webhook-signature'), req.get('x-webhook-timestamp'));
  if (!ok) return res.status(401).json({ error: 'Invalid signature' });
  try {
    const type = req.body?.type;
    if (type === 'REFUND_STATUS_WEBHOOK') {
      const refundOrder = req.body?.data?.refund?.order_id;
      if (typeof refundOrder === 'string') await refunds.syncRefund(refundOrder);
      return res.status(200).json({ received: true });
    }
    const orderId = req.body?.data?.order?.order_id;
    // The webhook only tells us WHERE to look; the real state is fetched from Cashfree.
    if (typeof orderId === 'string') await reconcileOrder(orderId);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    res.status(500).json({ error: 'Processing failed' }); // Cashfree will retry
  }
});

module.exports = router;
