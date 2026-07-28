const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0
  },
  questionsSolved: {
    type: Number,
    default: 0
  },
  questionsAsked: {
    type: Number,
    default: 0
  },
  history: [{
    action: {
      type: String,
      enum: ['question_solved', 'question_asked', 'bonus']
    },
    points: {
      type: Number
    },
    description: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPoints', userPointsSchema);
