const express = require('express');
const { auth } = require('../middleware/auth');
const { register, login, getProfile, googleAuth, googleCallback, githubAuth, githubCallback, verifyEmail, resendVerificationEmail } = require('../controllers/authController');

const router = express.Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Verify email
router.get('/verify-email', verifyEmail);

// Resend verification email
router.post('/resend-verification', resendVerificationEmail);

// Google OAuth
router.get('/google', googleAuth);
router.get('/callback/google', googleCallback);

// GitHub OAuth
router.get('/github', githubAuth);
router.get('/callback/github', githubCallback);

// Get user profile (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
