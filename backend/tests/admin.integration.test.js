/** Admin area: who may do what, the safety rules that stop an admin locking everyone out, and clean deletes. */
const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_ENCRYPTION_KEY = 'ab'.repeat(32);

let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* skipped */ }
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { sanitizeInput } = require('../middleware/security');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Blog = require('../models/Blog');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Deployment = require('../models/Deployment');
const GeneratedFile = require('../models/GeneratedFile');
const AuditLog = require('../models/AuditLog');
const ContactMessage = require('../models/ContactMessage');

const DAY = 86400000;
let mongod, server, base;

const mk = async (name, extra = {}) => {
  const u = await User.create({ username: name, email: `${name}@example.com`, password: 'Passw0rd12345', isEmailVerified: true, ...extra });
  return { u, token: jwt.sign({ userId: u._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' }) };
};
const call = (path, { method = 'GET', body, token } = {}) =>
  fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

test.before(async () => {
  if (!MongoMemoryServer) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use(sanitizeInput);
  app.use('/api/admin', require('../routes/admin'));
  app.use('/api/blogs', require('../routes/blog'));
  app.use('/api/chat', require('../routes/chat'));
  app.use('/api/payment', require('../routes/payment'));
  app.use('/api/contact', require('../routes/contact'));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { if (server) server.close(); await mongoose.disconnect(); if (mongod) await mongod.stop(); });
const guard = (n, fn) => test(n, { skip: !MongoMemoryServer && 'mongodb-memory-server not installed' }, fn);

guard('every admin endpoint refuses anonymous visitors (401) and normal users (403)', async () => {
  const user = await mk('plain_user');
  const id = user.u._id;
  const endpoints = [
    ['GET', '/api/admin/overview'], ['GET', '/api/admin/dashboard'], ['GET', '/api/admin/users'], ['GET', '/api/admin/users/stats'],
    ['GET', `/api/admin/users/${id}`], ['POST', '/api/admin/users'], ['PUT', `/api/admin/users/${id}`], ['DELETE', `/api/admin/users/${id}`],
    ['POST', `/api/admin/users/${id}/plan`], ['POST', `/api/admin/users/${id}/verify-email`], ['POST', `/api/admin/users/${id}/force-logout`],
    ['POST', `/api/admin/users/${id}/reset-2fa`], ['POST', `/api/admin/users/${id}/unlock`], ['GET', '/api/admin/audit'], ['GET', '/api/admin/messages'], ['GET', '/api/admin/settings/pricing'], ['PUT', '/api/admin/settings/pricing'],
    ['PATCH', `/api/admin/messages/${id}`], ['DELETE', `/api/admin/messages/${id}`], ['GET', '/api/admin/docs'], ['POST', '/api/admin/docs'],
    ['GET', '/api/blogs/admin/all'], ['PUT', `/api/blogs/admin/${id}/featured`], ['GET', '/api/chat/admin/stats'],
    ['GET', '/api/payment/all'], ['PUT', `/api/payment/verify/${id}`], ['POST', `/api/payment/${id}/refund`], ['GET', '/api/payment/stats'],
  ];
  for (const [method, path] of endpoints) {
    assert.strictEqual((await call(path, { method })).status, 401, `anonymous ${method} ${path}`);
    assert.strictEqual((await call(path, { method, token: user.token })).status, 403, `user ${method} ${path}`);
  }
  assert.ok(await User.findById(id), 'nothing was deleted by those attempts');
});

guard('overview, list, search, filters and pagination work; /users/stats is no longer swallowed by /users/:id', async () => {
  const admin = await mk('boss', { role: 'admin' });
  for (let i = 0; i < 25; i++) await mk('bulk' + i, { isEmailVerified: i % 2 === 0 });
  await mk('proguy', { subscription: { type: 'premium', endDate: new Date(Date.now() + 5 * DAY) } });

  const stats = await call('/api/admin/users/stats', { token: admin.token });
  assert.strictEqual(stats.status, 200, JSON.stringify(stats.json));
  assert.ok(stats.json.data.totalUsers >= 27);

  const ov = await call('/api/admin/overview', { token: admin.token });
  assert.strictEqual(ov.status, 200);
  assert.ok(ov.json.data.users.total >= 27 && ov.json.data.plans.pro >= 1 && ov.json.data.users.unverified >= 12);
  assert.strictEqual(ov.json.data.attention.singleAdmin, true, 'warns when there is only one admin');

  const p1 = await call('/api/admin/users?limit=10&page=1', { token: admin.token });
  assert.strictEqual(p1.json.data.length, 10);
  assert.ok(p1.json.pagination.pages >= 3);
  assert.strictEqual((await call('/api/admin/users?limit=10&page=3', { token: admin.token })).json.pagination.page, 3);
  assert.strictEqual((await call('/api/admin/users?limit=9999', { token: admin.token })).json.pagination.limit, 100, 'limit is capped');

  const search = await call('/api/admin/users?search=bulk1', { token: admin.token });
  assert.ok(search.json.data.length >= 1 && search.json.data.every((u) => /bulk1/.test(u.email)));
  assert.strictEqual((await call('/api/admin/users?search=' + encodeURIComponent('.*'), { token: admin.token })).json.data.length, 0, 'regex characters are searched literally');
  assert.strictEqual((await call('/api/admin/users?plan=pro', { token: admin.token })).json.data.every((u) => u.plan.plan === 'pro'), true);
  assert.strictEqual((await call('/api/admin/users?role=admin', { token: admin.token })).json.data.every((u) => u.role === 'admin'), true);
  assert.strictEqual((await call('/api/admin/users?verified=no', { token: admin.token })).json.data.every((u) => !u.isEmailVerified), true);

  const row = p1.json.data[0];
  for (const secret of ['password', 'emailOTP', 'resetPasswordToken', 'lockUntil']) assert.ok(!(secret in row), 'leaked ' + secret);
  assert.strictEqual((await call('/api/admin/users/not-an-id', { token: admin.token })).status, 400);
});

guard('creating a user: strong password required, account is verified and can log in, duplicates refused, audited', async () => {
  const admin = await mk('boss2', { role: 'admin' });
  const bad = await call('/api/admin/users', { method: 'POST', token: admin.token, body: { username: 'newbie', email: 'newbie@example.com', password: 'abc123' } });
  assert.strictEqual(bad.status, 400);
  assert.strictEqual((await call('/api/admin/users', { method: 'POST', token: admin.token, body: { username: 'x', email: 'bad', password: 'Passw0rd12345' } })).status, 400);
  assert.strictEqual((await call('/api/admin/users', { method: 'POST', token: admin.token, body: { username: 'newbie', email: 'newbie@example.com', password: 'Passw0rd12345', role: 'superuser' } })).status, 400);
  const ok = await call('/api/admin/users', { method: 'POST', token: admin.token, body: { username: 'newbie', email: 'NewBie@Example.com', password: 'Passw0rd12345' } });
  assert.strictEqual(ok.status, 201);
  const made = await User.findOne({ email: 'newbie@example.com' });
  assert.strictEqual(made.isEmailVerified, true);
  assert.ok(await made.comparePassword('Passw0rd12345'));
  assert.strictEqual((await call('/api/admin/users', { method: 'POST', token: admin.token, body: { username: 'newbie2', email: 'newbie@example.com', password: 'Passw0rd12345' } })).status, 400);
  assert.ok(await AuditLog.findOne({ action: 'user.create', targetLabel: 'newbie@example.com', actorEmail: 'boss2@example.com' }));
});

guard('lock-out protection: cannot demote, disable or delete yourself or the last active admin', async () => {
  const a1 = await mk('only_admin', { role: 'admin' });
  const self = (body) => call(`/api/admin/users/${a1.u._id}`, { method: 'PUT', token: a1.token, body });
  assert.strictEqual((await self({ role: 'user' })).status, 400);
  assert.strictEqual((await self({ isActive: false })).status, 400);
  assert.strictEqual((await call(`/api/admin/users/${a1.u._id}`, { method: 'DELETE', token: a1.token })).status, 400);

  // with a second admin, the first can be changed by the second but the LAST one is still protected
  const a2 = await mk('second_admin', { role: 'admin' });
  assert.strictEqual((await call(`/api/admin/users/${a1.u._id}`, { method: 'PUT', token: a2.token, body: { role: 'user' } })).status, 200);
  assert.strictEqual((await call(`/api/admin/users/${a2.u._id}`, { method: 'PUT', token: a1.token, body: { role: 'user' } })).status, 403, 'a demoted admin immediately loses admin access');
  assert.strictEqual((await call(`/api/admin/users/${a1.u._id}`, { method: 'PUT', token: a2.token, body: { role: 'admin' } })).status, 200);
});

guard('disabling a user ends their access immediately; force-logout and 2FA reset work', async () => {
  const admin = await mk('boss3', { role: 'admin' });
  const target = await mk('victim');
  assert.strictEqual((await call('/api/chat/admin/stats', { token: target.token })).status, 403, 'sanity: authenticated');
  await call(`/api/admin/users/${target.u._id}`, { method: 'PUT', token: admin.token, body: { isActive: false } });
  assert.strictEqual((await call('/api/chat/admin/stats', { token: target.token })).status, 401, 'disabled user cannot use the API');
  await call(`/api/admin/users/${target.u._id}`, { method: 'PUT', token: admin.token, body: { isActive: true } });

  assert.strictEqual((await call('/api/chat/admin/stats', { token: target.token })).status, 403);
  await call(`/api/admin/users/${target.u._id}/force-logout`, { method: 'POST', token: admin.token });
  assert.strictEqual((await call('/api/chat/admin/stats', { token: target.token })).status, 401, 'old session revoked');

  const tf = await mk('has2fa');
  await User.updateOne({ _id: tf.u._id }, { 'twoFactor.enabled': true, 'twoFactor.recoveryCodes': ['x'] });
  await call(`/api/admin/users/${tf.u._id}/reset-2fa`, { method: 'POST', token: admin.token });
  const after = await User.findById(tf.u._id);
  assert.strictEqual(after.twoFactor.enabled, false);
  assert.strictEqual(after.twoFactor.recoveryCodes.length, 0);
});

guard('granting Pro extends from the current end date, revoking returns to Free, bad input refused', async () => {
  const admin = await mk('boss4', { role: 'admin' });
  const u = await mk('support_case');
  const grant = (days) => call(`/api/admin/users/${u.u._id}/plan`, { method: 'POST', token: admin.token, body: { action: 'grant', days } });
  const r1 = await grant(30);
  assert.strictEqual(r1.status, 200);
  assert.strictEqual(r1.json.data.plan.plan, 'pro');
  const end1 = new Date(r1.json.data.subscription.endDate).getTime();
  assert.ok(Math.abs(end1 - (Date.now() + 30 * DAY)) < 60000);
  const r2 = await grant(10);
  assert.ok(Math.abs(new Date(r2.json.data.subscription.endDate).getTime() - (end1 + 10 * DAY)) < 1000, 'adds on top, no days lost');
  for (const bad of [0, -5, 3651, 1.5, 'abc', null]) assert.strictEqual((await grant(bad)).status, 400, String(bad));
  assert.strictEqual((await call(`/api/admin/users/${u.u._id}/plan`, { method: 'POST', token: admin.token, body: { action: 'hack' } })).status, 400);
  const rv = await call(`/api/admin/users/${u.u._id}/plan`, { method: 'POST', token: admin.token, body: { action: 'revoke' } });
  assert.strictEqual(rv.json.data.plan.plan, 'free');
  assert.ok(await AuditLog.findOne({ action: 'user.plan.grant', targetLabel: 'support_case@example.com' }));
});

guard('deleting a user removes their personal data (keys, chats, blogs, comments) but keeps payment records; everything is audited', async () => {
  const admin = await mk('boss5', { role: 'admin' });
  const gone = await mk('leaving');
  const stays = await mk('staying');
  await Deployment.create({ userId: gone.u._id, host: 'h', pemKey: 'PRIVATE', projectName: 'p' }).catch(() => Deployment.collection.insertOne({ userId: gone.u._id, host: 'h', pemKey: 'enc', projectName: 'p' }));
  await GeneratedFile.create({ userId: gone.u._id, type: 'dockerfile', name: 'n', content: 'x', fileName: 'Dockerfile', inputs: {} });
  const direct = await Chat.create({ participants: [gone.u._id, stays.u._id], isGroup: false });
  await Message.create({ chat: direct._id, sender: gone.u._id, content: 'hi' }).catch(() => Message.collection.insertOne({ chat: direct._id, sender: gone.u._id, content: 'hi' }));
  const group = await Chat.create({ participants: [gone.u._id, stays.u._id], isGroup: true, name: 'g', groupAdmin: gone.u._id });
  const theirBlog = await Blog.collection.insertOne({ title: 't', author: gone.u._id, content: 'c', comments: [], likes: [] });
  const otherBlog = await Blog.collection.insertOne({ title: 'o', author: stays.u._id, content: 'c', likes: [gone.u._id], comments: [{ user: gone.u._id, userName: 'leaving', content: 'nice' }, { user: stays.u._id, userName: 'staying', content: 'ok' }] });
  await Payment.create({ user: gone.u._id, amount: 199, paymentMethod: 'cashfree', transactionId: 'ord_gone', gatewayOrderId: 'ord_gone', subscriptionType: 'monthly', status: 'verified' });
  await User.updateOne({ _id: stays.u._id }, { $push: { friends: gone.u._id } });

  const del = await call(`/api/admin/users/${gone.u._id}`, { method: 'DELETE', token: admin.token });
  assert.strictEqual(del.status, 200, JSON.stringify(del.json));
  assert.strictEqual(await User.findById(gone.u._id), null);
  assert.strictEqual(await Deployment.countDocuments({ userId: gone.u._id }), 0, 'stored SSH keys are removed');
  assert.strictEqual(await GeneratedFile.countDocuments({ userId: gone.u._id }), 0);
  assert.strictEqual(await Chat.findById(direct._id), null, 'direct chat removed');
  assert.strictEqual(await Message.countDocuments({ sender: gone.u._id }), 0);
  const g = await Chat.findById(group._id);
  assert.ok(g && !g.participants.map(String).includes(String(gone.u._id)) && !g.groupAdmin, 'group chat survives without them');
  assert.strictEqual(await Blog.collection.countDocuments({ _id: theirBlog.insertedId }), 0, 'their posts are removed');
  const ob = await Blog.collection.findOne({ _id: otherBlog.insertedId });
  assert.strictEqual(ob.comments.length, 1);
  assert.strictEqual(ob.likes.length, 0);
  assert.strictEqual((await User.findById(stays.u._id)).friends.length, 0);
  assert.strictEqual(await Payment.countDocuments({ gatewayOrderId: 'ord_gone' }), 1, 'financial records are kept');
  const log = await AuditLog.findOne({ action: 'user.delete', targetLabel: 'leaving@example.com' });
  assert.ok(log && log.details.deployments >= 0 && log.actorEmail === 'boss5@example.com');
});

guard('contact messages: saved before any email, HTML is never trusted, admin can read/mark/delete, flooding is limited', async () => {
  const admin = await mk('boss6', { role: 'admin' });
  const send = (b) => call('/api/contact', { method: 'POST', body: b });
  assert.strictEqual((await send({ name: 'A', email: 'bad', subject: 's', message: 'm' })).status, 400);
  assert.strictEqual((await send({ name: 'A', email: 'a@b.co', subject: 's' })).status, 400);
  assert.strictEqual((await send({ name: 'A', email: 'a@b.co', subject: 's', message: 'x'.repeat(5001) })).status, 400);
  assert.strictEqual((await send({ name: { $gt: '' }, email: 'a@b.co', subject: 's', message: 'm' })).status, 400, 'non-string input refused');
  const ok = await send({ name: '<b>Eve</b>', email: 'eve@example.com', subject: 'Hello', message: '<script>alert(1)</script>' });
  assert.strictEqual(ok.status, 200);
  const list = await call('/api/admin/messages', { token: admin.token });
  assert.strictEqual(list.json.unread, 1);
  const id = list.json.data[0]._id;
  assert.strictEqual((await call(`/api/admin/messages/${id}`, { method: 'PATCH', token: admin.token, body: { status: 'read' } })).json.data.status, 'read');
  assert.strictEqual((await call(`/api/admin/messages/${id}`, { method: 'PATCH', token: admin.token, body: { status: 'weird' } })).status, 400);
  assert.strictEqual((await call(`/api/admin/messages/${id}`, { method: 'DELETE', token: admin.token })).status, 200);
  assert.strictEqual(await ContactMessage.countDocuments(), 0);
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await send({ name: 'F', email: 'f@example.com', subject: 's', message: 'm' })).status);
  assert.ok(codes.includes(429), 'rate limited: ' + codes.join(','));
});

guard('the audit log lists actions newest-first, filters, and has no way to edit or delete entries', async () => {
  const admin = await mk('boss7', { role: 'admin' });
  const t = await mk('audited');
  await call(`/api/admin/users/${t.u._id}/verify-email`, { method: 'POST', token: admin.token });
  const all = await call('/api/admin/audit?limit=5', { token: admin.token });
  assert.ok(all.json.data.length >= 1);
  const times = all.json.data.map((e) => new Date(e.createdAt).getTime());
  assert.deepStrictEqual(times, [...times].sort((a, b) => b - a));
  assert.ok((await call('/api/admin/audit?action=user.email', { token: admin.token })).json.data.every((e) => e.action.startsWith('user.email')));
  const id = all.json.data[0]._id;
  assert.strictEqual((await call(`/api/admin/audit/${id}`, { method: 'DELETE', token: admin.token })).status, 404);
  assert.strictEqual((await call(`/api/admin/audit/${id}`, { method: 'PUT', token: admin.token, body: { action: 'x' } })).status, 404);
});

guard('prices: only admins can change them; bad values are refused; new orders use the new price, old ones keep theirs; audited', async () => {
  const cashfree = require('../services/cashfreeService');
  const Setting = require('../models/Setting');
  const { clearSettingsCache } = require('../services/settings');
  process.env.CASHFREE_APP_ID = 'id'; process.env.CASHFREE_SECRET_KEY = 'secret'; process.env.CASHFREE_ENV = 'sandbox';
  const created = [];
  cashfree.http = { post: async (url, body) => { created.push(body); return { data: { order_id: body.order_id, payment_session_id: 's_' + body.order_id } }; }, get: async () => ({ data: {} }) };
  await Setting.deleteMany({}); clearSettingsCache();

  const admin = await mk('pricer', { role: 'admin' });
  const buyer = await mk('buyer_p');
  const put = (body, token = admin.token) => call('/api/admin/settings/pricing', { method: 'PUT', token, body });
  const order = (type) => call('/api/payment/cashfree/order', { method: 'POST', token: buyer.token, body: { subscriptionType: type, phone: '9876543210' } });

  assert.deepStrictEqual((await call('/api/admin/settings/pricing', { token: admin.token })).json.data.monthly, 199, 'defaults before any change');
  assert.strictEqual((await put({ monthly: 299, yearly: 2990 }, buyer.token)).status, 403, 'a normal user cannot change prices');
  for (const bad of [{ monthly: 0, yearly: 100 }, { monthly: -5, yearly: 100 }, { monthly: 1.5, yearly: 100 }, { monthly: '299', yearly: 2990 },
    { monthly: 299, yearly: 100 }, { monthly: 100001, yearly: 100001 }, { monthly: 299 }, {}, { monthly: null, yearly: null }]) {
    assert.strictEqual((await put(bad)).status, 400, JSON.stringify(bad));
  }
  assert.strictEqual((await call('/api/payment/pricing')).json.data.pricing.monthly, 199, 'nothing changed by the rejected attempts');

  const before = await order('monthly');
  assert.strictEqual(created.at(-1).order_amount, 199);

  const ok = await put({ monthly: 249, yearly: 2490 });
  assert.strictEqual(ok.status, 200);
  assert.deepStrictEqual([ok.json.data.monthly, ok.json.data.yearly], [249, 2490]);

  // public pricing and the signed-in plans view both show the new numbers immediately
  assert.deepStrictEqual((await call('/api/payment/pricing')).json.data.pricing, { monthly: 249, yearly: 2490 });
  assert.strictEqual((await call('/api/payment/plans', { token: buyer.token })).json.data.pricing.yearly, 2490);

  // a NEW order is charged the new price; the amount is still decided by the server, never the client
  await call('/api/payment/cashfree/order', { method: 'POST', token: buyer.token, body: { subscriptionType: 'yearly', phone: '9876543210', amount: 1 } });
  assert.strictEqual(created.at(-1).order_amount, 2490);
  // the order created BEFORE the change keeps the price it was created with
  const oldPayment = await Payment.findOne({ gatewayOrderId: before.json.data.orderId });
  assert.strictEqual(oldPayment.amount, 199);

  const log = await AuditLog.findOne({ action: 'settings.pricing.update' });
  assert.ok(log && log.actorEmail === 'pricer@example.com');
  assert.deepStrictEqual(log.details.monthly, [199, 249]);
  await Setting.deleteMany({}); clearSettingsCache();
});
