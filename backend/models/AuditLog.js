const mongoose = require('mongoose');

/** Append-only record of what admins did. Never edited or deleted through the app. */
const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorEmail: { type: String, required: true },
  action: { type: String, required: true, index: true }, // e.g. user.delete, user.plan.grant, payment.refund
  targetType: { type: String },
  targetId: { type: String },
  targetLabel: { type: String },                        // human-readable (email, title…) — survives deletion of the target
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
