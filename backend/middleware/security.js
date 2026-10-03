const rateLimit = require('express-rate-limit');

/** Strip MongoDB operators ($where, $gt, ...) and dotted keys from user input to prevent NoSQL injection. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    // Express 4: req.query is writable; keep keys, drop operators
    const q = clean(req.query);
    for (const k of Object.keys(req.query)) delete req.query[k];
    Object.assign(req.query, q);
  }
  next();
};

/** Escape user input before building a RegExp (prevents regex injection / ReDoS). */
const escapeRegex = (s) => String(s).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Accept GitHub / Docker Hub tokens via headers so they stay out of URLs, access logs and browser history. */
const tokenFromHeaders = (req, res, next) => {
  const gh = req.get('x-github-token');
  const dh = req.get('x-dockerhub-pat');
  if (gh && !req.query.token) req.query.token = gh;
  if (dh && !req.query.pat) req.query.pat = dh;
  next();
};

const limiter = (max, windowMin, message, keyGenerator) =>
  rateLimit({ windowMs: windowMin * 60 * 1000, max, message: { error: message }, standardHeaders: true, legacyHeaders: false, ...(keyGenerator ? { keyGenerator } : {}) });

const limiters = {
  otpVerify: limiter(10, 15, 'Too many verification attempts. Please try again later.'),
  otpResend: limiter(3, 15, 'Too many code requests. Please try again later.'),
  passwordReset: limiter(5, 15, 'Too many password reset attempts. Please try again later.'),
  deployment: limiter(30, 15, 'Too many deployment requests. Please slow down.'),
  twoFactor: limiter(15, 15, 'Too many two-factor attempts. Please try again later.'),
  upload: limiter(10, 60, 'Too many uploads. Please try again later.'),
  // authenticated route: limit per account so users sharing an IP don't block each other
  checkout: limiter(10, 15, 'Too many checkout attempts. Please try again later.', (req) => String(req.user?._id || req.ip)),
};

/** Fail fast at boot if secrets are missing or weak. */
function assertSecureConfig() {
  const problems = [];
  const jwt = process.env.JWT_SECRET || '';
  if (jwt.length < 32) problems.push('JWT_SECRET must be at least 32 characters');
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.DATA_ENCRYPTION_KEY || '')) {
    problems.push('DATA_ENCRYPTION_KEY must be 64 hex chars (generate: openssl rand -hex 32)');
  }
  if (problems.length) {
    console.error('Insecure configuration:\n - ' + problems.join('\n - '));
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

/** Passwords: 10+ chars with a letter and a digit, and not an obviously common one. */
const COMMON = new Set(['password', 'password1', 'password123', '1234567890', 'qwertyuiop', 'admin12345', 'admin123']);
function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password must be at least 10 characters long';
  if (pw.length > 128) return 'Password is too long';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common';
  return null;
}

module.exports = { sanitizeInput, escapeRegex, tokenFromHeaders, limiters, assertSecureConfig, passwordProblem };
