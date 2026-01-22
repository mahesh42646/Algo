/**
 * Initialize Admin User Script
 * Creates a default admin user if none exists
 * 
 * Usage: node backend/scripts/initAdmin.js
 * Or: npm run init-admin (if added to package.json)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../schemas/admin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algobot';

// Default admin credentials (change these after first login!)
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'algobot@1235', 
  email: 'admin@algobot.com',
  isActive: true,
};

async function initAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: DEFAULT_ADMIN.username });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', existingAdmin.username);
      console.log('   If you need to reset the password, update it through the admin panel.');
      await mongoose.connection.close();
      return;
    }

    // Create new admin
    const admin = new Admin(DEFAULT_ADMIN);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Username:', DEFAULT_ADMIN.username);
    console.log('   Email:', DEFAULT_ADMIN.email);
    console.log('   Password:', DEFAULT_ADMIN.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('   Use PUT /api/admin/profile endpoint to update credentials.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
initAdmin();
