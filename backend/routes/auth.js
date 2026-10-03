const express = require('express');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const twoFactor = require('../controllers/twoFactorController');
const { register, login, logout, getProfile, verifyEmail, verifyOTP, resendOTP, resendVerificationEmail, forgotPassword, resetPassword } = require('../controllers/authController');

const { limiters } = require('../middleware/security');

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
  max: 20, // 20 login attempts per 15 minutes per IP
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

// Verify OTP
router.post('/verify-otp', limiters.otpVerify, verifyOTP);

// Resend OTP
router.post('/resend-otp', limiters.otpResend, resendOTP);

// Resend verification email
router.post('/resend-verification', limiters.otpResend, resendVerificationEmail);

// Forgot password
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

// Reset password
router.post('/reset-password', limiters.passwordReset, resetPassword);

// Logout (clears the session cookie)
router.post('/logout', logout);

// Two-factor authentication
router.post('/2fa/verify', limiters.twoFactor, twoFactor.verifyLogin);
router.get('/2fa', auth, twoFactor.status);
router.post('/2fa/setup', auth, limiters.twoFactor, twoFactor.setup);
router.post('/2fa/enable', auth, limiters.twoFactor, twoFactor.enable);
router.post('/2fa/disable', auth, limiters.twoFactor, twoFactor.disable);
router.post('/2fa/recovery-codes', auth, limiters.twoFactor, twoFactor.regenerateRecoveryCodes);

// Get user profile (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
