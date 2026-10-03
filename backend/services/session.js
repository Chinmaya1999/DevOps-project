const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Cookie sessions. The JWT lives in an HttpOnly cookie, so page scripts (and therefore XSS) can never read it.
 * Because browsers attach cookies automatically, state-changing requests also need a CSRF token that is derived
 * from the session itself: HMAC(secret, jwt). The frontend receives it in the JSON body, not in a cookie.
 */
const COOKIE = 'session';

const EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '1d';

function toMs(expr) {
  const m = /^(\d+)\s*([smhd])$/.exec(String(expr));
  if (!m) return 24 * 60 * 60 * 1000;
  return Number(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
}

const cookieOptions = () => ({
  httpOnly: true,
  // set COOKIE_SECURE=false only for plain-http local development
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: toMs(EXPIRES_IN()),
});

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: EXPIRES_IN(), algorithm: 'HS256' });

const csrfFor = (token) => crypto.createHmac('sha256', process.env.JWT_SECRET).update('csrf:' + token).digest('hex');

function csrfValid(token, supplied) {
  if (!token || !supplied) return false;
  const a = Buffer.from(csrfFor(token));
  const b = Buffer.from(String(supplied));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Start a session: sets the cookie and returns the CSRF token the frontend must echo back. */
function issueSession(res, userId) {
  const token = signToken(userId);
  res.cookie(COOKIE, token, cookieOptions());
  return { csrfToken: csrfFor(token) };
}

function clearSession(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE, opts);
}

module.exports = { COOKIE, signToken, csrfFor, csrfValid, issueSession, clearSession, cookieOptions };
