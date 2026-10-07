/** Linux sandbox: plan gating, lab secrecy, progress/XP rules, daily limits and the safety guards that do not need Docker. */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_ENCRYPTION_KEY = 'ab'.repeat(32);
delete process.env.SANDBOX_ENABLED;

let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* skipped */ }
let ioClient;
try { ({ io: ioClient } = require(path.join('..', '..', 'frontend', 'node_modules', 'socket.io-client'))); } catch { /* socket test skipped */ }
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GeneratedFile = require('../models/GeneratedFile');
const LabProgress = require('../models/LabProgress');
const { LABS, getLab } = require('../services/sandbox/labs');
const progress = require('../services/sandbox/progress');
const manager = require('../services/sandbox/sandboxManager');
const { getEffectivePlan } = require('../services/plans');

let mongod, server, base;
const mk = async (name, extra = {}) => {
  const u = await User.create({ username: name, email: `${name}@example.com`, password: 'Passw0rd12345', isEmailVerified: true, ...extra });
  return { u, token: jwt.sign({ userId: u._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' }) };
};
const call = (p, token) => fetch(base + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  .then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));
const pro = () => ({ subscription: { type: 'premium', endDate: new Date(Date.now() + 86400000 * 30) } });

test.before(async () => {
  if (!MongoMemoryServer) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/sandbox', require('../routes/sandbox'));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { if (server) server.close(); await mongoose.disconnect(); if (mongod) await mongod.stop(); });
const guard = (n, fn) => test(n, { skip: !MongoMemoryServer && 'mongodb-memory-server not installed' }, fn);

guard('sandbox API needs a signed-in user', async () => {
  for (const p of ['/status', '/labs', '/progress', '/generated']) assert.strictEqual((await call('/api/sandbox' + p)).status, 401, p);
});

guard('free users see beginner labs unlocked and the rest locked; Pro sees all; no answers ever leak', async () => {
  const free = await mk('sbx_free');
  const paid = await mk('sbx_pro', pro());
  const f = (await call('/api/sandbox/labs', free.token)).json.data.labs;
  const p = (await call('/api/sandbox/labs', paid.token)).json.data.labs;
  assert.strictEqual(f.length, LABS.length);
  assert.ok(f.filter((l) => l.level === 'beginner').every((l) => !l.locked));
  assert.ok(f.filter((l) => l.level !== 'beginner').every((l) => l.locked));
  assert.ok(p.every((l) => !l.locked));
  const raw = JSON.stringify(f);
  for (const k of ['"setup"', '"check"', '"solution"', '"hints"']) assert.ok(!raw.includes(k), `payload leaks ${k}`);
  assert.ok(!raw.includes('ALPHA-7421'), 'a lab answer leaked');
});

guard('status reports the sandbox as disabled until SANDBOX_ENABLED=true, and the plan limits', async () => {
  const free = await mk('sbx_status');
  const s = (await call('/api/sandbox/status', free.token)).json.data;
  assert.strictEqual(s.enabled, false);
  assert.strictEqual(s.available, false);
  assert.strictEqual(s.plan, 'free');
  assert.deepStrictEqual(s.limits.levels, ['beginner']);
  assert.ok(s.limits.sessionMinutes < getEffectivePlan({ role: 'admin' }).sandbox.sessionMinutes);
});

guard('generated-file list only ever contains the caller\'s own files', async () => {
  const a = await mk('sbx_a'); const b = await mk('sbx_b');
  await GeneratedFile.create({ userId: a.u._id, type: 'bash', name: 'mine', content: 'echo a', inputs: {}, fileName: 'a.sh' });
  await GeneratedFile.create({ userId: b.u._id, type: 'bash', name: 'theirs', content: 'echo b', inputs: {}, fileName: 'b.sh' });
  const r = (await call('/api/sandbox/generated', a.token)).json.data;
  assert.deepStrictEqual(r.map((x) => x.name), ['mine']);
  assert.ok(!('content' in r[0]), 'list must not include file bodies');
});

guard('daily session limit is enforced atomically and refunds work', async () => {
  const { u } = await mk('sbx_limit');
  const results = await Promise.all(Array.from({ length: 8 }, () => progress.consumeSession(u._id, 5)));
  assert.strictEqual(results.filter(Boolean).length, 5, 'exactly 5 of 8 concurrent starts may pass');
  assert.strictEqual(await progress.consumeSession(u._id, 5), false);
  await progress.refundSession(u._id);
  assert.strictEqual(await progress.consumeSession(u._id, 5), true);
  // a new day resets the counter
  await LabProgress.updateOne({ user: u._id }, { $set: { 'usage.day': '2000-01-01' } });
  assert.strictEqual(await progress.consumeSession(u._id, 5), true);
  assert.strictEqual((await progress.getProgress(u._id)).sessionsToday, 1);
});

guard('XP is awarded once per lab, hints reduce it (never below half), and level certificates need every lab', async () => {
  const { u } = await mk('sbx_xp');
  await progress.consumeSession(u._id, 5); // creates the progress document, like a real session start
  const lab = getLab('grep-logs'); // beginner = 10 XP
  assert.strictEqual(await progress.completeLab(u._id, lab, 0), 10);
  assert.strictEqual(await progress.completeLab(u._id, lab, 0), 0, 'second completion pays nothing');
  assert.strictEqual(await progress.completeLab(u._id, getLab('nav-basics'), 1), 7);
  assert.strictEqual(await progress.completeLab(u._id, getLab('file-ops'), 99), 5, 'floor is half the XP');
  let p = await progress.getProgress(u._id);
  assert.strictEqual(p.xp, 22);
  assert.strictEqual(p.levels.beginner.certified, false);
  for (const l of LABS.filter((x) => x.level === 'beginner')) await progress.completeLab(u._id, l, 0);
  p = await progress.getProgress(u._id);
  assert.strictEqual(p.levels.beginner.certified, true);
  assert.strictEqual(p.levels.advanced.certified, false);
  const dup = await LabProgress.findOne({ user: u._id });
  assert.strictEqual(new Set(dup.completed.map((c) => c.labId)).size, dup.completed.length, 'no duplicate completions');
});

test('manager refuses to run when disabled, and never talks to Docker then', async () => {
  assert.strictEqual(manager.isEnabled(), false);
  assert.strictEqual(await manager.isAvailable(), false);
  await assert.rejects(manager.start({ userId: 'u1' }), { code: 'DISABLED' });
  await assert.rejects(manager.check('u1'), { code: 'NO_SESSION' });
  await assert.rejects(manager.putFile('u1', 'a.sh', 'x'), { code: 'NO_SESSION' });
  assert.throws(() => manager.startShare('u1'), { code: 'NO_SESSION' });
  assert.strictEqual(manager.write('u1', 'ls\n'), false);
  assert.strictEqual(manager.sessionByShare('NOPE'), null);
});

test('a remote Docker host without TLS is rejected (it would be root on that machine)', async () => {
  process.env.SANDBOX_ENABLED = 'true';
  process.env.SANDBOX_DOCKER_HOST = 'tcp://203.0.113.9:2375';
  delete process.env.SANDBOX_DOCKER_TLS_DIR;
  try {
    // fresh module so the cached client is not reused
    delete require.cache[require.resolve('../services/sandbox/sandboxManager')];
    const fresh = require('../services/sandbox/sandboxManager');
    await assert.rejects(fresh.start({ userId: 'u2' }), { code: 'INSECURE_DOCKER_HOST' });
  } finally {
    delete process.env.SANDBOX_ENABLED; delete process.env.SANDBOX_DOCKER_HOST;
    delete require.cache[require.resolve('../services/sandbox/sandboxManager')];
  }
});

test('socket: start is refused cleanly while disabled and the daily counter is refunded; hints need a session', { skip: (!ioClient && 'socket.io-client not installed') || (!MongoMemoryServer && 'mongodb-memory-server not installed') }, async () => {
  const { u } = await mk('sbx_sock');
  const srv = http.createServer();
  const io = require('socket.io')(srv);
  require('../sandboxSocket').register(io, (socket, next) => { socket.userId = String(socket.handshake.auth.userId); next(); });
  await new Promise((r) => srv.listen(0, r));
  const c = ioClient(`http://127.0.0.1:${srv.address().port}/sandbox`, { auth: { userId: String(u._id) }, transports: ['websocket'] });
  const emit = (ev, data) => new Promise((res) => (data === undefined ? c.emit(ev, res) : c.emit(ev, data, res)));
  try {
    await new Promise((r) => c.on('connect', r));
    const start = await emit('start', { labId: 'grep-logs' });
    assert.strictEqual(start.ok, false);
    assert.strictEqual((await progress.getProgress(u._id)).sessionsToday, 0, 'failed start must not use up a daily session');
    const locked = await emit('start', { labId: 'incident-cpu-hog' });
    assert.strictEqual(locked.code, 'UPGRADE_REQUIRED');
    assert.strictEqual((await emit('start', { labId: { $ne: 1 } })).code, 'BAD_LAB');
    assert.strictEqual((await emit('hint')).ok, false);
    assert.strictEqual((await emit('check')).ok, false);
    assert.strictEqual((await emit('share-join', { code: 'ABCDEF0123' })).ok, false);
    assert.strictEqual((await emit('attach')).ok, false);
  } finally { c.close(); io.close(); srv.close(); }
});
