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
const http_1 = __importDefault(require("http"));
function checkAPI() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                hostname: 'localhost',
                port: 7002,
                path: '/api/hotels',
                method: 'GET'
            };
            const req = http_1.default.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const hotels = JSON.parse(data);
                        console.log('API Response:');
                        hotels.forEach((hotel, index) => {
                            console.log(`Hotel ${index + 1}:`, {
                                name: hotel.name,
                                dayRate: hotel.dayRate,
                                nightRate: hotel.nightRate,
                                hasDayRate: hotel.hasDayRate,
                                hasNightRate: hotel.hasNightRate
                            });
                        });
                        process.exit(0);
                    }
                    catch (parseError) {
                        console.error('Parse Error:', parseError);
                        console.log('Raw data:', data.substring(0, 500));
                        process.exit(1);
                    }
                });
            });
            req.on('error', (error) => {
                console.error('Request Error:', error);
                process.exit(1);
            });
            req.end();
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
checkAPI();
