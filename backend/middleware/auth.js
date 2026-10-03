const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE, csrfValid } = require('../services/session');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const auth = async (req, res, next) => {
  try {
    const bearer = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies?.[COOKIE];
    const token = bearer || cookieToken;
    const viaCookie = !bearer && Boolean(cookieToken);

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Cookie-authenticated requests that change state must prove they came from our own frontend (CSRF)
    if (viaCookie && !SAFE_METHODS.has(req.method) && !csrfValid(token, req.get('x-csrf-token'))) {
      return res.status(403).json({ error: 'Invalid or missing CSRF token', code: 'CSRF' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    // purpose-scoped tokens (e.g. the 2FA challenge) are never valid sessions
    if (decoded.purpose) return res.status(401).json({ error: 'Invalid token.' });
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user not found.' });
    }

    // Sessions issued before the last password change/reset are no longer valid
    if (user.passwordChangedAt && decoded.iat <= Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error in authentication.' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { auth, adminAuth };
