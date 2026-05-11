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
const bootstrap_1 = require("./bootstrap");
function startServer() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize everything
        (0, bootstrap_1.validateEnvironment)();
        (0, bootstrap_1.configureCloudinary)();
        (0, bootstrap_1.createUploadsDirectory)();
        (0, bootstrap_1.setupMongoEventHandlers)();
        yield (0, bootstrap_1.connectDB)();
        const app = (0, bootstrap_1.createAndConfigureApp)();
        // Dynamic Port Configuration (for Render, Coolify/VPS and local development)
        const PORT = process.env.PORT || 5000;
        const backendBaseUrl = ((_a = process.env.BACKEND_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, "")) || `http://localhost:${PORT}`;
        const server = app.listen(PORT, () => {
            console.log("🚀 ============================================");
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Local: http://localhost:${PORT}`);
            console.log(`🔗 Public: ${backendBaseUrl}`);
            console.log(`📚 API Docs: ${backendBaseUrl}/api-docs`);
            console.log(`💚 Health Check: ${backendBaseUrl}/api/health`);
            console.log("🚀 ============================================");
        });
        const gracefulShutdown = (0, bootstrap_1.createGracefulShutdown)(server);
        // Handle shutdown signals
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
