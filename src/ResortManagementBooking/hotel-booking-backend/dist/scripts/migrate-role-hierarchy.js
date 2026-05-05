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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Migration Script: Update Role Hierarchy
 *
 * Old Hierarchy:         New Hierarchy:
 * - super_admin    ->    - admin
 * - admin          ->    - resort_owner
 * - user           ->    - user
 * - front_desk     ->    - front_desk
 * - housekeeping   ->    - housekeeping
 */
function migrateRoleHierarchy() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("Connected to MongoDB");
            // Count before migration
            const beforeCounts = {
                super_admin: yield user_1.default.countDocuments({ role: "super_admin" }),
                admin: yield user_1.default.countDocuments({ role: "admin" }),
                user: yield user_1.default.countDocuments({ role: "user" }),
                front_desk: yield user_1.default.countDocuments({ role: "front_desk" }),
                housekeeping: yield user_1.default.countDocuments({ role: "housekeeping" }),
            };
            console.log("\n📊 Before Migration:");
            console.log(`   super_admin: ${beforeCounts.super_admin}`);
            console.log(`   admin: ${beforeCounts.admin}`);
            console.log(`   user: ${beforeCounts.user}`);
            console.log(`   front_desk: ${beforeCounts.front_desk}`);
            console.log(`   housekeeping: ${beforeCounts.housekeeping}`);
            // Migrate super_admin -> admin
            const superAdminResult = yield user_1.default.updateMany({ role: "super_admin" }, { $set: { role: "admin" } });
            console.log(`\n✅ Migrated ${superAdminResult.modifiedCount} users from super_admin to admin`);
            // Migrate admin -> resort_owner
            const adminResult = yield user_1.default.updateMany({ role: "admin" }, { $set: { role: "resort_owner" } });
            console.log(`✅ Migrated ${adminResult.modifiedCount} users from admin to resort_owner`);
            // Count after migration
            const afterCounts = {
                admin: yield user_1.default.countDocuments({ role: "admin" }),
                resort_owner: yield user_1.default.countDocuments({ role: "resort_owner" }),
                user: yield user_1.default.countDocuments({ role: "user" }),
                front_desk: yield user_1.default.countDocuments({ role: "front_desk" }),
                housekeeping: yield user_1.default.countDocuments({ role: "housekeeping" }),
            };
            console.log("\n📊 After Migration:");
            console.log(`   admin: ${afterCounts.admin}`);
            console.log(`   resort_owner: ${afterCounts.resort_owner}`);
            console.log(`   user: ${afterCounts.user}`);
            console.log(`   front_desk: ${afterCounts.front_desk}`);
            console.log(`   housekeeping: ${afterCounts.housekeeping}`);
            console.log("\n✅ Role hierarchy migration completed successfully!");
        }
        catch (error) {
            console.error("❌ Migration error:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log("Disconnected from MongoDB");
        }
    });
}
// Run the script
if (require.main === module) {
    migrateRoleHierarchy();
}
exports.default = migrateRoleHierarchy;
