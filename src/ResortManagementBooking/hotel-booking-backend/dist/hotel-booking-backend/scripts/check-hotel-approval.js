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
function checkHotelApproval() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Connecting to database...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Database connection successful');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Get all hotels
            const hotels = yield hotelsCollection.find({}).toArray();
            console.log(`📋 Total hotels in database: ${hotels.length}`);
            hotels.forEach((hotel, index) => {
                console.log(`\nHotel ${index + 1}:`);
                console.log(`  Name: ${hotel.name}`);
                console.log(`  ID: ${hotel._id}`);
                console.log(`  isApproved: ${hotel.isApproved}`);
                console.log(`  status: ${hotel.status || 'N/A'}`);
            });
            // Count approved vs not approved
            const approved = yield hotelsCollection.countDocuments({ isApproved: true });
            const notApproved = yield hotelsCollection.countDocuments({ isApproved: false });
            const undefinedApproval = yield hotelsCollection.countDocuments({ isApproved: { $exists: false } });
            console.log(`\n📊 Approval Status Summary:`);
            console.log(`  Approved (isApproved: true): ${approved}`);
            console.log(`  Not Approved (isApproved: false): ${notApproved}`);
            console.log(`  Undefined isApproved field: ${undefinedApproval}`);
        }
        catch (error) {
            console.error('❌ Error checking hotel approval:', error);
            throw error;
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
checkHotelApproval()
    .then(() => {
    console.log('\n🎉 Hotel approval check completed!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Hotel approval check failed!');
    process.exit(1);
});
