const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../utils/validators');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'chinmaya.dob1999@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'mnzb ndts msgu tobw'
  }
});

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'chinmaya.dob1999@gmail.com',
      to: email,
      subject: 'Welcome to AutoDevOps - Your DevOps Journey Starts Here! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 40px;">⚡</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Welcome to AutoDevOps!</h1>
              <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Your DevOps journey starts here</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                Thank you for joining AutoDevOps! We're excited to have you on board. You now have access to powerful DevOps tools that will help you:
              </p>
              <ul style="margin: 20px 0; padding-left: 20px; color: #555;">
                <li style="margin-bottom: 10px;">🚀 Deploy applications with one click</li>
                <li style="margin-bottom: 10px;">📦 Generate production-ready Terraform templates</li>
                <li style="margin-bottom: 10px;">🔧 Create Jenkins CI/CD pipelines automatically</li>
                <li style="margin-bottom: 10px;">🐳 Deploy Docker containers to any registry</li>
                <li style="margin-bottom: 10px;">☸️ Generate Kubernetes YAML configurations</li>
                <li>👥 Collaborate with the DevOps community</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://cmcloud.online/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
                Get Started Now →
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top: 30px;">
              <h3 style="color: #333; margin: 0 0 15px; font-size: 18px;">Quick Start Guide</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: #f0f4ff; padding: 15px; border-radius: 10px;">
                  <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">Step 1</div>
                  <div style="color: #555; font-size: 14px;">Explore the dashboard</div>
                </div>
                <div style="background: #f0f4ff; padding: 15px; border-radius: 10px;">
                  <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">Step 2</div>
                  <div style="color: #555; font-size: 14px;">Generate your first template</div>
                </div>
                <div style="background: #f0f4ff; padding: 15px; border-radius: 10px;">
                  <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">Step 3</div>
                  <div style="color: #555; font-size: 14px;">Deploy to production</div>
                </div>
                <div style="background: #f0f4ff; padding: 15px; border-radius: 10px;">
                  <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">Step 4</div>
                  <div style="color: #555; font-size: 14px;">Join the community chat</div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                Need help? Contact us at <a href="mailto:support@cmcloud.online" style="color: #667eea; text-decoration: none;">support@cmcloud.online</a>
              </p>
              <p style="color: #888; font-size: 13px; margin: 15px 0 0;">
                © 2026 AutoDevOps. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to prevent registration from failing
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, username, token) => {
  try {
    const verificationUrl = `https://cmcloud.online/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'chinmaya.dob1999@gmail.com',
      to: email,
      subject: 'Verify Your Email - AutoDevOps',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 40px;">✉️</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
              <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Complete your registration</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                Thank you for registering with AutoDevOps! To complete your registration and ensure the security of your account, please verify your email address by clicking the button below.
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                This verification confirms that your email address is valid and working, preventing fake registrations.
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <p style="color: #888; font-size: 14px; margin: 0;">Or copy and paste this link:</p>
              <p style="color: #667eea; font-size: 13px; margin: 5px 0; word-break: break-all;">${verificationUrl}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                If you didn't create an account with AutoDevOps, please ignore this email.
              </p>
              <p style="color: #888; font-size: 13px; margin: 15px 0 0;">
                © 2026 AutoDevOps. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user - FORCE role to be 'user' to prevent admin self-assignment
    const user = new User({ 
      username, 
      email, 
      password,
      workExperience: workExperience || '',
      domains: domains || [],
      role: 'user', // Explicitly set to user to prevent admin registration
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, username, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: false
      }
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

    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found, isEmailVerified:', user.isEmailVerified);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('Login rejected - email not verified for:', email);
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your inbox for the verification link.'
      });
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

    console.log('Login successful for:', email);

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

// Google OAuth
const googleAuth = (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  const redirect_uri = encodeURIComponent('https://cmcloud.online/api/auth/callback/google');
  const scope = encodeURIComponent('openid profile email');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirect_uri}&scope=${scope}&response_type=code`;
  
  res.redirect(authUrl);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;
  
  console.log('Google OAuth callback received:', { code: code ? 'present' : 'missing' });
  
  if (!code) {
    console.error('Google OAuth: No code in callback');
    return res.redirect('https://cmcloud.online/login?error=google_auth_failed&reason=no_code');
  }

  try {
    console.log('Google OAuth: Exchanging code for access token');
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: 'https://cmcloud.online/api/auth/callback/google',
        grant_type: 'authorization_code'
      }
    );

    const { access_token } = tokenResponse.data;
    console.log('Google OAuth: Access token received');

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const googleUser = userResponse.data;
    console.log('Google OAuth: User info received', { email: googleUser.email, name: googleUser.name });

    if (!googleUser.email) {
      console.error('Google OAuth: No email in user info');
      return res.redirect('https://cmcloud.online/login?error=no_email');
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      console.log('Google OAuth: Existing user found, updating');
      // Update Google info if user exists
      user.googleId = googleUser.id;
      user.avatar = googleUser.picture;
      user.lastLogin = new Date();
      await user.save();
    } else {
      console.log('Google OAuth: Creating new user');
      // Create new user
      const username = googleUser.name || googleUser.email.split('@')[0];
      
      // Check if username exists
      const existingUsername = await User.findOne({ username });
      let finalUsername = username;
      if (existingUsername) {
        finalUsername = `${username}_${googleUser.id}`;
      }

      user = new User({
        username: finalUsername,
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        password: Math.random().toString(36).slice(-8), // Random password for Google users
        isActive: true,
        role: 'user', // Explicitly set to user
        isEmailVerified: true // OAuth users are considered verified since the provider verified the email
      });
      await user.save();

      // Send welcome email for new Google users
      await sendWelcomeEmail(googleUser.email, finalUsername);
    }

    // Generate JWT token
    const token = generateToken(user._id);
    console.log('Google OAuth: JWT token generated, redirecting to dashboard');

    // Redirect to frontend with token - directly to dashboard
    res.redirect(`https://cmcloud.online/dashboard?token=${token}&google=true`);
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`https://cmcloud.online/login?error=google_auth_failed&reason=${encodeURIComponent(error.message || 'unknown')}`);
  }
};

