/**
 * End-to-end tests for plans, access control and Cashfree payments.
 * Real Express routes + real MongoDB (in-memory). Only Cashfree's HTTP API is stubbed.
 */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
process.env.CASHFREE_APP_ID = 'test_app_id';
process.env.CASHFREE_SECRET_KEY = 'test_secret_key';
process.env.CASHFREE_ENV = 'sandbox';
process.env.FRONTEND_URL = 'https://app.example.com';
process.env.API_PUBLIC_URL = 'https://api.example.com';

let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* skipped below */ }

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Payment = require('../models/Payment');
const GeneratedFile = require('../models/GeneratedFile');
const cashfree = require('../services/cashfreeService');
const { auth } = require('../middleware/auth');
const { requireFeature, enforceGenerationQuota } = require('../middleware/subscription');
const { sanitizeInput } = require('../middleware/security');
const { getEffectivePlan } = require('../services/plans');

const DAY = 86400000;
let mongod, server, base;
const gateway = { orders: new Map(), created: [], refunds: [], refundStatus: 'SUCCESS', refundFails: false }; // fake Cashfree

function stubCashfree() {
  cashfree.http = {
    post: async (url, body) => {
      if (url.includes('/refunds')) {
        gateway.refunds.push({ url, body });
        if (gateway.refundFails) { const e = new Error('rejected'); e.response = { status: 400, data: { message: 'refund_not_allowed' } }; throw e; }
        return { data: { refund_id: body.refund_id, refund_status: gateway.refundStatus } };
      }
      gateway.created.push(body);
      gateway.orders.set(body.order_id, { order_id: body.order_id, order_amount: body.order_amount, order_currency: 'INR', order_status: 'ACTIVE' });
      return { data: { order_id: body.order_id, payment_session_id: 'session_' + body.order_id, order_status: 'ACTIVE' } };
    },
    get: async (url) => {
      if (url.includes('/refunds/')) return { data: { refund_status: gateway.refundStatus } };
      const id = decodeURIComponent(url.split('/pg/orders/')[1]);
      const o = gateway.orders.get(id);
      if (!o) { const e = new Error('not found'); e.response = { status: 404, data: { message: 'order_not_found' } }; throw e; }
      return { data: o };
    },
  };
}
const payOrder = (id, patch = {}) => Object.assign(gateway.orders.get(id), { order_status: 'PAID' }, patch);

async function makeUser(name, extra = {}) {
  const u = await User.create({ username: name, email: `${name}@example.com`, password: 'Passw0rd12345', isEmailVerified: true, ...extra });
  return { user: u, token: jwt.sign({ userId: u._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' }) };
}
const call = (path, { token, method = 'GET', body, headers = {} } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

const sign = (raw, ts = String(Date.now())) => ({
  'x-webhook-timestamp': ts,
  'x-webhook-signature': crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY).update(ts + raw).digest('base64'),
});

test.before(async () => {
  if (!MongoMemoryServer) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Payment.init();
  stubCashfree();

  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { if (req.originalUrl.startsWith('/api/payment/cashfree/webhook')) req.rawBody = buf; } }));
  app.use(sanitizeInput);
  app.use('/api/payment', require('../routes/payment'));
  app.get('/api/deployment/ping', auth, requireFeature('deployments'), (req, res) => res.json({ ok: true }));
  app.get('/api/cost/ping', auth, requireFeature('costAnalysis'), (req, res) => res.json({ ok: true }));
  app.post('/api/generate/x', auth, enforceGenerationQuota, (req, res) => res.json({ ok: true }));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const guard = (name, fn) => test(name, { skip: !MongoMemoryServer && 'mongodb-memory-server not installed' }, fn);

guard('free users are blocked from Pro features; admins are not', async () => {
  const free = await makeUser('freeuser');
  const admin = await makeUser('adminuser', { role: 'admin' });
  const r = await call('/api/deployment/ping', { token: free.token });
  assert.strictEqual(r.status, 403);
  assert.strictEqual(r.json.code, 'UPGRADE_REQUIRED');
  assert.strictEqual((await call('/api/cost/ping', { token: free.token })).status, 403);
  assert.strictEqual((await call('/api/deployment/ping', { token: admin.token })).status, 200);
  assert.strictEqual((await call('/api/deployment/ping')).status, 401);
});

guard('order amount is set by the server and bad input is rejected', async () => {
  const { token } = await makeUser('buyer1');
  assert.strictEqual((await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'weekly', phone: '9876543210' } })).status, 400);
  assert.strictEqual((await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly', phone: '12345' } })).status, 400);
  assert.strictEqual((await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly' } })).status, 400);

  // a client trying to pay ₹1 must be ignored
  const r = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210', amount: 1, order_amount: 1 } });
  assert.strictEqual(r.status, 200);
  assert.ok(r.json.data.paymentSessionId.startsWith('session_ord_'));
  const sent = gateway.created.at(-1);
  assert.strictEqual(sent.order_amount, 199);
  assert.strictEqual(sent.order_currency, 'INR');
  assert.strictEqual(sent.order_meta.return_url, 'https://app.example.com/payment/status?order_id={order_id}');
  assert.strictEqual(sent.order_meta.notify_url, 'https://api.example.com/api/payment/cashfree/webhook');

  const y = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'yearly', phone: '9876543210' } });
  assert.strictEqual(gateway.created.at(-1).order_amount, 1990);
  assert.strictEqual(y.status, 200);
});

