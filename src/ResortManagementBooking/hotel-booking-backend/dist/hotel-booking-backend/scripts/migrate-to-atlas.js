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
exports.DatabaseMigrator = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: '.env.migration' });
const LOCAL_DB_STRING = 'mongodb://localhost:27017/hotel-booking';
const ATLAS_DB_STRING = process.env.MONGODB_ATLAS_CONNECTION_STRING || 'mongodb+srv://username:password@cluster.mongodb.net/hotel-booking';
class DatabaseMigrator {
    constructor() {
        this.localClient = new mongodb_1.MongoClient(LOCAL_DB_STRING);
        this.atlasClient = new mongodb_1.MongoClient(ATLAS_DB_STRING);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔄 Connecting to databases...');
            yield this.localClient.connect();
            this.localDb = this.localClient.db('hotel-booking');
            console.log('✅ Connected to local MongoDB');
            yield this.atlasClient.connect();
            this.atlasDb = this.atlasClient.db('hotel-booking');
            console.log('✅ Connected to MongoDB Atlas');
        });
    }
    getLocalCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield this.localDb.listCollections().toArray();
            return collections.map(c => c.name);
        });
    }
    migrateCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n📦 Migrating collection: ${collectionName}`);
            try {
                // Get all documents from local collection
                const localCollection = this.localDb.collection(collectionName);
                const documents = yield localCollection.find({}).toArray();
                if (documents.length === 0) {
                    console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
                    return;
                }
                // Clear existing data in Atlas collection
                const atlasCollection = this.atlasDb.collection(collectionName);
                yield atlasCollection.deleteMany({});
                // Insert documents into Atlas
                if (documents.length > 0) {
                    const result = yield atlasCollection.insertMany(documents);
                    console.log(`   ✅ Migrated ${result.insertedCount} documents to ${collectionName}`);
                }
            }
            catch (error) {
                console.error(`   ❌ Error migrating ${collectionName}:`, error);
            }
        });
    }
    migrateAll() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🚀 Starting database migration from Local to Atlas...\n');
            yield this.connect();
            const collections = yield this.getLocalCollections();
            console.log(`📋 Found ${collections.length} collections: ${collections.join(', ')}`);
            // Migrate each collection
            for (const collection of collections) {
                yield this.migrateCollection(collection);
            }
            // Verify migration
            console.log('\n🔍 Verifying migration...');
            for (const collection of collections) {
                const localCount = yield this.localDb.collection(collection).countDocuments();
                const atlasCount = yield this.atlasDb.collection(collection).countDocuments();
                const status = localCount === atlasCount ? '✅' : '❌';
                console.log(`   ${status} ${collection}: Local=${localCount}, Atlas=${atlasCount}`);
            }
            yield this.close();
            console.log('\n🎉 Migration completed!');
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.localClient.close();
            yield this.atlasClient.close();
        });
    }
    // Backup local data before migration
    backupLocalData() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('💾 Creating backup of local data...');
            const collections = yield this.getLocalCollections();
            const backupDir = path_1.default.join(process.cwd(), 'backups');
            if (!fs_1.default.existsSync(backupDir)) {
                fs_1.default.mkdirSync(backupDir);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path_1.default.join(backupDir, `local-backup-${timestamp}.json`);
            const backupData = {};
            for (const collectionName of collections) {
                const collection = this.localDb.collection(collectionName);
                const documents = yield collection.find({}).toArray();
                backupData[collectionName] = documents;
            }
            fs_1.default.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`✅ Backup saved to: ${backupFile}`);
        });
    }
}
exports.DatabaseMigrator = DatabaseMigrator;
// Main execution
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const migrator = new DatabaseMigrator();
        try {
            // Create backup first
            yield migrator.connect();
            yield migrator.backupLocalData();
            yield migrator.close();
            // Perform migration
            yield migrator.migrateAll();
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    });
}
// Run if called directly
if (require.main === module) {
    main();
}
