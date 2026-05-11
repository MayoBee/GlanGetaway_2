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
exports.requireOwnershipOrAdmin = exports.requireManageMaintenance = exports.requireManageHousekeeping = exports.requireViewReports = exports.requireManageBookings = exports.requirePermission = exports.requireUser = exports.requireStaff = exports.requireAdmin = exports.requireSuperAdmin = exports.requireRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../domains/identity/models/user"));
const verifyToken = (req, res, next) => {
    var _a;
    // Allow OPTIONS requests (CORS preflight) to pass through without authentication
    if (req.method === 'OPTIONS') {
        return next();
    }
    const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token." });
    }
};
exports.verifyToken = verifyToken;
const requireRole = (roles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Access denied. User not authenticated." });
            }
            // Use user from verified JWT payload if available
            let user = req.user;
            if (!user) {
                // Fallback database lookup for legacy tokens or if not populated
                user = yield user_1.default.findById(req.userId).select('role isActive email');
                if (!user) {
                    return res.status(404).json({ message: "User not found." });
                }
                req.user = user;
            }
            if (!user.isActive) {
                return res.status(403).json({ message: "Account is deactivated." });
            }
            if (!roles.includes(user.role || "user")) {
                return res.status(403).json({
                    message: "Access denied. Insufficient permissions.",
                    required: roles,
                    current: user.role
                });
            }
            next();
        }
        catch (error) {
            console.error("Role verification error:", error);
            return res.status(500).json({ message: "Server error during role verification." });
        }
    });
};
exports.requireRole = requireRole;
// Specific role checkers
exports.requireSuperAdmin = (0, exports.requireRole)(["superAdmin"]);
exports.requireAdmin = (0, exports.requireRole)(["admin", "superAdmin"]);
exports.requireStaff = (0, exports.requireRole)(["admin", "resort_owner", "front_desk", "housekeeping"]);
exports.requireUser = (0, exports.requireRole)(["user", "admin", "resort_owner", "front_desk", "housekeeping"]);
// Permission-based access control
const requirePermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Access denied. User not authenticated." });
            }
            let user = req.user;
            if (!user || !user.permissions) {
                user = yield user_1.default.findById(req.userId).select('role isActive email permissions');
                if (!user) {
                    return res.status(404).json({ message: "User not found." });
                }
                req.user = user;
            }
            if (!user.isActive) {
                return res.status(403).json({ message: "Account is deactivated." });
            }
            // Admin always has all permissions
            if (user.role === "admin" || user.role === "superAdmin") {
                return next();
            }
            // Check specific permission
            if (!user.permissions || !user.permissions[permission]) {
                return res.status(403).json({
                    message: "Access denied. Insufficient permissions.",
                    requiredPermission: permission,
                    currentRole: user.role
                });
            }
            next();
        }
        catch (error) {
            console.error("Permission verification error:", error);
            return res.status(500).json({ message: "Server error during permission verification." });
        }
    });
};
exports.requirePermission = requirePermission;
// Shortcut permission checkers
exports.requireManageBookings = (0, exports.requirePermission)('canManageBookings');
exports.requireViewReports = (0, exports.requirePermission)('canViewReports');
exports.requireManageHousekeeping = (0, exports.requirePermission)('canManageHousekeeping');
exports.requireManageMaintenance = (0, exports.requirePermission)('canManageMaintenance');
// Check if user owns the resource or is admin/super admin
const requireOwnershipOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Access denied. User not authenticated." });
        }
        // Use user from verified JWT payload if available
        let user = req.user;
        if (!user) {
            // Fallback database lookup for legacy tokens
            user = yield user_1.default.findById(req.userId).select('role isActive email');
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
            req.user = user;
        }
        const resourceUserId = req.body.userId || req.params.userId;
        // Admin can access everything
        if (user.role === "admin") {
            req.user = user;
            return next();
        }
        // Resort owner can access their own resources
        if (user.role === "resort_owner" && resourceUserId === req.userId) {
            req.user = user;
            return next();
        }
        // User can only access their own resources
        if (user.role === "user" && resourceUserId === req.userId) {
            req.user = user;
            return next();
        }
        return res.status(403).json({
            message: "Access denied. You can only access your own resources.",
            current: user.role
        });
    }
    catch (error) {
        console.error("Ownership verification error:", error);
        return res.status(500).json({ message: "Server error during ownership verification." });
    }
});
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
