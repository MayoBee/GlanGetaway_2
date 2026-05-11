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
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
function migrateHotels() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_CONNECTION_STRING);
            console.log('✅ Connected to database');
            const db = mongoose_1.default.connection.db;
            const hotelsCollection = db.collection('hotels');
            // Update all hotels with missing fields
            const result = yield hotelsCollection.updateMany({}, [
                {
                    $set: {
                        imageUrls: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ['$imageUrls', []] } }, 0] },
                                then: '$imageUrls',
                                else: { $cond: { if: '$image', then: ['$image'], else: [] } }
                            }
                        },
                        starRating: { $ifNull: ['$starRating', { $ifNull: ['$rating', 3] }] },
                        type: {
                            $cond: {
                                if: { $isArray: '$type' },
                                then: '$type',
                                else: { $cond: { if: '$type', then: ['$type'], else: ['Resort'] } }
                            }
                        }
                    }
                }
            ]);
            console.log(`✅ Migration completed. Updated ${result.modifiedCount} hotels`);
            // Verify the changes
            const hotels = yield hotelsCollection.find({}).toArray();
            hotels.forEach((h, i) => {
                var _a;
                console.log(`\nHotel ${i + 1}: ${h.name}`);
                console.log('  imageUrls:', ((_a = h.imageUrls) === null || _a === void 0 ? void 0 : _a.length) || 0);
                console.log('  starRating:', h.starRating);
                console.log('  type:', h.type);
            });
            yield mongoose_1.default.disconnect();
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            yield mongoose_1.default.disconnect();
            process.exit(1);
        }
    });
}
migrateHotels();
