const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Import individual route modules (access .default due to esModuleInterop)
const userRoutes = require('../dist/src/routes/users').default;
const authRoutes = require('../dist/src/routes/auth').default;
const myHotelRoutes = require('../dist/src/routes/my-hotels').default;
const hotelRoutes = require('../dist/src/routes/hotels').default;
const bookingRoutes = require('../dist/src/routes/my-bookings').default;
const bookingsManagementRoutes = require('../dist/src/routes/bookings').default;
const healthRoutes = require('../dist/src/routes/health').default;
const businessInsightsRoutes = require('../dist/src/routes/business-insights').default;
const reportRoutes = require('../dist/src/routes/reports').default;
const websiteFeedbackRoutes = require('../dist/src/routes/website-feedback').default;
const resortApprovalRoutes = require('../dist/src/routes/resort-approval').default;
const adminManagementRoutes = require('../dist/src/routes/admin-management').default;
const adminRoutes = require('../dist/src/routes/admin').default;
const rolePromotionRoutes = require('../dist/src/routes/role-promotion-requests').default;
const staffManagementRoutes = require('../dist/src/routes/staff-management').default;
const dashboardRoutes = require('../dist/src/routes/dashboard').default;
const roomRoutes = require('../dist/src/routes/rooms').default;
const pricingRoutes = require('../dist/src/routes/pricing').default;
const amenitiesRoutes = require('../dist/src/routes/amenities').default;
const housekeepingRoutes = require('../dist/src/routes/housekeeping-maintenance').default;
const billingRoutes = require('../dist/src/routes/billing').default;
const resortReportsRoutes = require('../dist/src/routes/resort-reports').default;
const roomBlocksRoutes = require('../dist/src/routes/room-blocks').default;
const paymentsRoutes = require('../dist/src/routes/payments').default;
const identityVerificationRoutes = require('../dist/src/routes/identity-verification').default;
const verificationDocumentsRoutes = require('../dist/src/routes/verification-documents').default;
const weatherTriggerRoutes = require('../dist/src/routes/weather-triggers').default;
const amenitySlotsRoutes = require('../dist/src/routes/amenity-slots').default;
const housekeepingTasksRoutes = require('../dist/src/routes/housekeeping-tasks').default;
const featureFlagRoutes = require('../dist/src/routes/feature-flags').default;

// MongoDB connection (cached for serverless)
let dbPromise = null;

const connectDB = async () => {
  if (!dbPromise) {
    dbPromise = mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  }
  return dbPromise;
};

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5173',
      'http://localhost:5175'
    ].filter(Boolean);
    
    // Allow all vercel.app and netlify.app origins
    if (origin.includes('vercel.app') || origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount routes
app.get("/", (req, res) => {
  res.send("<h1>Hotel Booking Backend API is running 🚀</h1>");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-hotels", myHotelRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/my-bookings", bookingRoutes);
app.use("/api/bookings", bookingsManagementRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/business-insights", businessInsightsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/website-feedback", websiteFeedbackRoutes);
app.use("/api/resort-approval", resortApprovalRoutes);
app.use("/api/admin-management", adminManagementRoutes);
app.use("/api/role-promotion-requests", rolePromotionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffManagementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/operations", housekeepingRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/resort-reports", resortReportsRoutes);
app.use("/api/room-blocks", roomBlocksRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/identity-verification", identityVerificationRoutes);
app.use("/api/verification-documents", verificationDocumentsRoutes);
app.use("/api/weather-triggers", weatherTriggerRoutes);
app.use("/api/amenity-slots", amenitySlotsRoutes);
app.use("/api/housekeeping-tasks", housekeepingTasksRoutes);
app.use("/api/feature-flags", featureFlagRoutes);

// Serverless handler
let serverPromise = null;

const handler = async (req, res) => {
  if (!serverPromise) {
    serverPromise = connectDB();
  }
  await serverPromise;
  return app(req, res);
};

module.exports = handler;
