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
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@glangetaway.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
const SUPER_ADMIN_FIRST_NAME = "Admin";
const SUPER_ADMIN_LAST_NAME = "System";
function initializeSuperAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("Connected to MongoDB");
            // Check if Super Admin already exists
            const existingSuperAdmin = yield user_1.default.findOne({ email: SUPER_ADMIN_EMAIL });
            if (existingSuperAdmin) {
                console.log("Super Admin already exists:", existingSuperAdmin.email);
                yield mongoose_1.default.disconnect();
                return;
            }
            // Create Super Admin account
            const superAdmin = new user_1.default({
                email: SUPER_ADMIN_EMAIL,
                password: SUPER_ADMIN_PASSWORD,
                firstName: SUPER_ADMIN_FIRST_NAME,
                lastName: SUPER_ADMIN_LAST_NAME,
                role: "superAdmin",
                birthdate: new Date("1990-01-01"),
                emailVerified: true,
                isActive: true,
            });
            yield superAdmin.save();
            console.log("✅ Super Admin account created successfully!");
            console.log("📧 Email:", SUPER_ADMIN_EMAIL);
            console.log("🔑 Password:", SUPER_ADMIN_PASSWORD);
            console.log("👤 Role: admin");
            console.log("\n⚠️  Please save these credentials securely!");
            console.log("🔒 You can change the password after first login.");
        }
        catch (error) {
            console.error("❌ Error creating Super Admin:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run the script
if (require.main === module) {
    initializeSuperAdmin();
}
exports.default = initializeSuperAdmin;
