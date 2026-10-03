const mongoose = require('mongoose');

/** Atomic named counters (used for gap-free sequential invoice numbers). */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

module.exports = mongoose.model('Counter', counterSchema);
