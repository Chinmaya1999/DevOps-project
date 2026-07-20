const mongoose = require('mongoose');

const devOpsDocSchema = new mongoose.Schema({
  technology: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cicd', 'containerization', 'orchestration', 'iac', 'monitoring', 'security', 'other'],
    default: 'other'
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  estimatedTime: {
    type: String,
    default: '30 minutes'
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    default: 'Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
devOpsDocSchema.index({ technology: 1 });
devOpsDocSchema.index({ category: 1 });
devOpsDocSchema.index({ isActive: 1 });

module.exports = mongoose.model('DevOpsDoc', devOpsDocSchema);
