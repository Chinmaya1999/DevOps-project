const GeneratedFile = require('../models/GeneratedFile');
const { getEffectivePlan, PLANS } = require('../services/plans');

/** Attach the user's effective plan to the request (run after `auth`). */
const attachPlan = (req, res, next) => {
  req.plan = getEffectivePlan(req.user);
  next();
};

/**
 * Gate a route by feature, e.g. requireFeature('deployments').
 * Responds 403 { code: 'UPGRADE_REQUIRED' } so the frontend can show an upgrade prompt.
 */
const requireFeature = (feature) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
  const plan = getEffectivePlan(req.user);
  req.plan = plan;
  if (plan.features[feature]) return next();
  const expired = plan.status === 'expired';
  return res.status(403).json({
    error: expired ? 'Subscription expired' : 'Pro plan required',
    code: 'UPGRADE_REQUIRED',
    feature,
    message: expired
      ? 'Your Pro subscription has expired. Renew to use this feature.'
      : 'This feature is part of the Pro plan. Upgrade to unlock it.',
  });
};

/** Free plan: limited saved generations per calendar month. Pro/admin: unlimited. */
const enforceGenerationQuota = async (req, res, next) => {
  try {
    const plan = getEffectivePlan(req.user);
    req.plan = plan;
    const limit = PLANS[plan.plan].generationsPerMonth;
    if (limit === Infinity) return next();

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const used = await GeneratedFile.countDocuments({ userId: req.user._id, createdAt: { $gte: monthStart } });
    if (used >= limit) {
      return res.status(403).json({
        error: 'Monthly limit reached',
        code: 'UPGRADE_REQUIRED',
        feature: 'generations',
        message: `The Free plan includes ${limit} generations per month. Upgrade to Pro for unlimited.`,
        used,
        limit,
      });
    }
    next();
  } catch (e) {
    console.error('Quota check error:', e.message);
    res.status(500).json({ error: 'Could not verify plan limits' });
  }
};

// Backwards-compatible name: "any active paid access"
const checkSubscription = requireFeature('deployments');

module.exports = { attachPlan, requireFeature, enforceGenerationQuota, checkSubscription };
