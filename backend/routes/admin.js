const express = require('express');
const mongoose = require('mongoose');
const DevOpsDocController = require('../controllers/devOpsDocController');
const { auth, adminAuth } = require('../middleware/auth');
const { escapeRegex, passwordProblem } = require('../middleware/security');
const { getEffectivePlan, DURATION_DAYS } = require('../services/plans');
const { recordAudit } = require('../services/audit');
const { getPricing, setPricing, validatePricing, PRICE_MIN, PRICE_MAX } = require('../services/settings');
const { deleteUserCascade } = require('../services/userCleanup');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Blog = require('../models/Blog');
const DevOpsDoc = require('../models/DevOpsDoc');
const GeneratedFile = require('../models/GeneratedFile');
const AuditLog = require('../models/AuditLog');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

// Safety net: an error inside any async handler becomes a clean 500 instead of an unhandled rejection
const safe = (fn) => (req, res, next) =>
  Promise.resolve()
    .then(() => fn(req, res, next))
    .catch((e) => {
      console.error(`Admin route error ${req.method} ${req.originalUrl}:`, e && e.message);
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Something went wrong' });
    });
for (const m of ['get', 'post', 'put', 'patch', 'delete']) {
  const orig = router[m].bind(router);
  router[m] = (path, ...handlers) => orig(path, ...handlers.map(safe));
}

// EVERY admin route needs a valid session AND the admin role. Applied once, before any route below.
router.use(auth);
router.use(adminAuth);

const DAY = 24 * 60 * 60 * 1000;
const isId = (v) => mongoose.Types.ObjectId.isValid(v) && String(v).length === 24;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const fail = (res, status, error) => res.status(status).json({ success: false, error });
const page = (q) => {
  const p = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100);
  return { p, limit, skip: (p - 1) * limit };
};

// Reject malformed ids for every /users/:id... route in one place
router.param('id', (req, res, next, id) => (isId(id) ? next() : fail(res, 400, 'Invalid id')));

/** Active admins other than `exceptId` — used to make sure the platform is never left without an admin. */
const otherActiveAdmins = (exceptId) => User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: exceptId } });

const publicUser = (u) => {
  const o = u.toJSON();
  o.plan = getEffectivePlan(u);
  return o;
};

// ---------------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------------
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [totalUsers, activeUsers, admins, verified, newThisMonth, new7d, twoFactor, premiumActive, trialActive,
      revenueAgg, monthRevenueAgg, pendingPayments, refundRequests, blogs, docs, generations, unreadMessages,
      recentUsers, recentPayments, recentAudit] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY) } }),
      User.countDocuments({ 'twoFactor.enabled': true }),
      User.countDocuments({ 'subscription.type': 'premium', $or: [{ 'subscription.endDate': { $gt: now } }, { 'subscription.endDate': null }] }),
      User.countDocuments({ 'subscription.type': 'trial', 'subscription.trialEndDate': { $gt: now } }),
      Payment.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: null, total: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'verified', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      Payment.countDocuments({ status: 'pending', paymentMethod: { $ne: 'cashfree' } }),
      Payment.countDocuments({ 'refund.status': 'requested' }),
      Blog.countDocuments(),
      DevOpsDoc.countDocuments(),
      GeneratedFile.countDocuments(),
      ContactMessage.countDocuments({ status: 'new' }),
      User.find().sort({ createdAt: -1 }).limit(6).select('username email role isEmailVerified createdAt'),
      Payment.find().sort({ createdAt: -1 }).limit(6).populate('user', 'username email').select('amount status paymentMethod subscriptionType createdAt user'),
      AuditLog.find().sort({ createdAt: -1 }).limit(8),
    ]);
    const adminsActive = await User.countDocuments({ role: 'admin', isActive: true });
    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, admins, verified, unverified: totalUsers - verified, newThisMonth, newLast7Days: new7d, twoFactorEnabled: twoFactor },
        plans: { pro: premiumActive + trialActive, premium: premiumActive, trial: trialActive, free: Math.max(totalUsers - premiumActive - trialActive, 0) },
        revenue: { total: (revenueAgg[0] && revenueAgg[0].total) || 0, payments: (revenueAgg[0] && revenueAgg[0].n) || 0, thisMonth: (monthRevenueAgg[0] && monthRevenueAgg[0].total) || 0, currency: 'INR' },
        attention: { pendingPayments, refundRequests, unreadMessages, unverifiedUsers: totalUsers - verified, singleAdmin: adminsActive < 2 },
        content: { blogs, docs, generations },
        recentUsers, recentPayments, recentAudit,
      },
    });
  } catch (e) {
    console.error('Admin overview error:', e.message);
    fail(res, 500, 'Failed to load the overview');
  }
});

