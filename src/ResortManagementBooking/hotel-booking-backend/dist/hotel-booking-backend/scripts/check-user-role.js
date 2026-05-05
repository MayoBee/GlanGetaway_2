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
function checkUserRole() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to database');
            const db = mongoose_1.default.connection.db;
            const usersCollection = db.collection('users');
            // Get all users
            const users = yield usersCollection.find({}).toArray();
            console.log(`\n📊 Found ${users.length} users:\n`);
            users.forEach((user, index) => {
                console.log(`User ${index + 1}:`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  First Name: ${user.firstName}`);
                console.log(`  Last Name: ${user.lastName}`);
                console.log(`  _id: ${user._id}\n`);
            });
            yield mongoose_1.default.disconnect();
        }
        catch (error) {
            console.error('❌ Error:', error);
            yield mongoose_1.default.disconnect();
            process.exit(1);
        }
    });
}
checkUserRole();
