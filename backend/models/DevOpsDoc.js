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
  },
  // Error documentation fields
  errorType: {
    type: String,
    enum: ['configuration', 'runtime', 'network', 'security', 'performance', 'deployment', 'other'],
    default: 'other'
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  rootCause: {
    type: String,
    trim: true
  },
  solution: {
    type: String,
    trim: true
  },
  references: [{
    type: String,
    trim: true
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  affectedComponents: [{
    type: String,
    trim: true
  }],
  isErrorDoc: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
devOpsDocSchema.index({ technology: 1 });
devOpsDocSchema.index({ category: 1 });
devOpsDocSchema.index({ isActive: 1 });

module.exports = mongoose.model('DevOpsDoc', devOpsDocSchema);
