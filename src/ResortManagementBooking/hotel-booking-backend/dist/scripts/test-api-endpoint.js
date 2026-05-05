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
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
function testMyBookingsAPI() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Testing /api/my-bookings API endpoint...');
            // First, login to get a token
            console.log('🔑 Logging in as biennickw@gmail.com...');
            const loginResponse = yield axios_1.default.post(`${API_BASE_URL}/api/auth/login`, {
                email: "biennickw@gmail.com",
                password: "password123"
            });
            console.log('✅ Login successful');
            console.log('🔍 Token received:', loginResponse.data.token ? 'Yes' : 'No');
            console.log('🔍 User ID:', loginResponse.data.userId);
            const token = loginResponse.data.token;
            // Now test the my-bookings endpoint
            console.log('\n📋 Testing /api/my-bookings endpoint...');
            const bookingsResponse = yield axios_1.default.get(`${API_BASE_URL}/api/my-bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ API call successful');
            console.log(`📊 Response status: ${bookingsResponse.status}`);
            console.log(`📊 Response data length: ${bookingsResponse.data.length}`);
            if (bookingsResponse.data.length === 0) {
                console.log('❌ No bookings returned by API');
            }
            else {
                console.log('✅ Bookings found:');
                bookingsResponse.data.forEach((hotel, index) => {
                    var _a;
                    console.log(`  ${index + 1}. ${hotel.name} - ${((_a = hotel.bookings) === null || _a === void 0 ? void 0 : _a.length) || 0} bookings`);
                    if (hotel.bookings) {
                        hotel.bookings.forEach((booking, bookingIndex) => {
                            console.log(`     - Booking ${bookingIndex + 1}: ${booking.status} - ${booking.checkIn} to ${booking.checkOut}`);
                        });
                    }
                });
            }
        }
        catch (error) {
            console.error('❌ API test failed:');
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Message: ${((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || error.response.statusText}`);
            }
            else if (error.request) {
                console.error('   No response received - server might be down');
                console.error(`   URL: ${API_BASE_URL}`);
            }
            else {
                console.error(`   Error: ${error.message}`);
            }
        }
    });
}
// Run the test
if (require.main === module) {
    testMyBookingsAPI();
}
exports.default = testMyBookingsAPI;
