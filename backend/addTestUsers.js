const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devops-generator')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const addTestUsers = async () => {
  try {
    console.log('Adding test users...');

    const testUsers = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      },
      {
        username: 'inactive_user',
        email: 'inactive@example.com',
        password: 'password123',
        role: 'user',
        isActive: false
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.username} (${userData.email})`);
      } else {
        console.log(`⚠️  User already exists: ${userData.username} (${userData.email})`);
      }
    }

    // Update some users with last login dates
    await User.updateMany(
      { email: { $in: ['john@example.com', 'jane@example.com'] } },
      { lastLogin: new Date() }
    );

    console.log('\n🎉 Test users added successfully!');
    console.log('You can now login as admin and see users in the User Management section.');
    
  } catch (error) {
    console.error('Error adding test users:', error);
  } finally {
    mongoose.disconnect();
  }
};

addTestUsers();
