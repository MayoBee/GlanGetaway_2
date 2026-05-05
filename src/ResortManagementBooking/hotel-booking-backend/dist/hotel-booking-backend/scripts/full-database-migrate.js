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
dotenv_1.default.config({ path: '.env.migration' });
const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.MONGODB_ATLAS_CONNECTION_STRING;
const DB_NAME = 'hotel-booking';
function migrateEntireDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Starting full database migration...');
        const localClient = new mongodb_1.MongoClient(LOCAL_URI);
        const atlasClient = new mongodb_1.MongoClient(ATLAS_URI);
        try {
            yield localClient.connect();
            yield atlasClient.connect();
            const localDb = localClient.db(DB_NAME);
            const atlasDb = atlasClient.db(DB_NAME);
            console.log('✅ Connected to both databases');
            // Get all collections
            const collections = yield localDb.listCollections().toArray();
            console.log(`📋 Found ${collections.length} collections: ${collections.map(c => c.name).join(', ')}`);
            let totalMigrated = 0;
            for (const collection of collections) {
                const collectionName = collection.name;
                console.log(`\n📦 Migrating ${collectionName}...`);
                try {
                    const localCollection = localDb.collection(collectionName);
                    const documents = yield localCollection.find({}).toArray();
                    if (documents.length === 0) {
                        console.log(`   ⚠️  Empty collection`);
                        continue;
                    }
                    // Clear and recreate in Atlas
                    const atlasCollection = atlasDb.collection(collectionName);
                    yield atlasCollection.deleteMany({});
                    if (documents.length > 0) {
                        const result = yield atlasCollection.insertMany(documents);
                        console.log(`   ✅ ${result.insertedCount} documents migrated`);
                        totalMigrated += result.insertedCount;
                    }
                }
                catch (error) {
                    console.error(`   ❌ Error: ${error}`);
                }
            }
            console.log(`\n🎉 Migration completed! Total documents: ${totalMigrated}`);
            // Final verification
            console.log('\n🔍 Final verification:');
            let totalLocal = 0;
            let totalAtlas = 0;
            for (const collection of collections) {
                const localCount = yield localDb.collection(collection.name).countDocuments();
                const atlasCount = yield atlasDb.collection(collection.name).countDocuments();
                totalLocal += localCount;
                totalAtlas += atlasCount;
                const status = localCount === atlasCount ? '✅' : '❌';
                console.log(`   ${status} ${collection.name}: ${localCount} → ${atlasCount}`);
            }
            console.log(`\n📊 Summary: ${totalLocal} local → ${totalAtlas} Atlas`);
            if (totalLocal === totalAtlas) {
                console.log('🎊 Perfect migration! All data transferred successfully.');
            }
            else {
                console.log('⚠️  Some data may not have migrated correctly. Check individual collections.');
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
migrateEntireDatabase();
