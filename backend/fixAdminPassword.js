require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find and update admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found, creating new one...');
      
      // Create new admin user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const newAdmin = new User({
        username: 'admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      await newAdmin.save();
      console.log('✅ New admin user created');
    } else {
      console.log('🔧 Updating admin password...');
      
      // Generate new password hash
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Update password
      await User.updateOne(
        { email: 'admin@gmail.com' },
        { 
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          username: 'admin'
        }
      );
      
      console.log('✅ Admin password updated');
    }

    // Verify the password
    const updatedUser = await User.findOne({ email: 'admin@gmail.com' });
    const isPasswordMatch = await bcrypt.compare('admin123', updatedUser.password);
    
    console.log('\n🔐 Verification:');
    console.log('   Email:', updatedUser.email);
    console.log('   Username:', updatedUser.username);
    console.log('   Role:', updatedUser.role);
    console.log('   Active:', updatedUser.isActive);
    console.log('   Password "admin123" matches:', isPasswordMatch);

    await mongoose.disconnect();
    console.log('\n✅ Admin user is ready for login!');
    console.log('🔐 Login credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('Error fixing admin password:', error);
    process.exit(1);
  }
}

// Run the function
fixAdminPassword();
