require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function verifyAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in database');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Active:', adminUser.isActive);
    console.log('   Created:', adminUser.createdAt);

    // Test password
    const isPasswordMatch = await bcrypt.compare('admin123', adminUser.password);
    console.log('   Password "admin123" matches:', isPasswordMatch);

    // Test login with different credentials
    const testCredentials = [
      { email: 'admin@gmail.com', password: 'admin123' },
      { email: 'admin@gmail.com', password: 'admin' },
      { email: 'admin', password: 'admin123' }
    ];

    console.log('\n🔐 Testing login credentials:');
    for (const cred of testCredentials) {
      const user = await User.findOne({ email: cred.email });
      if (user) {
        const isMatch = await bcrypt.compare(cred.password, user.password);
        console.log(`   ${cred.email} / ${cred.password}: ${isMatch ? '✅ Valid' : '❌ Invalid'}`);
      } else {
        console.log(`   ${cred.email} / ${cred.password}: ❌ User not found`);
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error verifying admin user:', error);
    process.exit(1);
  }
}

// Run the function
verifyAdminUser();
