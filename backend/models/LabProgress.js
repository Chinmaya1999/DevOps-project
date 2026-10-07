const mongoose = require('mongoose');

/** One document per user: completed sandbox labs, XP, and the daily session counter used for plan limits. */
const labProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  xp: { type: Number, default: 0 },
  completed: [{
    _id: false,
    labId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  }],
  usage: {
    day: { type: String, default: '' }, // UTC date, YYYY-MM-DD
    sessions: { type: Number, default: 0 },
  },
  totalSessions: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LabProgress', labProgressSchema);
