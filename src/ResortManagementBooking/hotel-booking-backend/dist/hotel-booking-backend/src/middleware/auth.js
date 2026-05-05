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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sessionUtils_1 = require("../utils/sessionUtils");
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Allow OPTIONS requests (CORS preflight) to pass through without authentication
    if (req.method === 'OPTIONS') {
        return next();
    }
    // Extract token using enhanced session manager
    const token = sessionUtils_1.SessionManager.extractToken(req);
    if (!token) {
        return res.status(401).json({
            message: "unauthorized",
            code: "NO_TOKEN"
        });
    }
    try {
        // First, try to decode the token to determine its format
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            return res.status(401).json({
                message: "unauthorized",
                code: "INVALID_TOKEN"
            });
        }
        // Check if this is a new SessionManager format (has sessionId)
        if (decoded.sessionId) {
            // New SessionManager format
            const sessionData = sessionUtils_1.SessionManager.verifyAccessToken(token);
            if (!sessionData) {
                return res.status(401).json({
                    message: "unauthorized",
                    code: "INVALID_TOKEN"
                });
            }
            // Check session age limits
            if (sessionUtils_1.SessionManager.isSessionExpired(sessionData.issuedAt)) {
                return res.status(401).json({
                    message: "Session expired",
                    code: "SESSION_EXPIRED"
                });
            }
            // Set user information from session data
            req.userId = sessionData.userId;
            req.user = {
                _id: sessionData.userId,
                id: sessionData.userId,
                email: sessionData.email,
                role: sessionData.role,
                isActive: true,
                sessionId: sessionData.sessionId
            };
            // Add session info to headers for debugging
            res.setHeader('X-Session-ID', sessionData.sessionId);
            res.setHeader('X-Token-Expiry', new Date(sessionData.expiresAt * 1000).toISOString());
            res.setHeader('X-Token-Format', 'session');
        }
        else {
            // Legacy simple format - validate directly for backward compatibility
            const legacyData = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
            if (!legacyData || !legacyData.userId) {
                return res.status(401).json({
                    message: "unauthorized",
                    code: "INVALID_LEGACY_TOKEN"
                });
            }
            // Set user information from legacy token
            req.userId = legacyData.userId;
            req.user = {
                _id: legacyData.userId,
                id: legacyData.userId,
                email: legacyData.email,
                role: legacyData.role,
                isActive: true,
                sessionId: `legacy-${legacyData.userId}`
            };
            // Add legacy info to headers for debugging
            res.setHeader('X-Session-ID', `legacy-${legacyData.userId}`);
            res.setHeader('X-Token-Format', 'legacy');
        }
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            message: "unauthorized",
            code: "VERIFICATION_ERROR"
        });
    }
});
exports.default = verifyToken;
