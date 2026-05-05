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
function addSampleAccommodations() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Connecting to database...');
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to MongoDB successfully');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Find a resort to update (let's use the first one we find)
            const resort = yield hotelsCollection.findOne({});
            if (!resort) {
                console.log('❌ No resorts found in database');
                return;
            }
            console.log(`🏨 Found resort: ${resort.name}`);
            // Sample rooms data
            const rooms = [
                {
                    id: "room-1",
                    name: "Deluxe Beachfront Room",
                    type: "Deluxe",
                    pricePerNight: 3500,
                    maxOccupancy: 2,
                    description: "Beautiful room with ocean view and private balcony"
                },
                {
                    id: "room-2",
                    name: "Standard Garden Room",
                    type: "Standard",
                    pricePerNight: 2500,
                    maxOccupancy: 2,
                    description: "Comfortable room overlooking the tropical gardens"
                },
                {
                    id: "room-3",
                    name: "Family Suite",
                    type: "Suite",
                    pricePerNight: 5500,
                    maxOccupancy: 4,
                    description: "Spacious suite perfect for families with children"
                }
            ];
            // Sample cottages data
            const cottages = [
                {
                    id: "cottage-1",
                    name: "Beach Cottage",
                    type: "Beach Cottage",
                    pricePerNight: 4500,
                    maxOccupancy: 3,
                    description: "Private cottage just steps from the beach"
                },
                {
                    id: "cottage-2",
                    name: "Garden Villa",
                    type: "Garden Cottage",
                    pricePerNight: 6000,
                    maxOccupancy: 4,
                    description: "Luxury villa surrounded by tropical gardens"
                }
            ];
            // Update the resort with rooms and cottages
            const result = yield hotelsCollection.updateOne({ _id: resort._id }, {
                $set: {
                    rooms: rooms,
                    cottages: cottages
                }
            });
            if (result.modifiedCount > 0) {
                console.log('✅ Successfully added rooms and cottages to resort');
                console.log(`📊 Added ${rooms.length} rooms and ${cottages.length} cottages`);
                console.log(`🏨 Resort "${resort.name}" now has accommodation options`);
            }
            else {
                console.log('⚠️ No changes made to resort');
            }
            // Verify the update
            const updatedResort = yield hotelsCollection.findOne({ _id: resort._id });
            console.log('✅ Verification - Updated resort has:');
            console.log(`  - Rooms: ${((_a = updatedResort.rooms) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            console.log(`  - Cottages: ${((_b = updatedResort.cottages) === null || _b === void 0 ? void 0 : _b.length) || 0}`);
        }
        catch (error) {
            console.error('❌ Failed to add accommodations:', error);
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
    addSampleAccommodations();
}
exports.default = addSampleAccommodations;
