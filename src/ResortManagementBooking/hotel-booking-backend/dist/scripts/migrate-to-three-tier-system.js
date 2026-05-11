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
const hotel_1 = __importDefault(require("../src/models/hotel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function migrateToThreeTierSystem() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("📡 Connected to MongoDB");
            console.log("\n🔄 Starting migration to three-tier account system...");
            // Step 1: Update user roles
            console.log("\n📋 Step 1: Migrating user roles...");
            // Count existing users by role
            const users = yield user_1.default.find({});
            console.log(`📊 Found ${users.length} users in database`);
            let userRoleUpdates = 0;
            let adminRoleUpdates = 0;
            let hotelOwnerToAdminUpdates = 0;
            for (const user of users) {
                let needsUpdate = false;
                // Convert hotel_owner to admin (check raw data)
                const rawUser = user.toObject();
                if (rawUser.role === "hotel_owner") {
                    user.set("role", "admin");
                    hotelOwnerToAdminUpdates++;
                    needsUpdate = true;
                    console.log(`🔄 Converting hotel_owner to admin: ${user.email}`);
                }
                // Ensure role is one of the new values
                if (!rawUser.role || !["user", "admin", "super_admin"].includes(rawUser.role)) {
                    user.set("role", "user");
                    userRoleUpdates++;
                    needsUpdate = true;
                    console.log(`🔄 Setting default role to user: ${user.email}`);
                }
                if (needsUpdate) {
                    yield user.save();
                }
            }
            console.log(`✅ User role migration completed:`);
            console.log(`   - Hotel owners converted to admins: ${hotelOwnerToAdminUpdates}`);
            console.log(`   - Default role assignments: ${userRoleUpdates}`);
            // Step 2: Update hotels with approval system
            console.log("\n📋 Step 2: Adding approval system to existing hotels...");
            const hotels = yield hotel_1.default.find({});
            console.log(`📊 Found ${hotels.length} hotels in database`);
            let hotelsApproved = 0;
            let hotelsPending = 0;
            for (const hotel of hotels) {
                let needsUpdate = false;
                // If hotel doesn't have isApproved field, set it based on existing data
                if (hotel.isApproved === undefined) {
                    // Auto-approve existing hotels (they were already visible)
                    hotel.isApproved = true;
                    hotel.approvedAt = hotel.createdAt || new Date();
                    hotelsApproved++;
                    needsUpdate = true;
                    console.log(`✅ Auto-approving existing hotel: ${hotel.name}`);
                }
                // Ensure approval fields exist
                if (hotel.approvedBy === undefined) {
                    hotel.approvedBy = undefined;
                    needsUpdate = true;
                }
                if (hotel.rejectionReason === undefined) {
                    hotel.rejectionReason = undefined;
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    yield hotel.save();
                }
            }
            console.log(`✅ Hotel approval system migration completed:`);
            console.log(`   - Existing hotels auto-approved: ${hotelsApproved}`);
            console.log(`   - Hotels pending approval: ${hotelsPending}`);
            // Step 3: Display final statistics
            console.log("\n📊 Final System Statistics:");
            const userStats = yield user_1.default.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } }
            ]);
            console.log("👥 User Roles:");
            userStats.forEach(stat => {
                console.log(`   - ${stat._id}: ${stat.count} users`);
            });
            const hotelStats = yield hotel_1.default.aggregate([
                { $group: { _id: "$isApproved", count: { $sum: 1 } } }
            ]);
            console.log("🏨 Hotel Approval Status:");
            hotelStats.forEach(stat => {
                console.log(`   - ${stat._id ? "Approved" : "Pending"}: ${stat.count} hotels`);
            });
            console.log("\n✅ Migration completed successfully!");
            console.log("\n📝 Next Steps:");
            console.log("1. Run the Super Admin initialization script");
            console.log("2. Test the new role-based access control");
            console.log("3. Verify that existing hotels are visible to users");
            console.log("4. Test new resort submission and approval workflow");
        }
        catch (error) {
            console.error("❌ Migration error:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run the script
if (require.main === module) {
    console.log("🚀 Starting Three-Tier System Migration");
    console.log("=========================================");
    migrateToThreeTierSystem();
}
exports.default = migrateToThreeTierSystem;