// Kept for the documentation tab in the old panel
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {
      totalDocs: await DevOpsDoc.countDocuments(),
      activeDocs: await DevOpsDoc.countDocuments({ isActive: true }),
      totalCategories: (await DevOpsDoc.distinct('category')).length,
      totalTechnologies: (await DevOpsDoc.distinct('technology')).length,
      recentUpdates: await DevOpsDoc.find().sort({ lastUpdated: -1 }).limit(5).select('technology title lastUpdated'),
    };
    res.json({ success: true, data: stats });
  } catch (e) {
    fail(res, 500, 'Failed to fetch dashboard data');
  }
});

// ---------------------------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------------------------
// NOTE: fixed paths must be declared before "/users/:id" (previously /users/stats was swallowed by :id and failed)
router.get('/users/stats', async (req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [totalUsers, activeUsers, adminUsers, newUsersThisMonth, recentRegistrations] = await Promise.all([
    User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.find().sort({ createdAt: -1 }).limit(5).select('username email role createdAt'),
  ]);
  res.json({ success: true, data: { totalUsers, activeUsers, adminUsers, newUsersThisMonth, recentRegistrations } });
});

router.get('/users', async (req, res) => {
  try {
    const { p, limit, skip } = page(req.query);
    const q = {};
    const search = String(req.query.search || '').trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      q.$or = [{ username: rx }, { email: rx }];
    }
    if (['user', 'admin'].includes(req.query.role)) q.role = req.query.role;
    if (req.query.status === 'active') q.isActive = true;
    if (req.query.status === 'disabled') q.isActive = false;
    if (req.query.verified === 'yes') q.isEmailVerified = true;
    if (req.query.verified === 'no') q.isEmailVerified = { $ne: true };
    const now = new Date();
    const proCond = { $or: [
      { 'subscription.type': 'premium', $or: [{ 'subscription.endDate': { $gt: now } }, { 'subscription.endDate': null }] },
      { 'subscription.type': 'trial', 'subscription.trialEndDate': { $gt: now } },
    ] };
    if (req.query.plan === 'pro') Object.assign(q, { $and: [...(q.$and || []), proCond] });
    if (req.query.plan === 'free') Object.assign(q, { $nor: [...(q.$nor || []), ...proCond.$or] });

    const sortable = { createdAt: 'createdAt', lastLogin: 'lastLogin', username: 'username', email: 'email' };
    const sortKey = sortable[req.query.sort] || 'createdAt';
    const dir = req.query.dir === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(q).sort({ [sortKey]: dir }).skip(skip).limit(limit),
      User.countDocuments(q),
    ]);
    res.json({ success: true, data: users.map(publicUser), pagination: { page: p, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (e) {
    console.error('Fetch users error:', e.message);
    fail(res, 500, 'Failed to fetch users');
  }
});

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  const payments = await Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(20)
    .select('amount status paymentMethod subscriptionType invoiceNumber createdAt refund.status');
  res.json({ success: true, data: { ...publicUser(user), payments } });
});

