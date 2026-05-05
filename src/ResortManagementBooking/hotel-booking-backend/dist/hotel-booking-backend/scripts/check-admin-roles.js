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
const dotenv_1 = require("dotenv");
const types_1 = require("../../packages/shared/types");
// Load environment variables
(0, dotenv_1.config)();
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;
if (!MONGODB_CONNECTION_STRING) {
    console.error('MONGODB_CONNECTION_STRING not found in environment variables');
    process.exit(1);
}
function checkAndUpdateAdminRoles() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('Connected to MongoDB');
            // Check all users and their roles
            const allUsers = yield user_1.default.find({}, 'email firstName lastName role');
            console.log('\n=== All Users ===');
            allUsers.forEach(user => {
                console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
            });
            // Check if any admin users exist
            const adminUsers = yield user_1.default.find({ role: { $in: ['admin', 'super_admin'] } });
            console.log(`\n=== Admin Users Found: ${adminUsers.length} ===`);
            adminUsers.forEach(user => {
                console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
            });
            // If no admin users, let's create one or update an existing user
            if (adminUsers.length === 0) {
                console.log('\n=== No admin users found. Creating/updating admin user... ===');
                // Look for a specific email to make admin (you can change this)
                const targetEmail = 'admin@example.com'; // Change this to your admin email
                // Try to find user with target email
                let adminUser = yield user_1.default.findOne({ email: targetEmail });
                if (!adminUser) {
                    // If no user found, create a new admin user
                    console.log(`Creating new admin user with email: ${targetEmail}`);
                    adminUser = new user_1.default({
                        email: targetEmail,
                        firstName: 'Admin',
                        lastName: 'User',
                        password: 'admin123456',
                        role: 'superAdmin',
                        emailVerified: true,
                        isActive: true
                    });
                }
                else {
                    // Update existing user to admin
                    console.log(`Updating existing user to admin: ${targetEmail}`);
                    adminUser.role = 'superAdmin';
                }
                yield adminUser.save();
                console.log('Admin user created/updated successfully!');
                console.log(`Email: ${adminUser.email}, Role: ${adminUser.role}`);
            }
            // List admin users after update
            const updatedAdminUsers = yield user_1.default.find({ role: { $in: [types_1.UserRole.Admin, types_1.UserRole.SuperAdmin] } });
            console.log(`\n=== Admin Users After Update: ${updatedAdminUsers.length} ===`);
            updatedAdminUsers.forEach(user => {
                console.log(`Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
            });
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('\nDisconnected from MongoDB');
        }
    });
}
checkAndUpdateAdminRoles();
