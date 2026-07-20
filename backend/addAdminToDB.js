require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function addAdminToDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user "admin@gmail.com" already exists in database');
      
      // Update password to "admin123" if it's different
      const isPasswordMatch = await bcrypt.compare('admin123', existingAdmin.password);
      if (!isPasswordMatch) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await User.updateOne(
          { email: 'admin@gmail.com' },
          { 
            password: hashedPassword,
            role: 'admin',
            isActive: true
          }
        );
        
        console.log('Updated admin user password to "admin123"');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user added to database successfully!');
    console.log('🔐 Credentials:');
    console.log('   Username: admin');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error adding admin user to database:', error);
    process.exit(1);
  }
}

// Run the function
addAdminToDatabase();
