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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
function debugUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Debugging user authentication...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            // Check user data
            const user = yield db.collection('users').findOne({ email: "biennickw@gmail.com" });
            if (!user) {
                console.log('❌ User not found');
                return;
            }
            console.log(`✅ Found user: ${user.email}`);
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Name: ${user.firstName} ${user.lastName}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Approved: ${user.isApproved}`);
            console.log(`   - Password hash exists: ${user.password ? 'Yes' : 'No'}`);
            // Test password verification
            const testPassword = "password123";
            const isValid = yield bcryptjs_1.default.compare(testPassword, user.password);
            console.log(`   - Password "password123" valid: ${isValid}`);
            if (!isValid) {
                console.log('🔧 Trying to fix password...');
                const newPassword = yield bcryptjs_1.default.hash(testPassword, 8);
                yield db.collection('users').updateOne({ _id: user._id }, { $set: { password: newPassword } });
                console.log('✅ Password updated to "password123"');
            }
        }
        catch (error) {
            console.error('❌ Debug failed:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the debug
if (require.main === module) {
    debugUser();
}
exports.default = debugUser;
