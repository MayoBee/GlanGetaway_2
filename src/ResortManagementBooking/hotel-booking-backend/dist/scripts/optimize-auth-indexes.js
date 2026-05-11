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
const user_1 = __importDefault(require("../src/models/user"));
// Script to optimize database indexes for faster authentication
function optimizeAuthIndexes() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Checking authentication indexes...');
            // Connect to database
            const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
            yield mongoose_1.default.connect(mongoUri);
            // Get current indexes
            const userIndexes = yield user_1.default.collection.getIndexes();
            console.log('📋 Current user collection indexes:', Object.keys(userIndexes));
            // Ensure email index exists and is optimal
            yield user_1.default.collection.createIndex({ email: 1 }, { unique: true, background: true });
            console.log('✅ Email index optimized');
            // Create compound index for role-based queries (if needed)
            yield user_1.default.collection.createIndex({ role: 1, isActive: 1 }, { background: true });
            console.log('✅ Role + Status compound index created');
            // Create index for lastLogin sorting (if needed)
            yield user_1.default.collection.createIndex({ lastLogin: -1 }, { background: true });
            console.log('✅ LastLogin index created');
            // Show index statistics
            const stats = yield user_1.default.collection.aggregate([{ $collStats: { count: {}, storageStats: {} } }]).toArray();
            if (stats.length > 0) {
                console.log(`📊 Collection size: ${(stats[0].storageStats.size / 1024).toFixed(2)} KB`);
                console.log(`📊 Document count: ${stats[0].count}`);
                console.log(`📊 Average document size: ${(stats[0].storageStats.avgObjSize / 1024).toFixed(2)} KB`);
            }
            console.log('🚀 Authentication indexes optimized successfully!');
        }
        catch (error) {
            console.error('❌ Error optimizing indexes:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run if called directly
if (require.main === module) {
    optimizeAuthIndexes();
}
exports.default = optimizeAuthIndexes;
