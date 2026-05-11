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
function promoteUserToAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            const mongoUri = process.env.MONGODB_CONNECTION_STRING;
            if (!mongoUri) {
                throw new Error("MONGODB_CONNECTION_STRING not found in environment variables");
            }
            yield mongoose_1.default.connect(mongoUri);
            console.log("📡 Connected to MongoDB");
            // Find the user to promote
            const email = process.argv[2]; // Get email from command line argument
            if (!email) {
                console.log("❌ Please provide an email address:");
                console.log("   Usage: npm run promote-admin <email>");
                console.log("   Example: npm run promote-admin admin@test.com");
                process.exit(1);
            }
            const user = yield user_1.default.findOne({ email });
            if (!user) {
                console.log(`❌ User with email '${email}' not found`);
                process.exit(1);
            }
            console.log(`👤 Found user: ${user.email} (Current role: ${user.role || "user"})`);
            // Update user role to admin
            const oldRole = user.role || "user";
            user.set("role", "admin");
            yield user.save();
            console.log(`✅ User promoted successfully!`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Old Role: ${oldRole}`);
            console.log(`   New Role: admin`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
        }
        catch (error) {
            console.error("❌ Error promoting user:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Run the script
if (require.main === module) {
    promoteUserToAdmin();
}
exports.default = promoteUserToAdmin;
