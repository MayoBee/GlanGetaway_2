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
function approveAllResorts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Connecting to database...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Find all resorts that are not approved
            const unapprovedResorts = yield hotelsCollection.find({
                $or: [
                    { isApproved: { $ne: true } },
                    { isApproved: { $exists: false } }
                ]
            }).toArray();
            if (unapprovedResorts.length === 0) {
                console.log('✅ All resorts are already approved');
                return;
            }
            console.log(`🏨 Found ${unapprovedResorts.length} unapproved resorts:`);
            unapprovedResorts.forEach(resort => {
                console.log(`  - ${resort.name} (approved: ${resort.isApproved})`);
            });
            // Approve all resorts
            const result = yield hotelsCollection.updateMany({
                $or: [
                    { isApproved: { $ne: true } },
                    { isApproved: { $exists: false } }
                ]
            }, {
                $set: {
                    isApproved: true,
                    approvedAt: new Date()
                }
            });
            if (result.modifiedCount > 0) {
                console.log(`✅ Successfully approved ${result.modifiedCount} resorts`);
                // Verify the update
                const approvedCount = yield hotelsCollection.countDocuments({ isApproved: true });
                const totalCount = yield hotelsCollection.countDocuments();
                console.log(`📊 Database Statistics:`);
                console.log(`  - Total resorts: ${totalCount}`);
                console.log(`  - Approved resorts: ${approvedCount}`);
                console.log(`  - Unapproved resorts: ${totalCount - approvedCount}`);
            }
            else {
                console.log('⚠️ No resorts were updated');
            }
        }
        catch (error) {
            console.error('❌ Failed to approve resorts:', error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from database');
        }
    });
}
// Run the script
if (require.main === module) {
    approveAllResorts();
}
exports.default = approveAllResorts;
