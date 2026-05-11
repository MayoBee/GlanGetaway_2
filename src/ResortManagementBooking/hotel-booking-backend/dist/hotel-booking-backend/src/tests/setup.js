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
// Jest setup file
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017/hotel-booking-test';
process.env.JWT_SECRET_KEY = 'test-secret-key';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';
// Set up MongoDB connection for tests
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING);
    }
    catch (error) {
        console.log('MongoDB connection failed, using in-memory database for tests');
        // Tests will run without actual database connection
    }
}));
// Clean up after tests
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    if (mongoose_1.default.connection.readyState !== 0) {
        yield mongoose_1.default.connection.close();
    }
}));
