const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
collaborationRequestSchema.index({ from: 1, to: 1 }, { unique: true });
collaborationRequestSchema.index({ to: 1, status: 1 });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
