"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockAdminFromMainSite = exports.restrictAdminToSubdirectory = void 0;
/**
 * Middleware to restrict admin access to admin subdirectory only
 * Prevents admin users from logging in through the main website
 */
const restrictAdminToSubdirectory = (req, res, next) => {
    // Get the origin from the request
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";
    // Allow admin login from admin-login path regardless of origin
    const isFromAdminLogin = referer.includes("/admin-login") ||
        req.path.includes("/admin-login") ||
        (referer && new URL(referer).pathname === "/admin-login");
    // Check if request is coming from admin subdirectory or admin portal
    const isFromAdminSubdirectory = isFromAdminLogin ||
        origin.includes("/admin") ||
        referer.includes("/admin") ||
        origin.includes(":5173") || // Admin dev server
        origin.includes(":5175") || // Admin dev server
        (process.env.NODE_ENV === "development" && (origin.includes(":5173") || origin.includes(":5175") || referer.includes(":5173") || referer.includes(":5175")));
    // Check if request is coming from main website
    const isFromMainWebsite = origin.includes(":5174") || // Main frontend dev
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);
    // Store the origin type for later use in auth routes
    req.originType = isFromAdminSubdirectory ? "admin" : isFromMainWebsite ? "main" : "unknown";
    // For login endpoints, we need to check the user's role after login
    // This middleware just marks the origin type - the actual blocking happens in auth routes
    next();
};
exports.restrictAdminToSubdirectory = restrictAdminToSubdirectory;
/**
 * Middleware to check if admin is trying to access from main website
 * Use this after verifying the user's role
 */
const blockAdminFromMainSite = (req, res, next) => {
    const originType = req.originType || "unknown";
    const userRole = req.userRole || "";
    // If user is admin and trying to access from main website, block them
    if ((userRole === "admin" || userRole === "super_admin") && originType === "main") {
        return res.status(403).json({
            message: "Admin access is restricted to the admin portal only.",
            redirectUrl: "/admin",
            error: "ADMIN_ACCESS_RESTRICTED"
        });
    }
    next();
};
exports.blockAdminFromMainSite = blockAdminFromMainSite;
