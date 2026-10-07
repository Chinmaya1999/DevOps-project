/**
 * Single source of truth for plans, prices and what each plan may do.
 * Everything that grants or checks access goes through this file.
 */
const DAY = 24 * 60 * 60 * 1000;

// INR. Yearly = 12 months at ~17% off (12 x 199 = 2388 -> 1990).
const PRICING = Object.freeze({ monthly: 199, yearly: 1990 });
const DURATION_DAYS = Object.freeze({ monthly: 30, yearly: 365 });

const PLANS = Object.freeze({
  free: {
    label: 'Free',
    generationsPerMonth: 10,
    // Linux sandbox: beginner labs + free play, short sessions
    sandbox: { sessionMinutes: 15, sessionsPerDay: 5, levels: ['beginner'] },
    features: { generators: true, validator: true, troubleshooter: true, secretScanner: true, docs: true, community: true,
                bundle: false, deployments: false, costAnalysis: false, vision: false, sandbox: true },
  },
  pro: {
    label: 'Pro',
    generationsPerMonth: Infinity,
    sandbox: { sessionMinutes: 60, sessionsPerDay: 50, levels: ['beginner', 'intermediate', 'advanced'] },
    features: { generators: true, validator: true, troubleshooter: true, secretScanner: true, docs: true, community: true,
                bundle: true, deployments: true, costAnalysis: true, vision: true, sandbox: true },
  },
});

/**
 * Work out what a user is entitled to RIGHT NOW. Pure function of (user, now) — never trusts stored flags alone,
 * so an expired subscription loses access even if no cron job has downgraded the record.
 */
function getEffectivePlan(user, now = new Date()) {
  const sub = (user && user.subscription) || {};
  const t = now.getTime();
  const end = sub.endDate ? new Date(sub.endDate).getTime() : null;
  const trialEnd = sub.trialEndDate ? new Date(sub.trialEndDate).getTime() : null;

  let plan = 'free';
  let status = 'free';
  let endsAt = null;

  if (user && user.role === 'admin') {
    plan = 'pro'; status = 'admin';
  } else if (sub.type === 'premium' && (end === null || end > t)) {
    plan = 'pro'; status = 'active'; endsAt = end;
  } else if (sub.type === 'trial' && trialEnd !== null && trialEnd > t) {
    plan = 'pro'; status = 'trial'; endsAt = trialEnd;
  } else if (sub.type === 'premium' || sub.type === 'trial') {
    status = 'expired'; endsAt = sub.type === 'premium' ? end : trialEnd;
  }

  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt - t) / DAY)) : null;
  return {
    plan,
    status,
    label: PLANS[plan].label,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    daysLeft,
    generationsPerMonth: PLANS[plan].generationsPerMonth === Infinity ? null : PLANS[plan].generationsPerMonth,
    features: PLANS[plan].features,
    sandbox: PLANS[plan].sandbox,
  };
}

/**
 * Apply a paid period to a user. Renewals EXTEND from the current end date (no lost days);
 * expired / free users start from now. Mutates and returns the user (caller saves).
 */
function extendSubscription(user, subscriptionType, now = new Date()) {
  if (!DURATION_DAYS[subscriptionType]) throw new Error('Invalid subscription type');
  const current = getEffectivePlan(user, now);
  const sub = user.subscription || (user.subscription = {});
  const stillPaid = sub.type === 'premium' && current.status === 'active' && sub.endDate && new Date(sub.endDate) > now;
  const base = stillPaid ? new Date(sub.endDate) : now;

  sub.type = 'premium';
  sub.startDate = stillPaid && sub.startDate ? sub.startDate : now;
  sub.endDate = new Date(base.getTime() + DURATION_DAYS[subscriptionType] * DAY);
  sub.subscriptionType = subscriptionType;
  sub.autoRenew = false;
  return user;
}

/**
 * Take back the period a refunded payment bought. If nothing is left the user drops to Free immediately.
 * Mutates and returns the user (caller saves).
 */
function revokePeriod(user, subscriptionType, now = new Date()) {
  const sub = user.subscription;
  if (!sub || sub.type !== 'premium' || !sub.endDate) return user;
  const newEnd = new Date(new Date(sub.endDate).getTime() - DURATION_DAYS[subscriptionType] * DAY);
  if (newEnd <= now) { sub.type = 'free'; sub.endDate = undefined; sub.startDate = undefined; }
  else sub.endDate = newEnd;
  return user;
}

const priceFor = (subscriptionType) => PRICING[subscriptionType];

module.exports = { PLANS, PRICING, DURATION_DAYS, getEffectivePlan, extendSubscription, revokePeriod, priceFor };
