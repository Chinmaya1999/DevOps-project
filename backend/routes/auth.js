const express = require('express');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const { register, login, getProfile, googleAuth, googleCallback, githubAuth, githubCallback, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

// Rate limiter for registration (strict - prevent fake registrations)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 registration attempts per 15 minutes per IP
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for login (lenient - allow normal usage)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow 100 login requests per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset (prevent abuse)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 password reset attempts per 15 minutes per IP
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Register new user
router.post('/register', registerLimiter, register);

// Login user
router.post('/login', loginLimiter, login);

// Verify email
router.get('/verify-email', verifyEmail);

// Resend verification email
router.post('/resend-verification', resendVerificationEmail);

// Forgot password
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Google OAuth
router.get('/google', googleAuth);
router.get('/callback/google', googleCallback);

// GitHub OAuth
router.get('/github', githubAuth);
router.get('/callback/github', githubCallback);

// Get user profile (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
