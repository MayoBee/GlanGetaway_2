import "dotenv/config";
import {
  validateEnvironment,
  configureCloudinary,
  createUploadsDirectory,
  connectDB,
  setupMongoEventHandlers,
  createAndConfigureApp,
  createGracefulShutdown
} from "./bootstrap";

async function startServer() {
  // Initialize everything
  validateEnvironment();
  configureCloudinary();
  createUploadsDirectory();
  setupMongoEventHandlers();
  await connectDB();

  const app = createAndConfigureApp();

  // Dynamic Port Configuration (for Render, Coolify/VPS and local development)
  const PORT = parseInt(process.env.PORT || "5000", 10);
  
  const backendBaseUrl =
    process.env.BACKEND_URL?.replace(/\/$/, "") || `http://localhost:${PORT}`;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running on port:", PORT);
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Backend URL:", `${process.env.BACKEND_URL}`);
    console.log("=== VERSION INFO ===");
    console.log("Entrance Fee FormData Parsing Fix: v1.0 - Added includedEntranceFee parsing for rooms and cottages");
    console.log("Deployed on:", new Date().toISOString());
    console.log(`📚 API Docs: ${backendBaseUrl}/api-docs`);
    console.log(`💚 Health Check: ${backendBaseUrl}/api/health`);
  });

  const gracefulShutdown = createGracefulShutdown(server);

  // Handle shutdown signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