guard('successful payment activates Pro once, and repeated checks never double-extend', async () => {
  const { user, token } = await makeUser('buyer2');
  const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210' } });
  const orderId = o.json.data.orderId;

  // not paid yet
  let s = await call(`/api/payment/cashfree/status/${orderId}`, { token });
  assert.strictEqual(s.json.data.status, 'pending');
  assert.strictEqual(s.json.data.plan.plan, 'free');
  assert.strictEqual((await call('/api/deployment/ping', { token })).status, 403);

  payOrder(orderId);
  s = await call(`/api/payment/cashfree/status/${orderId}`, { token });
  assert.strictEqual(s.json.data.status, 'verified');
  assert.strictEqual(s.json.data.plan.plan, 'pro');
  assert.strictEqual((await call('/api/deployment/ping', { token })).status, 200);

  const end1 = (await User.findById(user._id)).subscription.endDate.getTime();
  assert.ok(Math.abs(end1 - (Date.now() + 30 * DAY)) < 60000, 'monthly = 30 days');

  // hammer it: sequential + concurrent
  await call(`/api/payment/cashfree/status/${orderId}`, { token });
  await Promise.all([1, 2, 3, 4, 5].map(() => call(`/api/payment/cashfree/status/${orderId}`, { token })));
  const end2 = (await User.findById(user._id)).subscription.endDate.getTime();
  assert.strictEqual(end2, end1, 'subscription must not be extended more than once per payment');
});

guard('webhook: bad signature rejected, valid one activates, replays are harmless', async () => {
  const { user, token } = await makeUser('buyer3');
  const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'yearly', phone: '9876543210' } });
  const orderId = o.json.data.orderId;
  payOrder(orderId);
  const raw = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: orderId } } });

  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw })).status, 401);
  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw, headers: { 'x-webhook-timestamp': '1', 'x-webhook-signature': 'AAAA' } })).status, 401);
  const tampered = { ...sign(raw) };
  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw.replace(orderId, 'ord_other'), headers: tampered })).status, 401);
  assert.strictEqual((await User.findById(user._id)).subscription.type, 'free', 'nothing activated by rejected webhooks');

  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw, headers: sign(raw) })).status, 200);
  const end1 = (await User.findById(user._id)).subscription.endDate.getTime();
  assert.ok(Math.abs(end1 - (Date.now() + 365 * DAY)) < 60000, 'yearly = 365 days');

  await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw, headers: sign(raw) });
  assert.strictEqual((await User.findById(user._id)).subscription.endDate.getTime(), end1);
});

guard('a validly-signed webhook cannot grant access for an unpaid order', async () => {
  const { user, token } = await makeUser('buyer4');
  const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210' } });
  const raw = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: o.json.data.orderId }, payment: { payment_status: 'SUCCESS' } } });
  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw, headers: sign(raw) })).status, 200);
  assert.strictEqual((await User.findById(user._id)).subscription.type, 'free');
});

guard('amount mismatch is rejected and grants nothing', async () => {
  const { user, token } = await makeUser('buyer5');
  const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'yearly', phone: '9876543210' } });
  payOrder(o.json.data.orderId, { order_amount: 1 });
  const s = await call(`/api/payment/cashfree/status/${o.json.data.orderId}`, { token });
  assert.strictEqual(s.json.data.status, 'rejected');
  assert.strictEqual((await User.findById(user._id)).subscription.type, 'free');
});

