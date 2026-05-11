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
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
function migrateHousekeepingToHotels() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to database');
            const db = mongoose_1.default.connection.db;
            const housekeepingsCollection = db.collection('housekeepings');
            const hotelsCollection = db.collection('hotels');
            // Check if there are documents in housekeepings
            const housekeepingsCount = yield housekeepingsCollection.countDocuments();
            console.log(`📊 Found ${housekeepingsCount} documents in housekeepings collection`);
            if (housekeepingsCount === 0) {
                console.log('⚠️ No documents to migrate');
                yield mongoose_1.default.disconnect();
                return;
            }
            // Get all documents from housekeepings
            const housekeepings = yield housekeepingsCollection.find({}).toArray();
            console.log(`📋 Found ${housekeepings.length} resorts to migrate`);
            let migratedCount = 0;
            let skippedCount = 0;
            for (const hk of housekeepings) {
                // Check if this resort already exists in hotels collection (by name or _id)
                const existingByName = yield hotelsCollection.findOne({ name: hk.name });
                const existingById = yield hotelsCollection.findOne({ _id: hk._id });
                if (existingByName || existingById) {
                    console.log(`⏭️ Skipping "${hk.name}" - already exists in hotels collection`);
                    skippedCount++;
                    continue;
                }
                // Ensure required fields exist
                const hotelDoc = Object.assign(Object.assign({}, hk), { 
                    // Ensure isApproved is set to true so it shows on the website
                    isApproved: hk.isApproved !== false, 
                    // Ensure type is an array
                    type: Array.isArray(hk.type) ? hk.type : (hk.type ? [hk.type] : ['Resort']), 
                    // Ensure imageUrls is an array
                    imageUrls: Array.isArray(hk.imageUrls) ? hk.imageUrls : (hk.image ? [hk.image] : []), 
                    // Ensure starRating exists
                    starRating: hk.starRating || hk.rating || 3, 
                    // Set timestamps if missing
                    createdAt: hk.createdAt || new Date(), updatedAt: hk.updatedAt || new Date() });
                // Insert into hotels collection
                yield hotelsCollection.insertOne(hotelDoc);
                console.log(`✅ Migrated "${hk.name}" to hotels collection`);
                migratedCount++;
            }
            console.log(`\n📊 Migration Summary:`);
            console.log(`   - Migrated: ${migratedCount}`);
            console.log(`   - Skipped: ${skippedCount}`);
            console.log(`   - Total processed: ${housekeepings.length}`);
            // Verify the migration
            const hotelsCount = yield hotelsCollection.countDocuments();
            console.log(`\n📊 Total resorts in hotels collection: ${hotelsCount}`);
            yield mongoose_1.default.disconnect();
            console.log('✅ Migration completed successfully');
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            yield mongoose_1.default.disconnect();
            process.exit(1);
        }
    });
}
migrateHousekeepingToHotels();
