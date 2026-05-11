"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Starting database seeding...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            console.log(`📦 Using database: ${db.databaseName}`);
            // Clear existing data
            console.log('🧹 Clearing existing data...');
            yield db.collection('hotels').deleteMany({});
            yield db.collection('users').deleteMany({});
            console.log('✅ Existing data cleared');
            // Read and insert sample resorts
            console.log('🏨 Adding sample resorts...');
            const resortsPath = path_1.default.join(__dirname, '../../data/sample-resorts.json');
            const resortsData = JSON.parse(fs_1.default.readFileSync(resortsPath, 'utf8'));
            yield db.collection('hotels').insertMany(resortsData);
            console.log(`✅ Added ${resortsData.length} sample resorts`);
            // Add test users with dynamic password hashing
            console.log('👤 Adding test users...');
            // Hash passwords dynamically
            const adminPassword = yield bcryptjs_1.default.hash('admin123', 8);
            const userPassword = yield bcryptjs_1.default.hash('password123', 8);
            const testUsers = [
                {
                    email: "admin@glangetaway.com",
                    password: adminPassword,
                    firstName: "Admin",
                    lastName: "User",
                    role: "superAdmin",
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
            yield db.collection('users').insertMany(testUsers);
            console.log(`✅ Added ${testUsers.length} test users`);
            console.log('\n🎉 Database seeding completed successfully!');
            console.log('\n📊 Test Accounts Created:');
            console.log('🔑 Admin: admin@glangetaway.com / admin123');
            console.log('🏨 Resort Owner: biennickwadingan@gmail.com / password123');
            console.log('👤 User: biennickw@gmail.com / password123');
            console.log('\n🏖️ Sample Resorts Added:');
            resortsData.forEach((resort, index) => {
                console.log(`${index + 1}. ${resort.name} - ${resort.city}, ${resort.country} - ₱${resort.pricePerNight}/night`);
            });
        }
        catch (error) {
            console.error('❌ Database seeding failed:', error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the seeding
if (require.main === module) {
    seedDatabase();
}
exports.default = seedDatabase;
