const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    default: 199 // Default subscription price (authoritative prices: services/plans.js)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'bank_transfer', 'cashfree'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true
  },
  screenshotUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'cancelled', 'refunded'],
    default: 'pending'
  },
  subscriptionType: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Online (gateway) payments
  gatewayOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  // the paid period this payment bought (set when it is applied to the subscription)
  periodStart: { type: Date },
  periodEnd: { type: Date },
  refund: {
    status: { type: String, enum: ['none', 'requested', 'processing', 'refunded', 'failed'], default: 'none' },
    requestedAt: { type: Date },
    reason: { type: String, trim: true, maxlength: 500 },
    amount: { type: Number },
    refundId: { type: String },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscriptionRevoked: { type: Boolean, default: false }
  },
  // true once the paid period has been added to the user's subscription (makes activation idempotent)
  subscriptionApplied: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique payment number before saving
paymentSchema.pre('save', async function(next) {
  if (!this.paymentNumber) {
    const Payment = mongoose.model('Payment');
    const count = await Payment.countDocuments();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.paymentNumber = `PAY${timestamp}${random}${count}`;
  }
  next();
});

// Index for faster queries
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
