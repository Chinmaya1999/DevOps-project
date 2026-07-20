const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  deploymentType: {
    type: String,
    enum: ['aws-ec2', 'kubernetes', 'docker'],
    default: 'aws-ec2'
  },
  deploymentScope: {
    type: String,
    enum: ['both', 'frontend', 'backend'],
    default: 'both'
  },
  cloudProvider: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  username: {
    type: String,
    default: null
  },
  pemKey: {
    type: String,
    default: null
  },
  domain: {
    type: String,
    default: null
  },
  applicationUrl: {
    type: String,
    required: false,
    default: null
  },
  port: {
    type: Number,
    default: null
  },
  backendImage: {
    type: String,
    default: null
  },
  frontendImage: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['deploying', 'running', 'stopped', 'failed', 'deleting'],
    default: 'deploying'
  },
  isLive: {
    type: Boolean,
    default: false
  },
  lastHealthCheck: {
    type: Date,
    default: null
  },
  healthCheckStatus: {
    type: String,
    enum: ['healthy', 'unhealthy', 'unknown'],
    default: 'unknown'
  },
  errorLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    level: {
      type: String,
      enum: ['error', 'warning', 'info']
    }
  }],
  deploymentLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    level: {
      type: String,
      enum: ['info', 'warning', 'error']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
deploymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Deployment', deploymentSchema);
