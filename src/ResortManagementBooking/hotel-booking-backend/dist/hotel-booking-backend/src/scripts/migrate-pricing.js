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
function migratePricing() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting pricing migration...');
            // Connect to MongoDB
            yield mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking');
            console.log('Connected to MongoDB');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Find all hotels that still have pricePerNight
            const hotels = yield hotelsCollection.find({ pricePerNight: { $exists: true } }).toArray();
            console.log(`Found ${hotels.length} hotels to migrate`);
            for (const hotel of hotels) {
                // Set dayRate and nightRate to the old pricePerNight value
                // Enable both rates by default
                yield hotelsCollection.updateOne({ _id: hotel._id }, {
                    $set: {
                        dayRate: hotel.pricePerNight,
                        nightRate: hotel.pricePerNight,
                        hasDayRate: true,
                        hasNightRate: true
                    },
                    $unset: {
                        pricePerNight: 1 // Remove the old field
                    }
                });
                console.log(`Migrated hotel: ${hotel.name}`);
            }
            console.log('Migration completed successfully');
            process.exit(0);
        }
        catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    });
}
migratePricing();
