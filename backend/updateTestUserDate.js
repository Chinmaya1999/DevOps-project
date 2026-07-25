const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devops-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateUserSubscription() {
  try {
    const userEmail = 'sumit123@gmail.com';
    
    // Find the user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`User with email ${userEmail} not found`);
      process.exit(1);
    }
    
    console.log('Current user subscription:', user.subscription);
    
    // Calculate dates for testing expired trial (6 days since trial started)
    const now = new Date();
    const sixDaysAgo = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));
    
    // Update subscription to test expired trial (trial ended 1 day ago)
    user.subscription.type = 'trial';
    user.subscription.startDate = sixDaysAgo;
    user.subscription.trialEndDate = oneDayAgo;
    
    await user.save();
    
    console.log('Updated user subscription:', user.subscription);
    console.log(`Trial will end on: ${user.subscription.trialEndDate}`);
    console.log('Successfully updated user subscription dates');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

updateUserSubscription();
