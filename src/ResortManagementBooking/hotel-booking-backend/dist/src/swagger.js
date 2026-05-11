"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = void 0;
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const port = process.env.PORT || 5000;
const backendUrl = ((_a = process.env.BACKEND_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, "")) || `http://localhost:${port}`;
const servers = [{ url: backendUrl, description: "API Server" }];
if (process.env.BACKEND_URL) {
    servers.push({
        url: `http://localhost:${port}`,
        description: "Local development",
    });
}
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Hotel Booking API",
            version: "1.0.0",
            description: "A comprehensive API for hotel booking and management system",
            contact: {
                name: "API Support",
                email: "support@mernholidays.com",
            },
        },
        servers,
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "jwt",
                },
            },
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    // Support both .ts (dev) and .js (production build) - path relative to this file
    apis: [
        path_1.default.join(__dirname, "routes", "*.ts"),
        path_1.default.join(__dirname, "routes", "*.js"),
    ],
};
exports.specs = (0, swagger_jsdoc_1.default)(options);
