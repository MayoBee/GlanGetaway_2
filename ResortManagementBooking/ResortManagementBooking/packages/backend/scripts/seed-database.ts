import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function seedDatabase() {
  try {
    console.log('🔄 Starting database seeding...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.collection('hotels').deleteMany({});
    await db.collection('users').deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Read and insert sample resorts
    console.log('🏨 Adding sample resorts...');
    const resortsPath = path.join(__dirname, '../../data/sample-resorts.json');
    const resortsData = JSON.parse(fs.readFileSync(resortsPath, 'utf8'));
    
    await db.collection('hotels').insertMany(resortsData);
    console.log(`✅ Added ${resortsData.length} sample resorts`);
    
    // Add test users with dynamic password hashing
    console.log('👤 Adding test users...');
    
    // Hash passwords dynamically
    const adminPassword = await bcrypt.hash('admin123', 8);
    const userPassword = await bcrypt.hash('password123', 8);
    
    const testUsers = [
      {
        email: "admin@glangetaway.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isApproved: true,
        birthdate: new Date("1990-01-01"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "biennickwadingan@gmail.com",
        password: userPassword,
        firstName: "Bien",
        lastName: "Wadingan",
        role: "admin",
        isApproved: true,
        birthdate: new Date("1995-05-15"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "biennickw@gmail.com",
        password: userPassword,
        firstName: "Bien",
        lastName: "User",
        role: "user",
        isApproved: true,
        birthdate: new Date("2000-08-20"),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('users').insertMany(testUsers);
    console.log(`✅ Added ${testUsers.length} test users`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Test Accounts Created:');
    console.log('🔑 Admin: admin@glangetaway.com / admin123');
    console.log('🏨 Resort Owner: biennickwadingan@gmail.com / password123');
    console.log('👤 User: biennickw@gmail.com / password123');
    
    console.log('\n🏖️ Sample Resorts Added:');
    resortsData.forEach((resort: any, index: number) => {
      console.log(`${index + 1}. ${resort.name} - ${resort.city}, ${resort.country} - ₱${resort.pricePerNight}/night`);
    });
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