router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body || {};
    if (!USERNAME_RE.test(String(username || ''))) return fail(res, 400, 'Username must be 3-30 letters, numbers or underscores');
    if (!EMAIL_RE.test(String(email || ''))) return fail(res, 400, 'Enter a valid email address');
    const pw = passwordProblem(password);
    if (pw) return fail(res, 400, pw);
    if (!['user', 'admin'].includes(role)) return fail(res, 400, 'Invalid role');

    const normalized = String(email).toLowerCase().trim();
    if (await User.findOne({ $or: [{ email: normalized }, { username }] })) return fail(res, 400, 'A user with this email or username already exists');

    // Accounts created by an admin are trusted: verified, so the person can log in straight away
    const user = await new User({ username, email: normalized, password, role, isEmailVerified: true, isActive: true }).save();
    await recordAudit(req, 'user.create', { targetType: 'user', targetId: user._id, targetLabel: user.email, details: { role } });
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (e) {
    console.error('Create user error:', e.message);
    fail(res, 500, 'Failed to create user');
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    const isSelf = String(req.user._id) === String(user._id);
    const changes = {};

    if (role !== undefined && role !== user.role) {
      if (!['user', 'admin'].includes(role)) return fail(res, 400, 'Invalid role');
      if (isSelf) return fail(res, 400, 'You cannot change your own role');
      if (user.role === 'admin' && user.isActive && (await otherActiveAdmins(user._id)) === 0) return fail(res, 400, 'This is the last active admin and cannot be demoted');
      changes.role = [user.role, role]; user.role = role;
    }
    if (isActive !== undefined && Boolean(isActive) !== user.isActive) {
      if (typeof isActive !== 'boolean') return fail(res, 400, 'Invalid status');
      if (isSelf && !isActive) return fail(res, 400, 'You cannot disable your own account');
      if (!isActive && user.role === 'admin' && (await otherActiveAdmins(user._id)) === 0) return fail(res, 400, 'This is the last active admin and cannot be disabled');
      changes.isActive = [user.isActive, isActive]; user.isActive = isActive;
    }
    if (username !== undefined && username !== user.username) {
      if (!USERNAME_RE.test(String(username))) return fail(res, 400, 'Username must be 3-30 letters, numbers or underscores');
      if (await User.findOne({ username, _id: { $ne: user._id } })) return fail(res, 400, 'Username already exists');
      changes.username = [user.username, username]; user.username = username;
    }
    if (email !== undefined && String(email).toLowerCase() !== user.email) {
      if (!EMAIL_RE.test(String(email))) return fail(res, 400, 'Enter a valid email address');
      const normalized = String(email).toLowerCase().trim();
      if (await User.findOne({ email: normalized, _id: { $ne: user._id } })) return fail(res, 400, 'Email already exists');
      changes.email = [user.email, normalized]; user.email = normalized;
    }
    if (Object.keys(changes).length === 0) return res.json({ success: true, data: publicUser(user) });

    await user.save();
    await recordAudit(req, 'user.update', { targetType: 'user', targetId: user._id, targetLabel: user.email, details: changes });
    res.json({ success: true, data: publicUser(user) });
  } catch (e) {
    console.error('Update user error:', e.message);
    fail(res, 500, 'Failed to update user');
  }
});

// Give or take back Pro access without a payment (support gestures, refunds outside the gateway, trials)
router.post('/users/:id/plan', async (req, res) => {
  const { action, days } = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  const now = new Date();

  if (action === 'grant') {
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > 3650) return fail(res, 400, 'Days must be a whole number from 1 to 3650');
    const current = getEffectivePlan(user, now);
    const base = user.subscription && user.subscription.type === 'premium' && current.status === 'active' && user.subscription.endDate ? new Date(user.subscription.endDate) : now;
    user.subscription.type = 'premium';
    user.subscription.startDate = user.subscription.startDate && base > now ? user.subscription.startDate : now;
    user.subscription.endDate = new Date(base.getTime() + d * DAY);
    user.subscription.subscriptionType = 'monthly';
    await user.save();
    await recordAudit(req, 'user.plan.grant', { targetType: 'user', targetId: user._id, targetLabel: user.email, details: { days: d, until: user.subscription.endDate } });
  } else if (action === 'revoke') {
    user.subscription.type = 'free';
    user.subscription.startDate = undefined;
    user.subscription.endDate = undefined;
    user.subscription.trialEndDate = undefined;
    await user.save();
    await recordAudit(req, 'user.plan.revoke', { targetType: 'user', targetId: user._id, targetLabel: user.email });
  } else {
    return fail(res, 400, 'action must be "grant" or "revoke"');
  }
  res.json({ success: true, data: publicUser(user) });
});

router.post('/users/:id/verify-email', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  user.isEmailVerified = true;
  user.emailOTP = undefined; user.emailOTPExpires = undefined; user.emailOTPAttempts = 0;
  await user.save();
  await recordAudit(req, 'user.email.verify', { targetType: 'user', targetId: user._id, targetLabel: user.email });
  res.json({ success: true, data: publicUser(user) });
});

// Sign the user out everywhere (e.g. a stolen device). Existing sessions stop working immediately.
router.post('/users/:id/force-logout', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  await User.updateOne({ _id: user._id }, { $set: { passwordChangedAt: new Date() } });
  await recordAudit(req, 'user.force-logout', { targetType: 'user', targetId: user._id, targetLabel: user.email });
  res.json({ success: true });
});

// A user who lost their phone AND recovery codes: turn off two-factor so they can sign in with their password
router.post('/users/:id/reset-2fa', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  user.twoFactor.enabled = false;
  user.twoFactor.secret = undefined; user.twoFactor.pendingSecret = undefined;
  user.twoFactor.recoveryCodes = []; user.twoFactor.lastStep = 0;
  user.loginAttempts = 0; user.lockUntil = undefined;
  await user.save();
  await User.updateOne({ _id: user._id }, { $set: { passwordChangedAt: new Date() } }); // old sessions end
  await recordAudit(req, 'user.2fa.reset', { targetType: 'user', targetId: user._id, targetLabel: user.email });
  res.json({ success: true });
});

