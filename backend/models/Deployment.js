const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

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
  // SSH private key — encrypted at rest (AES-256-GCM), transparently decrypted when read in code
  pemKey: {
    type: String,
    default: null,
    set: encrypt,
    get: decrypt
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

// Never leak secrets through API responses
deploymentSchema.set('toJSON', {
  getters: false,
  transform: (doc, ret) => {
    delete ret.pemKey;
    return ret;
  }
});
deploymentSchema.set('toObject', { getters: true });

module.exports = mongoose.model('Deployment', deploymentSchema);
