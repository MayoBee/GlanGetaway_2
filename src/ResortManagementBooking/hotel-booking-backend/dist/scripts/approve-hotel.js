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
function approveHotel() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Connecting to database...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Database connection successful');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Get current hotel
            const hotel = yield hotelsCollection.findOne({});
            console.log('📋 Hotel before approval:', JSON.stringify(hotel, null, 2));
            if (!hotel) {
                console.log('❌ No hotel found in database');
                return;
            }
            // Approve the hotel
            yield hotelsCollection.updateOne({ _id: hotel._id }, { $set: { isApproved: true } });
            // Get updated hotel
            const updatedHotel = yield hotelsCollection.findOne({ _id: hotel._id });
            console.log('✅ Hotel approved successfully');
            console.log('📋 Hotel after approval:', JSON.stringify(updatedHotel, null, 2));
        }
        catch (error) {
            console.error('❌ Error approving hotel:', error);
            throw error;
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
approveHotel()
    .then(() => {
    console.log('🎉 Hotel approval completed!');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Hotel approval failed!');
    process.exit(1);
});
