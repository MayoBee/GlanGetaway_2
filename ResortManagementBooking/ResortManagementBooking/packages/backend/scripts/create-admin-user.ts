import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ email: "admin@glangetaway.com" });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log(`   Current role: ${existingAdmin.role}`);
      
      // Update role if it's not admin
      if (existingAdmin.role !== 'admin') {
        await db.collection('users').updateOne(
          { email: "admin@glangetaway.com" },
          { $set: { role: "admin" } }
        );
        console.log('✅ Admin role updated to "admin"');
      }
    } else {
      // Create new admin user
      const adminPassword = await bcrypt.hash('admin123', 8);
      
      const adminUser = {
        email: "admin@glangetaway.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
        birthdate: new Date("1990-01-01"),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('users').insertOne(adminUser);
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@glangetaway.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
    }
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
