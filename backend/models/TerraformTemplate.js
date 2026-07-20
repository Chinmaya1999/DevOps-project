const mongoose = require('mongoose');

const terraformTemplateSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  yamlContent: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['networking', 'compute', 'storage', 'security', 'database', 'monitoring', 'other'],
    default: 'other'
  },
  provider: {
    type: String,
    enum: ['aws', 'azure', 'gcp', 'generic', 'other'],
    default: 'generic'
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
    default: '15 minutes'
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
terraformTemplateSchema.index({ subjectName: 1 });
terraformTemplateSchema.index({ category: 1 });
terraformTemplateSchema.index({ provider: 1 });
terraformTemplateSchema.index({ isActive: 1 });

module.exports = mongoose.model('TerraformTemplate', terraformTemplateSchema);
