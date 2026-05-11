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
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Initializing database connection...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            console.log(`📦 Using database: ${db.databaseName}`);
            // List all collections
            const collections = yield db.listCollections().toArray();
            console.log('📋 Existing collections:');
            collections.forEach(collection => {
                console.log(`  - ${collection.name}`);
            });
            // Create indexes for better performance
            console.log('🔍 Creating database indexes...');
            // Hotels collection indexes
            const hotelsCollection = db.collection('hotels');
            yield hotelsCollection.createIndex({ name: 1 });
            yield hotelsCollection.createIndex({ city: 1 });
            yield hotelsCollection.createIndex({ country: 1 });
            yield hotelsCollection.createIndex({ 'contact.email': 1 });
            console.log('✅ Hotels indexes created');
            // Users collection indexes
            const usersCollection = db.collection('users');
            yield usersCollection.createIndex({ email: 1 }, { unique: true });
            yield usersCollection.createIndex({ firstName: 1 });
            yield usersCollection.createIndex({ lastName: 1 });
            console.log('✅ Users indexes created');
            // Bookings collection indexes
            const bookingsCollection = db.collection('bookings');
            yield bookingsCollection.createIndex({ userId: 1 });
            yield bookingsCollection.createIndex({ hotelId: 1 });
            yield bookingsCollection.createIndex({ createdAt: -1 });
            console.log('✅ Bookings indexes created');
            // Reports collection indexes
            const reportsCollection = db.collection('reports');
            yield reportsCollection.createIndex({ reporterId: 1 });
            yield reportsCollection.createIndex({ reportedItemId: 1 });
            yield reportsCollection.createIndex({ status: 1 });
            yield reportsCollection.createIndex({ createdAt: -1 });
            console.log('✅ Reports indexes created');
            console.log('🎉 Database initialization completed successfully!');
            console.log('\n📊 Database Statistics:');
            // Count documents in each collection
            for (const collection of collections) {
                const count = yield db.collection(collection.name).countDocuments();
                console.log(`  ${collection.name}: ${count} documents`);
            }
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the initialization
if (require.main === module) {
    initDatabase();
}
exports.default = initDatabase;