guard('renewing while active extends from the current end date', async () => {
  const { user, token } = await makeUser('buyer6');
  const pay = async () => {
    const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210' } });
    payOrder(o.json.data.orderId);
    await call(`/api/payment/cashfree/status/${o.json.data.orderId}`, { token });
  };
  await pay();
  const first = (await User.findById(user._id)).subscription.endDate.getTime();
  await pay();
  const second = (await User.findById(user._id)).subscription.endDate.getTime();
  assert.strictEqual(second - first, 30 * DAY, 'second month is added on top, no days lost');
});

guard('users cannot read or activate another user\'s order', async () => {
  const a = await makeUser('owner1');
  const b = await makeUser('intruder1');
  const o = await call('/api/payment/cashfree/order', { token: a.token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210' } });
  payOrder(o.json.data.orderId);
  assert.strictEqual((await call(`/api/payment/cashfree/status/${o.json.data.orderId}`, { token: b.token })).status, 404);
  assert.strictEqual((await User.findById(b.user._id)).subscription.type, 'free');
});

guard('expired subscriptions lose access immediately', async () => {
  const { user, token } = await makeUser('expired1');
  user.subscription = { type: 'premium', startDate: new Date(Date.now() - 40 * DAY), endDate: new Date(Date.now() - DAY), subscriptionType: 'monthly' };
  await user.save();
  const r = await call('/api/deployment/ping', { token });
  assert.strictEqual(r.status, 403);
  assert.match(r.json.message, /expired/i);
  assert.strictEqual(getEffectivePlan(user).status, 'expired');
});

guard('free plan stops at 10 generations per month; Pro is unlimited', async () => {
  const free = await makeUser('quota1');
  const docs = Array.from({ length: 10 }, (_, i) => ({ userId: free.user._id, type: 'dockerfile', name: 'n' + i, content: 'x', fileName: 'Dockerfile', inputs: {} }));
  await GeneratedFile.insertMany(docs);
  const r = await call('/api/generate/x', { token: free.token, method: 'POST', body: {} });
  assert.strictEqual(r.status, 403);
  assert.strictEqual(r.json.limit, 10);

  const pro = await makeUser('quota2', { subscription: { type: 'premium', endDate: new Date(Date.now() + 5 * DAY) } });
  await GeneratedFile.insertMany(docs.map((d) => ({ ...d, userId: pro.user._id })));
  assert.strictEqual((await call('/api/generate/x', { token: pro.token, method: 'POST', body: {} })).status, 200);

  const fresh = await makeUser('quota3');
  assert.strictEqual((await call('/api/generate/x', { token: fresh.token, method: 'POST', body: {} })).status, 200);
});

guard('manual UPI approval also extends (not resets) and gateway payments cannot be manually approved', async () => {
  const admin = await makeUser('adminmanual', { role: 'admin' });
  const { user } = await makeUser('manualbuyer', { subscription: { type: 'premium', startDate: new Date(), endDate: new Date(Date.now() + 10 * DAY), subscriptionType: 'monthly' } });
  const before = user.subscription.endDate.getTime();
  const p = await Payment.create({ user: user._id, amount: 199, paymentMethod: 'upi', transactionId: 'UPI123456', subscriptionType: 'monthly' });
  const ok = await call(`/api/payment/verify/${p._id}`, { token: admin.token, method: 'PUT', body: { action: 'approve' } });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual((await User.findById(user._id)).subscription.endDate.getTime() - before, 30 * DAY);

  const g = await Payment.create({ user: user._id, amount: 199, paymentMethod: 'cashfree', transactionId: 'ord_x', gatewayOrderId: 'ord_x', subscriptionType: 'monthly' });
  assert.strictEqual((await call(`/api/payment/verify/${g._id}`, { token: admin.token, method: 'PUT', body: { action: 'approve' } })).status, 400);
});

// ---------------------------------------------------------------------------------------------
// Billing: history, invoices, refunds
// ---------------------------------------------------------------------------------------------
async function buy(token, type = 'monthly') {
  const o = await call('/api/payment/cashfree/order', { token, method: 'POST', body: { subscriptionType: type, phone: '9876543210' } });
  const orderId = o.json.data.orderId;
  payOrder(orderId);
  await call(`/api/payment/cashfree/status/${orderId}`, { token });
  return Payment.findOne({ gatewayOrderId: orderId });
}

guard('invoices: sequential numbers, period recorded, private to owner/admin, absent for unpaid', async () => {
  const a = await makeUser('inv_a');
  const b = await makeUser('inv_b');
  const admin = await makeUser('inv_admin', { role: 'admin' });
  const p1 = await buy(a.token);
  const p2 = await buy(b.token, 'yearly');
  const year = new Date().getUTCFullYear();
  assert.match(p1.invoiceNumber, new RegExp(`^INV-${year}-\\d{6}$`));
  assert.strictEqual(Number(p2.invoiceNumber.slice(-6)), Number(p1.invoiceNumber.slice(-6)) + 1, 'sequential, gap-free');
  assert.ok(p1.periodEnd > p1.periodStart);
  assert.ok(Math.abs((p2.periodEnd - p2.periodStart) / 86400000 - 365) < 0.01);

  const inv = await call(`/api/payment/invoice/${p1._id}`, { token: a.token });
  assert.strictEqual(inv.status, 200);
  assert.strictEqual(inv.json.data.total, 199);
  assert.strictEqual(inv.json.data.customer.email, 'inv_a@example.com');
  assert.strictEqual(inv.json.data.status, 'paid');
  assert.ok(!JSON.stringify(inv.json).includes('screenshot'));
  assert.strictEqual((await call(`/api/payment/invoice/${p1._id}`, { token: b.token })).status, 404, 'other users cannot read it');
  assert.strictEqual((await call(`/api/payment/invoice/${p1._id}`, { token: admin.token })).status, 200);
  assert.strictEqual((await call(`/api/payment/invoice/${p1._id}`)).status, 401);

  const o = await call('/api/payment/cashfree/order', { token: a.token, method: 'POST', body: { subscriptionType: 'monthly', phone: '9876543210' } });
  const unpaid = await Payment.findOne({ gatewayOrderId: o.json.data.orderId });
  assert.strictEqual((await call(`/api/payment/invoice/${unpaid._id}`, { token: a.token })).status, 404, 'no invoice for unpaid orders');
  assert.strictEqual((await call('/api/payment/invoice/not-an-id', { token: a.token })).status, 404);
});

guard('payment history lists only my payments and leaks no internal fields', async () => {
  const a = await makeUser('hist_a');
  const b = await makeUser('hist_b');
  await buy(a.token);
  await buy(b.token);
  const h = await call('/api/payment/my-payments', { token: a.token });
  assert.strictEqual(h.status, 200);
  assert.strictEqual(h.json.data.length, 1);
  const row = h.json.data[0];
  assert.strictEqual(row.status, 'verified');
  assert.ok(row.invoiceNumber && row.canRequestRefund === true);
  const text = JSON.stringify(h.json);
  for (const leak of ['screenshotUrl', 'verifiedBy', 'gatewayOrderId', 'transactionId', 'hist_b']) assert.ok(!text.includes(leak), 'leaked ' + leak);
});

guard('refund request: allowed in window once, blocked after the window or for other users', async () => {
  const a = await makeUser('rr_a');
  const b = await makeUser('rr_b');
  const p = await buy(a.token);
  assert.strictEqual((await call(`/api/payment/${p._id}/refund-request`, { token: b.token, method: 'POST', body: {} })).status, 404, 'not your payment: indistinguishable from nonexistent');
  const ok = await call(`/api/payment/${p._id}/refund-request`, { token: a.token, method: 'POST', body: { reason: 'Bought by mistake' } });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual((await Payment.findById(p._id)).refund.status, 'requested');
  assert.strictEqual((await call(`/api/payment/${p._id}/refund-request`, { token: a.token, method: 'POST', body: {} })).status, 400, 'no duplicates');

  const old = await buy((await makeUser('rr_old')).token);
  await Payment.updateOne({ _id: old._id }, { verifiedAt: new Date(Date.now() - 8 * DAY) });
  const owner = await User.findById(old.user);
  const tok = require('jsonwebtoken').sign({ userId: owner._id }, process.env.JWT_SECRET, { algorithm: 'HS256' });
  const late = await call(`/api/payment/${old._id}/refund-request`, { token: tok, method: 'POST', body: {} });
  assert.strictEqual(late.status, 400);
  assert.match(late.json.error, /within 7 days/);
});

guard('admin refund: only admins, takes the period back exactly once, calls the gateway once, never hits the wrong order', async () => {
  const admin = await makeUser('rf_admin', { role: 'admin' });
  const u = await makeUser('rf_user');
  const p = await buy(u.token);
  assert.strictEqual((await User.findById(u.user._id)).subscription.type, 'premium');

  assert.strictEqual((await call(`/api/payment/${p._id}/refund`, { token: u.token, method: 'POST', body: {} })).status, 403, 'customers cannot self-refund');
  const before = gateway.refunds.length;

  // double-click: two simultaneous refunds -> exactly one succeeds
  const results = await Promise.all([1, 2].map(() => call(`/api/payment/${p._id}/refund`, { token: admin.token, method: 'POST', body: { note: 'Requested by customer' } })));
  assert.deepStrictEqual(results.map((r) => r.status).sort(), [200, 400]);
  assert.strictEqual(gateway.refunds.length - before, 1, 'gateway must be called once');
  const call1 = gateway.refunds.at(-1);
  assert.ok(call1.url.includes(p.gatewayOrderId));
  assert.strictEqual(call1.body.refund_amount, 199);
  assert.strictEqual(call1.body.refund_id, `rf_${p._id}`);

  const after = await Payment.findById(p._id);
  assert.strictEqual(after.status, 'refunded');
  assert.strictEqual(after.refund.status, 'refunded');
  const user = await User.findById(u.user._id);
  assert.strictEqual(user.subscription.type, 'free', 'single purchase refunded -> back to Free immediately');
  assert.strictEqual((await call('/api/deployment/ping', { token: u.token })).status, 403, 'Pro access is gone');

  assert.strictEqual((await call(`/api/payment/${p._id}/refund`, { token: admin.token, method: 'POST', body: {} })).status, 400, 'cannot refund twice');
  const inv = await call(`/api/payment/invoice/${p._id}`, { token: u.token });
  assert.strictEqual(inv.json.data.status, 'refunded');
});

guard('refunding one of two purchases removes only that period', async () => {
  const admin = await makeUser('rf2_admin', { role: 'admin' });
  const u = await makeUser('rf2_user');
  const p1 = await buy(u.token);
  await buy(u.token);
  const two = (await User.findById(u.user._id)).subscription.endDate.getTime();
  await call(`/api/payment/${p1._id}/refund`, { token: admin.token, method: 'POST', body: {} });
  const left = (await User.findById(u.user._id)).subscription;
  assert.strictEqual(left.type, 'premium');
  assert.strictEqual(two - left.endDate.getTime(), 30 * DAY);
});

guard('gateway refusal leaves the subscription untouched and the refund retryable', async () => {
  const admin = await makeUser('rf3_admin', { role: 'admin' });
  const u = await makeUser('rf3_user');
  const p = await buy(u.token);
  gateway.refundFails = true;
  const fail = await call(`/api/payment/${p._id}/refund`, { token: admin.token, method: 'POST', body: {} });
  gateway.refundFails = false;
  assert.strictEqual(fail.status, 502);
  assert.strictEqual((await Payment.findById(p._id)).status, 'verified');
  assert.strictEqual((await Payment.findById(p._id)).refund.status, 'failed');
  assert.strictEqual((await User.findById(u.user._id)).subscription.type, 'premium', 'no access taken away when no money moved');
  assert.strictEqual((await call(`/api/payment/${p._id}/refund`, { token: admin.token, method: 'POST', body: {} })).status, 200, 'retry works');
  assert.strictEqual((await User.findById(u.user._id)).subscription.type, 'free');
});

guard('refund webhook (signed) updates a pending refund; unsigned is rejected', async () => {
  const admin = await makeUser('rf4_admin', { role: 'admin' });
  const u = await makeUser('rf4_user');
  const p = await buy(u.token);
  gateway.refundStatus = 'PENDING';
  await call(`/api/payment/${p._id}/refund`, { token: admin.token, method: 'POST', body: {} });
  assert.strictEqual((await Payment.findById(p._id)).refund.status, 'processing');
  assert.strictEqual((await User.findById(u.user._id)).subscription.type, 'free', 'access removed as soon as the refund is initiated');

  gateway.refundStatus = 'SUCCESS';
  const raw = JSON.stringify({ type: 'REFUND_STATUS_WEBHOOK', data: { refund: { order_id: p.gatewayOrderId, refund_id: `rf_${p._id}` } } });
  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw })).status, 401);
  assert.strictEqual((await call('/api/payment/cashfree/webhook', { method: 'POST', body: raw, headers: sign(raw) })).status, 200);
  assert.strictEqual((await Payment.findById(p._id)).refund.status, 'refunded');
});
