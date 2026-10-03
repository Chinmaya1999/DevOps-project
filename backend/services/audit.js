const AuditLog = require('../models/AuditLog');

/**
 * Record an admin action. Never throws: failing to write the log must not block (or hide) the action itself,
 * but the failure is reported on the server console.
 */
async function recordAudit(req, action, { targetType, targetId, targetLabel, details } = {}) {
  try {
    await AuditLog.create({
      actor: req.user && req.user._id,
      actorEmail: (req.user && req.user.email) || 'unknown',
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      targetLabel,
      details,
      ip: req.ip,
    });
  } catch (e) {
    console.error('AUDIT LOG WRITE FAILED:', action, e.message);
  }
}

module.exports = { recordAudit };
