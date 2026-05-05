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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bootstrap_1 = require("../src/bootstrap");
// Initialize everything
(0, bootstrap_1.validateEnvironment)();
(0, bootstrap_1.configureCloudinary)();
(0, bootstrap_1.createUploadsDirectory)();
(0, bootstrap_1.setupMongoEventHandlers)();
// Connect to MongoDB (will be cached by Vercel)
let dbPromise = null;
const ensureDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!dbPromise) {
        dbPromise = (0, bootstrap_1.connectDB)();
    }
    yield dbPromise;
});
// Create and configure the Express app
const app = (0, bootstrap_1.createAndConfigureApp)();
// Export for Vercel serverless function
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureDB();
    return app(req, res);
});