// GitHub OAuth
const githubAuth = (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }
  
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
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: 'https://cmcloud.online/api/auth/callback/github'
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
        isActive: true,
        role: 'user', // Explicitly set to user
        isEmailVerified: true // OAuth users are considered verified since the provider verified the email
      });
      await user.save();

      // Send welcome email for new GitHub users
      await sendWelcomeEmail(primaryEmail, finalUsername);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token - directly to dashboard
    res.redirect(`https://cmcloud.online/dashboard?token=${token}&github=true`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect('https://cmcloud.online/login?error=github_auth_failed');
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('=== EMAIL VERIFICATION ATTEMPT ===');
    console.log('Token:', token);
    console.log('Current time:', new Date().toISOString());
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    if (!token) {
      console.log('ERROR: No token provided');
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // First try to find user by token without expiration check
    const userWithoutExpiry = await User.findOne({ emailVerificationToken: token });
    
    if (!userWithoutExpiry) {
      console.log('ERROR: No user found with this token');
      return res.status(400).json({ 
        error: 'Invalid verification token',
        message: 'No user found with this verification token.'
      });
    }

    console.log('User found:', userWithoutExpiry.email);
    console.log('Token expires at:', userWithoutExpiry.emailVerificationExpires);
    console.log('Token expired:', userWithoutExpiry.emailVerificationExpires < Date.now());
    console.log('Current isEmailVerified:', userWithoutExpiry.isEmailVerified);

    // Check if token is expired
    if (userWithoutExpiry.emailVerificationExpires < Date.now()) {
      console.log('ERROR: Token has expired');
      return res.status(400).json({ 
        error: 'Expired verification token',
        message: 'This verification link has expired. Please request a new verification email.'
      });
    }

    console.log('Updating user verification status...');
    
    userWithoutExpiry.isEmailVerified = true;
    userWithoutExpiry.emailVerificationToken = undefined;
    userWithoutExpiry.emailVerificationExpires = undefined;
    
    const savedUser = await userWithoutExpiry.save();
    
    console.log('User saved successfully');
    console.log('New isEmailVerified:', savedUser.isEmailVerified);
    console.log('Email verification successful for:', savedUser.email);

    // Send welcome email after verification
    try {
      await sendWelcomeEmail(savedUser.email, savedUser.username);
      console.log('Welcome email sent');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    console.log('=== VERIFICATION COMPLETE ===');
    
    res.json({
      message: 'Email verified successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('=== EMAIL VERIFICATION ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Server error during email verification',
      message: error.message 
    });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.username, verificationToken);

    res.json({
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Server error resending verification email' });
  }
};

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    const resetUrl = `https://cmcloud.online/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'chinmaya.dob1999@gmail.com',
      to: email,
      subject: 'Reset Your Password - AutoDevOps',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 40px;">🔑</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
              <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Secure account recovery</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${user.username}</strong>,
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                We received a request to reset your password for your AutoDevOps account. Click the button below to set a new password.
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                This link will expire in 1 hour for your security.
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
                Reset Password
              </a>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <p style="color: #888; font-size: 14px; margin: 0;">Or copy and paste this link:</p>
              <p style="color: #667eea; font-size: 13px; margin: 5px 0; word-break: break-all;">${resetUrl}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                For your security, this link can only be used once.
              </p>
              <p style="color: #888; font-size: 13px; margin: 15px 0 0;">
                © 2026 AutoDevOps. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);

    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error sending reset email' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ error: 'Password and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token',
        message: 'Please request a new password reset link.'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
};
