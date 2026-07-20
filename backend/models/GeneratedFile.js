const mongoose = require('mongoose');

const generatedFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['jenkins', 'github-actions', 'ansible', 'kubernetes', 'terraform', 'dockerfile', 'bash', 'shell', 'python']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
generatedFileSchema.index({ userId: 1, createdAt: -1 });
generatedFileSchema.index({ type: 1, isPublic: 1 });

module.exports = mongoose.model('GeneratedFile', generatedFileSchema);
