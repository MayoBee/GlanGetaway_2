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
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: '.env.migration' });
const LOCAL_DB_STRING = 'mongodb://localhost:27017/hotel-booking';
const ATLAS_DB_STRING = process.env.MONGODB_ATLAS_CONNECTION_STRING;
function migrateData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🔄 Starting migration...');
        const localClient = new mongodb_1.MongoClient(LOCAL_DB_STRING);
        const atlasClient = new mongodb_1.MongoClient(ATLAS_DB_STRING);
        try {
            // Connect to both databases
            yield localClient.connect();
            yield atlasClient.connect();
            const localDb = localClient.db('hotel-booking');
            const atlasDb = atlasClient.db('hotel-booking');
            console.log('✅ Connected to both databases');
            // Get all collections
            const collections = yield localDb.listCollections().toArray();
            console.log(`📋 Found ${collections.length} collections to migrate`);
            for (const collection of collections) {
                const collectionName = collection.name;
                console.log(`\n📦 Migrating: ${collectionName}`);
                try {
                    // Get all documents from local
                    const localCollection = localDb.collection(collectionName);
                    const documents = yield localCollection.find({}).toArray();
                    if (documents.length === 0) {
                        console.log(`   ⚠️  Empty collection, skipping...`);
                        continue;
                    }
                    // Clear Atlas collection
                    const atlasCollection = atlasDb.collection(collectionName);
                    yield atlasCollection.deleteMany({});
                    // Insert into Atlas
                    const result = yield atlasCollection.insertMany(documents);
                    console.log(`   ✅ Migrated ${result.insertedCount} documents`);
                }
                catch (error) {
                    console.error(`   ❌ Error with ${collectionName}:`, error);
                }
            }
            console.log('\n🎉 Migration completed!');
            // Verify
            console.log('\n🔍 Verifying migration...');
            for (const collection of collections) {
                const localCount = yield localDb.collection(collection.name).countDocuments();
                const atlasCount = yield atlasDb.collection(collection.name).countDocuments();
                const status = localCount === atlasCount ? '✅' : '❌';
                console.log(`   ${status} ${collection.name}: Local=${localCount}, Atlas=${atlasCount}`);
            }
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
        }
        finally {
            yield localClient.close();
            yield atlasClient.close();
        }
    });
}
migrateData();
