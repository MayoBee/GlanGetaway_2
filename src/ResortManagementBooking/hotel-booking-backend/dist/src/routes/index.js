"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountRoutes = void 0;
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("../swagger");
const path_1 = __importDefault(require("path"));
const users_1 = __importDefault(require("./users"));
const auth_1 = __importDefault(require("./auth"));
const auth_refresh_1 = __importDefault(require("./auth-refresh"));
const compliance_1 = __importDefault(require("./compliance"));
const deployment_1 = __importDefault(require("./deployment"));
const my_hotels_1 = __importDefault(require("./my-hotels"));
const hotels_1 = __importDefault(require("./hotels"));
const my_bookings_1 = __importDefault(require("./my-bookings"));
const bookings_1 = __importDefault(require("./bookings"));
const health_1 = __importDefault(require("./health"));
const business_insights_1 = __importDefault(require("./business-insights"));
const reports_1 = __importDefault(require("./reports"));
const website_feedback_1 = __importDefault(require("./website-feedback"));
const resort_approval_1 = __importDefault(require("./resort-approval"));
const admin_management_1 = __importDefault(require("./admin-management"));
const admin_1 = __importDefault(require("./admin"));
const role_promotion_requests_1 = __importDefault(require("./role-promotion-requests"));
// New Resort Management Routes
const staff_management_1 = __importDefault(require("./staff-management"));
const dashboard_1 = __importDefault(require("./dashboard"));
const rooms_1 = __importDefault(require("./rooms"));
const pricing_1 = __importDefault(require("./pricing"));
const amenities_1 = __importDefault(require("./amenities"));
const housekeeping_maintenance_1 = __importDefault(require("./housekeeping-maintenance"));
const billing_1 = __importDefault(require("./billing"));
const resort_reports_1 = __importDefault(require("./resort-reports"));
// Smart Features Routes
const room_blocks_1 = __importDefault(require("./room-blocks"));
const payments_1 = __importDefault(require("./payments"));
const identity_verification_1 = __importDefault(require("./identity-verification"));
const verification_documents_1 = __importDefault(require("./verification-documents"));
const weather_triggers_1 = __importDefault(require("./weather-triggers"));
const amenity_slots_1 = __importDefault(require("./amenity-slots"));
const housekeeping_tasks_1 = __importDefault(require("./housekeeping-tasks"));
const feature_flags_1 = __importDefault(require("./feature-flags"));
const resort_staff_1 = __importDefault(require("./resort-staff"));
const resort_owner_application_1 = __importDefault(require("./resort-owner-application"));
const mountRoutes = (app) => {
    app.get("/", (req, res) => {
        res.send("<h1>Hotel Booking Backend API is running 🚀</h1>");
    });
    app.use("/api/auth", auth_1.default);
    app.use("/api/auth", auth_refresh_1.default);
    app.use("/api/compliance", compliance_1.default);
    app.use("/api/deployment", deployment_1.default);
    app.use("/api/users", users_1.default);
    app.use("/api/my-hotels", my_hotels_1.default);
    app.use("/api/hotels", hotels_1.default);
    app.use("/api/my-bookings", my_bookings_1.default);
    app.use("/api/bookings", bookings_1.default);
    app.use("/api/health", health_1.default);
    app.use("/api/business-insights", business_insights_1.default);
    app.use("/api/reports", reports_1.default);
    app.use("/api/website-feedback", website_feedback_1.default);
    app.use("/api/resort-approval", resort_approval_1.default);
    app.use("/api/admin-management", admin_management_1.default);
    app.use("/api/role-promotion-requests", role_promotion_requests_1.default);
    app.use("/api/admin", admin_1.default);
    // New Resort Management API Routes
    app.use("/api/staff", staff_management_1.default);
    app.use("/api/resort-staff", resort_staff_1.default);
    app.use("/api/dashboard", dashboard_1.default);
    app.use("/api/rooms", rooms_1.default);
    app.use("/api/pricing", pricing_1.default);
    app.use("/api/amenities", amenities_1.default);
    app.use("/api/operations", housekeeping_maintenance_1.default);
    app.use("/api/billing", billing_1.default);
    app.use("/api/resort-reports", resort_reports_1.default);
    // Smart Features API Routes
    app.use("/api/room-blocks", room_blocks_1.default);
    app.use("/api/payments", payments_1.default);
    app.use("/api/identity-verification", identity_verification_1.default);
    app.use("/api/verification-documents", verification_documents_1.default);
    app.use("/api/weather-triggers", weather_triggers_1.default);
    app.use("/api/amenity-slots", amenity_slots_1.default);
    app.use("/api/housekeeping-tasks", housekeeping_tasks_1.default);
    app.use("/api/feature-flags", feature_flags_1.default);
    // Debug middleware for resort owner application
    app.use("/api/resort-owner-application", (req, res, next) => {
        console.log('🔍 Main Router - Resort Owner Application Request:', {
            method: req.method,
            url: req.url,
            headers: req.headers,
            contentType: req.headers['content-type']
        });
        next();
    });
    app.use("/api/resort-owner-application", resort_owner_application_1.default);
    // Swagger API Documentation
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Hotel Booking API Documentation",
    }));
    // Serve uploaded files statically
    app.use('/uploads', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
            return;
        }
        next();
    }, express_1.default.static(path_1.default.join(__dirname, '..', '..', 'uploads')));
    // 404 Handler for undefined routes
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: {
                message: `Route ${req.method} ${req.originalUrl} not found`,
                code: 'NOT_FOUND',
                statusCode: 404
            }
        });
    });
};
exports.mountRoutes = mountRoutes;
