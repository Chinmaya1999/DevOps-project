const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../utils/validators');
const { sha256, secureOTP, safeEqual } = require('../utils/crypto');
const { passwordProblem } = require('../middleware/security');

const { getEffectivePlan } = require('../services/plans');
const { issueSession, clearSession, csrfFor } = require('../services/session');
const { signChallenge } = require('../services/twoFactorChallenge');
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'autodevops.cmcloud.online@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'hgxa fqzv pqed oaxu'
  }
});

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'autodevops.cmcloud.online@gmail.com',
      to: email,
      subject: 'Welcome to DeployDojo - Your DevOps Journey Starts Here! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 40px;">⚡</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Welcome to DeployDojo!</h1>
              <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Your DevOps journey starts here</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                Thank you for joining DeployDojo! We're excited to have you on board. You now have access to powerful DevOps tools that will help you:
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
                © 2026 DeployDojo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to prevent registration from failing
  }
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate 6-digit OTP
const generateOTP = () => secureOTP();

// Send OTP email
const sendOTPEmail = async (email, username, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'autodevops.cmcloud.online@gmail.com',
      to: email,
      subject: 'Verify Your Email - DeployDojo OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 40px;">🔐</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
              <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Complete your registration with OTP</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 15px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
                Thank you for registering with DeployDojo! To complete your registration, please use the following One-Time Password (OTP):
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 50px; border-radius: 15px; font-weight: bold; font-size: 36px; letter-spacing: 8px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
                ${otp}
              </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes. Please enter it on the verification page to complete your registration.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                If you didn't create an account with DeployDojo, please ignore this email.
              </p>
              <p style="color: #888; font-size: 13px; margin: 15px 0 0;">
                © 2026 DeployDojo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, username, token) => {
  try {
    const verificationUrl = `https://cmcloud.online/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'autodevops.cmcloud.online@gmail.com',
      to: email,
      subject: 'Verify Your Email - DeployDojo',
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
                Thank you for registering with DeployDojo! To complete your registration and ensure the security of your account, please verify your email address by clicking the button below.
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
                If you didn't create an account with DeployDojo, please ignore this email.
              </p>
              <p style="color: #888; font-size: 13px; margin: 15px 0 0;">
                © 2026 DeployDojo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
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

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user - FORCE role to be 'user' to prevent admin self-assignment
    const user = new User({ 
      username, 
      email, 
      password,
      workExperience: workExperience || '',
      domains: domains || [],
      role: 'user', // Explicitly set to user to prevent admin registration
      isEmailVerified: false,
      emailOTP: sha256(otp),
      emailOTPExpires: otpExpires
    });
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, username, otp);

    res.status(201).json({
      message: 'Registration successful. Please check your email for OTP to verify your account.',
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
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
    }

    const { password } = value;
    const email = String(value.email).toLowerCase().trim();

    const user = await User.findOne({ email });
    // Same message for unknown email and wrong password
    const invalid = () => res.status(401).json({ error: 'Invalid credentials' });

    if (!user) {
      // Spend comparable time so response timing does not reveal whether the account exists
      await require('bcryptjs').compare(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5zW1y4sQYQJ2Xr0kS3Zl5mQe7g3p0pG');
      return invalid();
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Account temporarily locked. Try again in ${mins} minute(s).` });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      return invalid();
    }

    // Only reveal account state after the correct password was supplied
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email with OTP before logging in. Check your inbox for the OTP.'
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Password was right. If 2FA is on, no session yet — the client must present a code with this short-lived challenge.
    if (user.twoFactor && user.twoFactor.enabled) {
      await user.save();
      return res.json({ twoFactorRequired: true, challenge: signChallenge(user._id) });
    }

    user.lastLogin = new Date();
    await user.save();

    const { csrfToken } = issueSession(res, user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        subscription: user.subscription,
        plan: getEffectivePlan(user),
        twoFactorEnabled: false,
        workExperience: user.workExperience,
        domains: user.domains
      },
      csrfToken
    });
  } catch (error) {
    console.error('Login error:', error.message);
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
        plan: getEffectivePlan(user),
        twoFactorEnabled: !!(user.twoFactor && user.twoFactor.enabled),
        workExperience: user.workExperience,
        domains: user.domains
      },
      csrfToken: req.sessionToken ? csrfFor(req.sessionToken) : undefined
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// Logout: drop the session cookie
const logout = (req, res) => {
  clearSession(res);
  res.json({ message: 'Logged out' });
};

// Verify OTP endpoint
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('Current time:', new Date().toISOString());

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Same response for "no such user" and "wrong code" so emails cannot be enumerated
    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP', message: 'The OTP you entered is incorrect.' });
    }


    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'Your email is already verified.'
      });
    }

    // Check if OTP is expired
    if (user.emailOTPExpires < Date.now()) {
      return res.status(400).json({ 
        error: 'Expired OTP',
        message: 'This OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    if ((user.emailOTPAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many attempts', message: 'Too many incorrect codes. Please request a new OTP.' });
    }

    if (!user.emailOTP || !safeEqual(user.emailOTP, sha256(otp))) {
      user.emailOTPAttempts = (user.emailOTPAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ 
        error: 'Invalid OTP',
        message: 'The OTP you entered is incorrect.'
      });
    }

    
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    
    const savedUser = await user.save();
    

    // Send welcome email after verification
    try {
      await sendWelcomeEmail(savedUser.email, savedUser.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    console.log('=== VERIFICATION COMPLETE ===');
    
    res.json({
      message: 'Email verified successfully. You can now login.',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('=== OTP VERIFICATION ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Server error during OTP verification',
      message: error.message 
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
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

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOTP = sha256(otp);
    user.emailOTPExpires = otpExpires;
    user.emailOTPAttempts = 0;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, user.username, otp);

    res.json({
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error resending OTP' });
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('Current time:', new Date().toISOString());
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // First try to find user by token without expiration check
    const userWithoutExpiry = await User.findOne({ emailVerificationToken: sha256(String(token)) });
    
    if (!userWithoutExpiry) {
      return res.status(400).json({ 
        error: 'Invalid verification token',
        message: 'No user found with this verification token.'
      });
    }


    // Check if token is expired
    if (userWithoutExpiry.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ 
        error: 'Expired verification token',
        message: 'This verification link has expired. Please request a new verification email.'
      });
    }

    
    userWithoutExpiry.isEmailVerified = true;
    userWithoutExpiry.emailVerificationToken = undefined;
    userWithoutExpiry.emailVerificationExpires = undefined;
    
    const savedUser = await userWithoutExpiry.save();
    

    // Send welcome email after verification
    try {
      await sendWelcomeEmail(savedUser.email, savedUser.username);
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

    user.emailVerificationToken = sha256(verificationToken);
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

    user.resetPasswordToken = sha256(resetToken);
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    const resetUrl = `https://cmcloud.online/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER || 'autodevops.cmcloud.online@gmail.com',
      to: email,
      subject: 'Reset Your Password - DeployDojo',
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
                We received a request to reset your password for your DeployDojo account. Click the button below to set a new password.
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
                © 2026 DeployDojo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

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

    const pwProblem = passwordProblem(password);
    if (pwProblem) {
      return res.status(400).json({ error: pwProblem });
    }

    const user = await User.findOne({
      resetPasswordToken: sha256(token),
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
    user.loginAttempts = 0;
    user.lockUntil = undefined;
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
  logout,
  register,
  login,
  getProfile,
  verifyEmail,
  verifyOTP,
  resendOTP,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
};
