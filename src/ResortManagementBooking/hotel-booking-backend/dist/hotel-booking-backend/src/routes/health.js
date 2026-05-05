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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get API health status
 *     description: Returns the current health status of the API including database connection, memory usage, and uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     collections:
 *                       type: number
 *                       description: Number of collections in database
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Memory usage in MB
 *                     total:
 *                       type: number
 *                       description: Total memory in MB
 *                     percentage:
 *                       type: number
 *                       description: Memory usage percentage
 *       503:
 *         description: API is unhealthy
 */
router.get("/", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check database connection
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected";
    const collections = (yield ((_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.listCollections().toArray())) || [];
    // Get memory usage
    const memUsage = process.memoryUsage();
    const usedMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);
    // Get uptime
    const uptime = process.uptime();
    const healthData = {
        status: dbStatus === "connected" ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        database: {
            status: dbStatus,
            collections: collections.length,
            name: mongoose_1.default.connection.name || "hotel-booking",
        },
        memory: {
            used: usedMemoryMB,
            total: totalMemoryMB,
            percentage: memoryPercentage,
        },
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
    };
    const statusCode = dbStatus === "connected" ? 200 : 503;
    res.status(statusCode).json(healthData);
})));
/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Get detailed API health status
 *     description: Returns detailed health information including system metrics and performance data
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get("/detailed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const detailedHealth = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                pid: process.pid,
            },
            performance: {
                memory: {
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    external: memUsage.external,
                    rss: memUsage.rss,
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system,
                },
                uptime: Math.round(process.uptime()),
            },
            database: {
                status: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
                readyState: mongoose_1.default.connection.readyState,
                host: mongoose_1.default.connection.host,
                port: mongoose_1.default.connection.port,
                name: mongoose_1.default.connection.name,
            },
        };
        res.status(200).json(detailedHealth);
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            error: "Detailed health check failed",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
exports.default = router;
