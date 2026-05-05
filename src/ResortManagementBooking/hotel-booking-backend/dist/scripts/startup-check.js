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
function checkDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Checking database connection...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Database connection successful');
            const db = mongoose_1.default.connection.db;
            // Check if collections exist and have data
            const collections = ['users', 'hotels', 'bookings', 'reports'];
            for (const collectionName of collections) {
                const collection = db.collection(collectionName);
                const count = yield collection.countDocuments();
                console.log(`📋 ${collectionName}: ${count} documents`);
            }
            console.log('✅ Database check completed');
        }
        catch (error) {
            console.error('❌ Database check failed:', error);
            throw error;
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run check if called directly
if (require.main === module) {
    checkDatabase()
        .then(() => {
        console.log('🎉 Database is ready for use!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Database is not ready!');
        process.exit(1);
    });
}
exports.default = checkDatabase;
