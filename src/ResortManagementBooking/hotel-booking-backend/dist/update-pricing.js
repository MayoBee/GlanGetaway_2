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
function updatePricing() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect('mongodb://localhost:27017/hotel-booking');
            const db = mongoose_1.default.connection.db;
            // Update MCJorn Shoreline with proper pricing
            const result = yield db.collection('hotels').updateOne({ name: 'MCJorn Shoreline ' }, {
                $set: {
                    dayRate: 2000,
                    nightRate: 3500,
                    hasDayRate: true,
                    hasNightRate: true
                }
            });
            console.log('Updated hotel:', result.modifiedCount, 'documents');
            // Verify the update
            const hotel = yield db.collection('hotels').findOne({ name: 'MCJorn Shoreline ' });
            console.log('Updated hotel data:', {
                name: hotel.name,
                dayRate: hotel.dayRate,
                nightRate: hotel.nightRate,
                hasDayRate: hotel.hasDayRate,
                hasNightRate: hotel.hasNightRate
            });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
updatePricing();