router.post('/users/:id/unlock', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  user.loginAttempts = 0; user.lockUntil = undefined; user.emailOTPAttempts = 0;
  await user.save();
  await recordAudit(req, 'user.unlock', { targetType: 'user', targetId: user._id, targetLabel: user.email });
  res.json({ success: true });
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    if (String(req.user._id) === String(user._id)) return fail(res, 400, 'You cannot delete your own account');
    if (user.role === 'admin' && user.isActive && (await otherActiveAdmins(user._id)) === 0) return fail(res, 400, 'This is the last active admin and cannot be deleted');
    const label = user.email;
    const removed = await deleteUserCascade(user._id);
    await recordAudit(req, 'user.delete', { targetType: 'user', targetId: req.params.id, targetLabel: label, details: removed });
    res.json({ success: true, message: 'User and their personal data were deleted', data: removed });
  } catch (e) {
    console.error('Delete user error:', e.message);
    fail(res, 500, 'Failed to delete user');
  }
});

// ---------------------------------------------------------------------------------------------
// Settings: subscription prices
// ---------------------------------------------------------------------------------------------
router.get('/settings/pricing', async (req, res) => {
  const pricing = await getPricing();
  res.json({ success: true, data: { ...pricing, currency: 'INR', min: PRICE_MIN, max: PRICE_MAX } });
});

// New prices apply to payments started AFTER the change. Existing subscribers, open checkouts and past
// invoices keep the amount they were charged.
router.put('/settings/pricing', async (req, res) => {
  const { monthly, yearly } = req.body || {};
  const problem = validatePricing({ monthly, yearly });
  if (problem) return fail(res, 400, problem);
  const before = await getPricing();
  const after = await setPricing({ monthly, yearly }, req.user._id);
  await recordAudit(req, 'settings.pricing.update', { targetType: 'settings', targetLabel: 'subscription prices', details: { monthly: [before.monthly, after.monthly], yearly: [before.yearly, after.yearly] } });
  res.json({ success: true, data: { ...after, currency: 'INR' } });
});

// ---------------------------------------------------------------------------------------------
// Audit log (read-only) and contact-form inbox
// ---------------------------------------------------------------------------------------------
router.get('/audit', async (req, res) => {
  const { p, limit, skip } = page(req.query);
  const q = {};
  if (req.query.action) q.action = new RegExp('^' + escapeRegex(String(req.query.action)));
  const search = String(req.query.search || '').trim();
  if (search) { const rx = new RegExp(escapeRegex(search), 'i'); q.$or = [{ actorEmail: rx }, { targetLabel: rx }]; }
  const [rows, total] = await Promise.all([AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit), AuditLog.countDocuments(q)]);
  res.json({ success: true, data: rows, pagination: { page: p, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
});

router.get('/messages', async (req, res) => {
  const { p, limit, skip } = page(req.query);
  const q = {};
  if (['new', 'read', 'archived'].includes(req.query.status)) q.status = req.query.status;
  const [rows, total, unread] = await Promise.all([
    ContactMessage.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit), ContactMessage.countDocuments(q), ContactMessage.countDocuments({ status: 'new' }),
  ]);
  res.json({ success: true, data: rows, unread, pagination: { page: p, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
});

router.patch('/messages/:id', async (req, res) => {
  if (!['new', 'read', 'archived'].includes(req.body && req.body.status)) return fail(res, 400, 'Invalid status');
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!msg) return fail(res, 404, 'Message not found');
  res.json({ success: true, data: msg });
});

router.delete('/messages/:id', async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) return fail(res, 404, 'Message not found');
  await recordAudit(req, 'message.delete', { targetType: 'message', targetId: msg._id, targetLabel: msg.subject });
  res.json({ success: true });
});

// Documentation management routes
router.post('/docs', DevOpsDocController.createDoc);
router.put('/docs/:id', DevOpsDocController.updateDoc);
router.delete('/docs/:id', DevOpsDocController.deleteDoc);
router.get('/docs', DevOpsDocController.getAllDocs);
router.get('/docs/categories', DevOpsDocController.getCategories);
router.get('/docs/technologies', DevOpsDocController.getTechnologies);

module.exports = router;
