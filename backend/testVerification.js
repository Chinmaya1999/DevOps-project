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

const testVerification = async () => {
  try {
    // Find a user with a verification token
    const user = await User.findOne({ 
      emailVerificationToken: { $exists: true },
      isEmailVerified: false 
    });
    
    if (!user) {
      console.log('No users with pending verification found');
      console.log('Creating a test user...');
      
      // Create a test user
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const testUser = new User({
        username: 'testuser_' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'test123456',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        role: 'user'
      });
      
      await testUser.save();
      console.log('Test user created:');
      console.log('- Email:', testUser.email);
      console.log('- Token:', verificationToken);
      console.log('- Expires:', verificationExpires);
      
      // Simulate verification
      console.log('\nSimulating verification...');
      testUser.isEmailVerified = true;
      testUser.emailVerificationToken = undefined;
      testUser.emailVerificationExpires = undefined;
      await testUser.save();
      
      console.log('Verification successful!');
      console.log('- isEmailVerified:', testUser.isEmailVerified);
      
      process.exit(0);
    }
    
    console.log('Found user with pending verification:');
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Token:', user.emailVerificationToken);
    console.log('- Expires:', user.emailVerificationExpires);
    console.log('- Current time:', new Date().toISOString());
    console.log('- Token valid:', user.emailVerificationExpires > Date.now());
    
    // Test the verification process
    console.log('\nTesting verification process...');
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    console.log('Verification successful!');
    console.log('- isEmailVerified:', user.isEmailVerified);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testVerification();
