/**
 * End-to-end auth flow: register -> OTP -> login -> lockout -> forgot/reset password -> session invalidation.
 * Real routes + real MongoDB (in-memory). Only outgoing email is captured instead of sent.
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_ENCRYPTION_KEY = 'ab'.repeat(32);

const nodemailer = require('nodemailer');
const outbox = [];
nodemailer.createTransport = () => ({ sendMail: async (m) => { outbox.push(m); } });

let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* skipped below */ }

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sanitizeInput } = require('../middleware/security');

let mongod, server, base, ipSeq = 0;

const call = (path, { method = 'GET', body, token, ip, cookie, csrf } = {}) =>
  fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json', 'X-Forwarded-For': ip,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: `session=${cookie}` } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})), setCookie: r.headers.get('set-cookie') || '' }));

const sessionFrom = (res) => (res.setCookie.match(/session=([^;]+)/) || [])[1];

// each test gets its own client IP so the per-IP rate limiters don't interfere with each other
const newIp = () => `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const lastMail = (to) => [...outbox].reverse().find((m) => m.to === to);
const otpFrom = (mail) => mail.html.match(/>\s*(\d{6})\s*</)[1];
const resetTokenFrom = (mail) => mail.html.match(/reset-password\?token=([a-f0-9]{64})/)[1];

test.before(async () => {
  if (!MongoMemoryServer) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use(sanitizeInput);
  app.use('/api/auth', require('../routes/auth'));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const guard = (name, fn) => test(name, { skip: !MongoMemoryServer && 'mongodb-memory-server not installed' }, fn);
const signup = (email, over = {}) => call('/api/auth/register', { method: 'POST', ip: over.ip, body: { username: email.split('@')[0], email, password: 'Str0ngPassw0rd!', workExperience: '3-5 years', domains: ['Docker'], ...over.body } });

guard('registration enforces the same password rule as the form, and never emails/stores plaintext codes', async () => {
  const ip = newIp();
  const weak = await signup('weak@example.com', { ip, body: { password: 'Short1abc' } }); // 9 chars
  assert.strictEqual(weak.status, 400);
  assert.match(weak.json.details, /at least 10/);
  assert.strictEqual(await User.countDocuments({ email: 'weak@example.com' }), 0);

  const ok = await signup('flow1@example.com', { ip });
  assert.ok([200, 201].includes(ok.status), JSON.stringify(ok.json));
  const user = await User.findOne({ email: 'flow1@example.com' });
  const otp = otpFrom(lastMail('flow1@example.com'));
  assert.match(otp, /^\d{6}$/);
  assert.notStrictEqual(user.emailOTP, otp, 'OTP must be stored hashed');
  assert.strictEqual(user.emailOTP.length, 64);
});

guard('login order: unverified accounts are only revealed after the correct password; errors are identical for unknown email / wrong password', async () => {
  const ip = newIp();
  await signup('flow2@example.com', { ip });
  const unknown = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'nobody@example.com', password: 'Str0ngPassw0rd!' } });
  const wrongPw = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow2@example.com', password: 'Wr0ngPassword!!' } });
  assert.strictEqual(unknown.status, 401);
  assert.deepStrictEqual(wrongPw.json, unknown.json, 'must not reveal which part was wrong');

  const unverified = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow2@example.com', password: 'Str0ngPassw0rd!' } });
  assert.strictEqual(unverified.status, 403);
  assert.strictEqual(unverified.json.error, 'Email not verified');
});

guard('OTP: wrong codes are limited, the right code verifies, then login returns a token and plan', async () => {
  const ip = newIp();
  await signup('flow3@example.com', { ip });
  const otp = otpFrom(lastMail('flow3@example.com'));
  const wrong = otp === '000000' ? '111111' : '000000';

  for (let i = 0; i < 5; i++) {
    const r = await call('/api/auth/verify-otp', { method: 'POST', ip, body: { email: 'flow3@example.com', otp: wrong } });
    assert.strictEqual(r.status, 400);
  }
  // attempts exhausted: even the correct code is refused until a new one is requested
  const locked = await call('/api/auth/verify-otp', { method: 'POST', ip, body: { email: 'flow3@example.com', otp } });
  assert.strictEqual(locked.status, 429);

  await call('/api/auth/resend-otp', { method: 'POST', ip, body: { email: 'flow3@example.com' } });
  const fresh = otpFrom(lastMail('flow3@example.com'));
  const verified = await call('/api/auth/verify-otp', { method: 'POST', ip, body: { email: 'flow3@example.com', otp: fresh } });
  assert.strictEqual(verified.status, 200);

  const login = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow3@example.com', password: 'Str0ngPassw0rd!' } });
  assert.strictEqual(login.status, 200);
  assert.ok(!('token' in login.json), 'the session token must not be exposed to page scripts');
  assert.ok(sessionFrom(login), 'session cookie must be set');
  assert.strictEqual(login.json.user.plan.plan, 'free');
  assert.ok(!('password' in login.json.user));
  assert.strictEqual(login.json.user.workExperience, '3-5 years', 'login returns what personalisation needs');
  assert.deepStrictEqual(login.json.user.domains, ['Docker']);
});

guard('verify-otp does not reveal whether an email exists and ignores operator injection', async () => {
  const ip = newIp();
  const ghost = await call('/api/auth/verify-otp', { method: 'POST', ip, body: { email: 'ghost@example.com', otp: '123456' } });
  assert.strictEqual(ghost.status, 400);
  const inj = await call('/api/auth/verify-otp', { method: 'POST', ip, body: { email: { $gt: '' }, otp: '123456' } });
  assert.ok([400].includes(inj.status), String(inj.status));
});

guard('five wrong passwords lock the account, even for the right password', async () => {
  const ip = newIp();
  await signup('flow4@example.com', { ip });
  await User.updateOne({ email: 'flow4@example.com' }, { isEmailVerified: true });
  for (let i = 0; i < 5; i++) await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow4@example.com', password: 'Wr0ngPassword!!' } });
  const locked = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow4@example.com', password: 'Str0ngPassw0rd!' } });
  assert.strictEqual(locked.status, 429);
  assert.match(locked.json.error, /locked/i);
});

guard('password reset: weak passwords rejected, token is single-use, old sessions die, new password works', async () => {
  const ip = newIp();
  await signup('flow5@example.com', { ip });
  await User.updateOne({ email: 'flow5@example.com' }, { isEmailVerified: true });
  const login = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow5@example.com', password: 'Str0ngPassw0rd!' } });
  const oldToken = sessionFrom(login);
  assert.strictEqual((await call('/api/auth/profile', { token: oldToken, ip })).status, 200);

  // unknown address: same response, no email
  const before = outbox.length;
  const ghost = await call('/api/auth/forgot-password', { method: 'POST', ip, body: { email: 'ghost2@example.com' } });
  assert.strictEqual(ghost.status, 200);
  assert.strictEqual(outbox.length, before);

  await call('/api/auth/forgot-password', { method: 'POST', ip, body: { email: 'flow5@example.com' } });
  const token = resetTokenFrom(lastMail('flow5@example.com'));
  const stored = await User.findOne({ email: 'flow5@example.com' });
  assert.notStrictEqual(stored.resetPasswordToken, token, 'reset token must be stored hashed');

  const weak = await call('/api/auth/reset-password', { method: 'POST', ip, body: { token, password: 'short1', confirmPassword: 'short1' } });
  assert.strictEqual(weak.status, 400);
  const common = await call('/api/auth/reset-password', { method: 'POST', ip, body: { token, password: 'password123', confirmPassword: 'password123' } });
  assert.strictEqual(common.status, 400);

  await new Promise((r) => setTimeout(r, 1100)); // JWT iat has 1-second resolution
  const ok = await call('/api/auth/reset-password', { method: 'POST', ip, body: { token, password: 'N3wStr0ngPassw0rd', confirmPassword: 'N3wStr0ngPassw0rd' } });
  assert.strictEqual(ok.status, 200);

  const reuse = await call('/api/auth/reset-password', { method: 'POST', ip, body: { token, password: 'An0therStr0ngPass', confirmPassword: 'An0therStr0ngPass' } });
  assert.strictEqual(reuse.status, 400, 'token must be single-use');

  assert.strictEqual((await call('/api/auth/profile', { token: oldToken, ip })).status, 401, 'pre-reset sessions must be revoked');
  assert.strictEqual((await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow5@example.com', password: 'Str0ngPassw0rd!' } })).status, 401);
  assert.strictEqual((await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow5@example.com', password: 'N3wStr0ngPassw0rd' } })).status, 200);
});

guard('Google/GitHub sign-in endpoints no longer exist', async () => {
  const ip = newIp();
  for (const p of ['/api/auth/google', '/api/auth/github', '/api/auth/callback/google', '/api/auth/callback/github']) {
    assert.strictEqual((await call(p, { ip })).status, 404, p);
  }
});

guard('session cookie is HttpOnly + SameSite and works for reads; writes need the CSRF token', async () => {
  const ip = newIp();
  await signup('cookie1@example.com', { ip });
  await User.updateOne({ email: 'cookie1@example.com' }, { isEmailVerified: true });
  const login = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'cookie1@example.com', password: 'Str0ngPassw0rd!' } });
  assert.match(login.setCookie, /HttpOnly/i);
  assert.match(login.setCookie, /SameSite=Lax/i);
  const cookie = sessionFrom(login);
  const csrf = login.json.csrfToken;
  assert.match(csrf, /^[a-f0-9]{64}$/);

  const profile = await call('/api/auth/profile', { cookie, ip });
  assert.strictEqual(profile.status, 200);
  assert.strictEqual(profile.json.csrfToken, csrf, 'profile re-issues the same CSRF token for a page reload');

  // state-changing request with only the cookie = what a cross-site attacker's page can do
  assert.strictEqual((await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip })).status, 403);
  assert.strictEqual((await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip, csrf: 'a'.repeat(64) })).status, 403);
  assert.strictEqual((await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip, csrf })).status, 200);
  // a CSRF token from another session is worthless
  const other = await call('/api/auth/login', { method: 'POST', ip, body: { email: 'flow5@example.com', password: 'N3wStr0ngPassw0rd' } });
  assert.notStrictEqual(other.json.csrfToken, csrf);
  assert.strictEqual((await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip, csrf: other.json.csrfToken })).status, 403);
});

guard('logout clears the cookie', async () => {
  const ip = newIp();
  const out = await call('/api/auth/logout', { method: 'POST', ip });
  assert.strictEqual(out.status, 200);
  assert.match(out.setCookie, /session=;/);
});

guard('two-factor: enable, challenge-gated login, replay + wrong codes rejected, recovery code single-use, disable', async () => {
  const { hotp, stepAt } = require('../utils/totp');
  const ip = newIp();
  const creds = { email: 'twofa1@example.com', password: 'Str0ngPassw0rd!' };
  await signup(creds.email, { ip });
  await User.updateOne({ email: creds.email }, { isEmailVerified: true });
  const first = await call('/api/auth/login', { method: 'POST', ip, body: creds });
  const cookie = sessionFrom(first), csrf = first.json.csrfToken;

  // setup + enable
  const setup = await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip, csrf });
  const secret = setup.json.data.secret;
  assert.match(setup.json.data.otpauthUrl, /^otpauth:\/\/totp\/DeployDojo:/);
  assert.strictEqual((await call('/api/auth/2fa/enable', { method: 'POST', cookie, ip, csrf, body: { code: '000000' } })).status, 400);
  const code1 = hotp(secret, stepAt());
  const enabled = await call('/api/auth/2fa/enable', { method: 'POST', cookie, ip, csrf, body: { code: code1 } });
  assert.strictEqual(enabled.status, 200);
  const recovery = enabled.json.data.recoveryCodes;
  assert.strictEqual(recovery.length, 8);
  const stored = await User.findOne({ email: creds.email });
  assert.ok(!JSON.stringify(stored.toObject().twoFactor.recoveryCodes).includes(recovery[0]), 'recovery codes stored hashed');
  assert.notStrictEqual(stored.toObject().twoFactor.secret, secret, 'secret stored encrypted');
  assert.deepStrictEqual(stored.toJSON().twoFactor, { enabled: true }, 'secrets never serialise');

  // login now stops after the password step: no cookie, only a challenge
  const step1 = await call('/api/auth/login', { method: 'POST', ip, body: creds });
  assert.strictEqual(step1.json.twoFactorRequired, true);
  assert.ok(!sessionFrom(step1) && !step1.json.csrfToken && !step1.json.user);
  const challenge = step1.json.challenge;

  // the challenge is NOT a session
  assert.strictEqual((await call('/api/auth/profile', { token: challenge, ip })).status, 401);
  assert.strictEqual((await call('/api/auth/profile', { cookie: challenge, ip })).status, 401);

  // wrong code, garbage challenge
  assert.strictEqual((await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, code: '123456' } })).status, 401);
  assert.strictEqual((await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge: 'junk', code: code1 } })).status, 401);

  // the code used to enable 2FA cannot be replayed to log in
  assert.strictEqual((await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, code: code1 } })).status, 401);

  // recovery code logs in once
  const viaRecovery = await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, recoveryCode: recovery[0] } });
  assert.strictEqual(viaRecovery.status, 200);
  assert.ok(sessionFrom(viaRecovery));
  assert.strictEqual(viaRecovery.json.recoveryCodesLeft, 7);
  assert.strictEqual((await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, recoveryCode: recovery[0] } })).status, 401, 'recovery codes are single-use');

  // disabling needs password AND a valid factor
  const cookie2 = sessionFrom(viaRecovery), csrf2 = viaRecovery.json.csrfToken;
  assert.strictEqual((await call('/api/auth/2fa/disable', { method: 'POST', cookie: cookie2, ip, csrf: csrf2, body: { password: 'wrong', recoveryCode: recovery[1] } })).status, 400);
  assert.strictEqual((await call('/api/auth/2fa/disable', { method: 'POST', cookie: cookie2, ip, csrf: csrf2, body: { password: creds.password } })).status, 400);
  assert.strictEqual((await call('/api/auth/2fa/disable', { method: 'POST', cookie: cookie2, ip, csrf: csrf2, body: { password: creds.password, recoveryCode: recovery[1] } })).status, 200);
  const after = await call('/api/auth/login', { method: 'POST', ip, body: creds });
  assert.ok(sessionFrom(after), 'plain login works again once 2FA is off');
});

guard('repeated wrong 2FA codes lock the account', async () => {
  const { hotp, stepAt } = require('../utils/totp');
  const ip = newIp();
  const creds = { email: 'twofa2@example.com', password: 'Str0ngPassw0rd!' };
  await signup(creds.email, { ip });
  await User.updateOne({ email: creds.email }, { isEmailVerified: true });
  const first = await call('/api/auth/login', { method: 'POST', ip, body: creds });
  const cookie = sessionFrom(first), csrf = first.json.csrfToken;
  const setup = await call('/api/auth/2fa/setup', { method: 'POST', cookie, ip, csrf });
  await call('/api/auth/2fa/enable', { method: 'POST', cookie, ip, csrf, body: { code: hotp(setup.json.data.secret, stepAt()) } });

  const { challenge } = (await call('/api/auth/login', { method: 'POST', ip, body: creds })).json;
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, code: '000001' } })).status);
  assert.deepStrictEqual(codes, [401, 401, 401, 401, 401]);
  const locked = await call('/api/auth/2fa/verify', { method: 'POST', ip, body: { challenge, code: hotp(setup.json.data.secret, stepAt() + 1) } });
  assert.strictEqual(locked.status, 429);
});
