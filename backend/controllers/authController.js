const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../utils/validators');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { username, email, password, workExperience, domains } = value;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    // Create new user
    const user = new User({ 
      username, 
      email, 
      password,
      workExperience: workExperience || '',
      domains: domains || []
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        subscription: user.subscription,
        workExperience: user.workExperience,
        domains: user.domains
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// GitHub OAuth
const githubAuth = (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liC2DOo1rnezqSvG';
  const redirect_uri = encodeURIComponent('https://cmcloud.online/api/auth/callback/github');
  const scope = 'user:email';
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}&scope=${scope}`;
  
  res.redirect(authUrl);
};

const githubCallback = async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('https://cmcloud.online/login?error=github_auth_failed');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID || 'Ov23liC2DOo1rnezqSvG',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '6d68eb7ae13913eff84281792e534278b1ca763a',
        code: code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const githubUser = userResponse.data;

    // Get user email
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const primaryEmail = emailResponse.data.find(email => email.primary && email.verified)?.email || githubUser.email;

    if (!primaryEmail) {
      return res.redirect('https://cmcloud.online/login?error=no_email');
    }

    // Check if user exists
    let user = await User.findOne({ email: primaryEmail });

    if (user) {
      // Update GitHub info if user exists
      user.githubId = githubUser.id;
      user.githubUsername = githubUser.login;
      user.avatar = githubUser.avatar_url;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      const username = githubUser.login || primaryEmail.split('@')[0];
      
      // Check if username exists
      const existingUsername = await User.findOne({ username });
      let finalUsername = username;
      if (existingUsername) {
        finalUsername = `${username}_${githubUser.id}`;
      }

      user = new User({
        username: finalUsername,
        email: primaryEmail,
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        avatar: githubUser.avatar_url,
        password: Math.random().toString(36).slice(-8), // Random password for GitHub users
        isActive: true
      });
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`https://cmcloud.online/login?token=${token}&github=true`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect('https://cmcloud.online/login?error=github_auth_failed');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  githubAuth,
  githubCallback
};
