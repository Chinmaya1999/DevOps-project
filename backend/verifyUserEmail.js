require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/mernapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const verifyUserEmail = async (identifier) => {
  try {
    console.log(`Looking for user with identifier: ${identifier}`);
    
    // Try to find by email first, then by username
    let user = await User.findOne({ email: identifier });
    
    if (!user) {
      user = await User.findOne({ username: identifier });
    }
    
    if (!user) {
      console.log('User not found with this email or username');
      process.exit(1);
    }
    
    console.log('User found:');
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- isEmailVerified:', user.isEmailVerified);
    console.log('- emailVerificationToken:', user.emailVerificationToken);
    console.log('- emailVerificationExpires:', user.emailVerificationExpires);
    
    if (user.isEmailVerified) {
      console.log('Email is already verified!');
      process.exit(0);
    }
    
    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    console.log('Email verified successfully!');
    console.log('- isEmailVerified:', user.isEmailVerified);
    console.log('You can now login with your credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying email:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node verifyUserEmail.js <email>');
  console.log('Example: node verifyUserEmail.js contact@adihuman.com');
  process.exit(1);
}

verifyUserEmail(email);
