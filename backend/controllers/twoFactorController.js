const User = require('../models/User');
const { generateSecret, verifyTotp, otpauthUrl, generateRecoveryCodes } = require('../utils/totp');
const { sha256, safeEqual } = require('../utils/crypto');
const { verifyChallenge } = require('../services/twoFactorChallenge');
const { issueSession } = require('../services/session');
const { getEffectivePlan } = require('../services/plans');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const ISSUER = 'AutoDevOps';

/** Accepts a TOTP code or a recovery code. Returns { ok, user mutated } — caller saves. */
function checkSecondFactor(user, { code, recoveryCode }) {
  const tf = user.twoFactor;
  if (code) {
    const step = verifyTotp(tf.secret, String(code));
    if (step === null) return false;
    if (step <= (tf.lastStep || 0)) return false; // replaying an already-used code
    tf.lastStep = step;
    return true;
  }
  if (recoveryCode) {
    const hash = sha256(String(recoveryCode).trim().toLowerCase());
    const idx = tf.recoveryCodes.findIndex((h) => safeEqual(h, hash));
    if (idx === -1) return false;
    tf.recoveryCodes.splice(idx, 1); // single use
    return true;
  }
  return false;
}

const status = async (req, res) => {
  const tf = req.user.twoFactor || {};
  res.json({ success: true, data: { enabled: !!tf.enabled, recoveryCodesLeft: (tf.recoveryCodes || []).length } });
};

const setup = async (req, res) => {
  const user = req.user;
  if (user.twoFactor?.enabled) return res.status(400).json({ error: 'Two-factor authentication is already enabled' });
  const secret = generateSecret();
  user.twoFactor.pendingSecret = secret;
  await user.save();
  res.json({ success: true, data: { secret, otpauthUrl: otpauthUrl(user.email, ISSUER, secret) } });
};

const enable = async (req, res) => {
  const user = req.user;
  const pending = user.twoFactor?.pendingSecret;
  if (!pending) return res.status(400).json({ error: 'Start setup first' });
  const step = verifyTotp(pending, String(req.body?.code || ''));
  if (step === null) return res.status(400).json({ error: 'That code is not valid. Check the time on your phone and try again.' });

  const codes = generateRecoveryCodes();
  user.twoFactor.secret = pending;
  user.twoFactor.pendingSecret = undefined;
  user.twoFactor.enabled = true;
  user.twoFactor.lastStep = step;
  user.twoFactor.recoveryCodes = codes.map((c) => sha256(c));
  await user.save();
  res.json({ success: true, data: { recoveryCodes: codes } }); // shown once; only hashes are kept
};

/** Re-authenticate (password + a code) before any change to 2FA. */
async function reauth(req, res) {
  const { password, code, recoveryCode } = req.body || {};
  const user = await User.findById(req.user._id); // full document (auth middleware strips the password)
  if (!user.twoFactor?.enabled) { res.status(400).json({ error: 'Two-factor authentication is not enabled' }); return null; }
  if (user.lockUntil && user.lockUntil > Date.now()) { res.status(429).json({ error: 'Too many attempts. Try again later.' }); return null; }
  const okPassword = typeof password === 'string' && (await user.comparePassword(password));
  const okFactor = okPassword && checkSecondFactor(user, { code, recoveryCode });
  if (!okPassword || !okFactor) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_ATTEMPTS) { user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000); user.loginAttempts = 0; }
    await user.save();
    res.status(400).json({ error: 'Password or code is incorrect' });
    return null;
  }
  user.loginAttempts = 0;
  return user;
}

const disable = async (req, res) => {
  const user = await reauth(req, res);
  if (!user) return;
  user.twoFactor.enabled = false;
  user.twoFactor.secret = undefined;
  user.twoFactor.pendingSecret = undefined;
  user.twoFactor.recoveryCodes = [];
  user.twoFactor.lastStep = 0;
  await user.save();
  res.json({ success: true });
};

const regenerateRecoveryCodes = async (req, res) => {
  const user = await reauth(req, res);
  if (!user) return;
  const codes = generateRecoveryCodes();
  user.twoFactor.recoveryCodes = codes.map((c) => sha256(c));
  await user.save();
  res.json({ success: true, data: { recoveryCodes: codes } });
};

/** Second step of login. Public route, protected by the signed challenge + rate limit + attempt lockout. */
const verifyLogin = async (req, res) => {
  try {
    const { challenge, code, recoveryCode } = req.body || {};
    let userId;
    try { userId = verifyChallenge(String(challenge || '')); }
    catch { return res.status(401).json({ error: 'Your sign-in expired. Please enter your password again.', code: 'CHALLENGE_EXPIRED' }); }

    const user = await User.findById(userId);
    if (!user || !user.isActive || !user.twoFactor?.enabled) return res.status(401).json({ error: 'Sign-in failed' });
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({ error: `Account temporarily locked. Try again in ${Math.ceil((user.lockUntil - Date.now()) / 60000)} minute(s).` });
    }

    if (!checkSecondFactor(user, { code, recoveryCode })) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_ATTEMPTS) { user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000); user.loginAttempts = 0; }
      await user.save();
      return res.status(401).json({ error: 'Incorrect code' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const { csrfToken } = issueSession(res, user._id);
    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email, role: user.role, lastLogin: user.lastLogin,
              subscription: user.subscription, plan: getEffectivePlan(user), twoFactorEnabled: true,
              workExperience: user.workExperience, domains: user.domains },
      csrfToken,
      recoveryCodesLeft: user.twoFactor.recoveryCodes.length,
    });
  } catch (e) {
    console.error('2FA verify error:', e.message);
    res.status(500).json({ error: 'Could not verify the code' });
  }
};

module.exports = { status, setup, enable, disable, regenerateRecoveryCodes, verifyLogin };
