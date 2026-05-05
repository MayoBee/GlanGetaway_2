"use strict";
/**
 * Authentication Refresh Routes
 * Handles token refresh and session renewal
 */
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
const sessionUtils_1 = require("../utils/sessionUtils");
const router = express_1.default.Router();
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                message: 'Refresh token is required',
                code: 'MISSING_REFRESH_TOKEN'
            });
        }
        // Verify refresh token
        const refreshData = sessionUtils_1.SessionManager.verifyRefreshToken(refreshToken);
        if (!refreshData) {
            return res.status(401).json({
                message: 'Invalid or expired refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
        // In a real implementation, you would fetch user data from database
        // For now, we'll extract minimal info from the refresh token
        const userSession = {
            userId: refreshData.userId,
            email: '',
            role: 'user' // Would come from database
        };
        // Create new access token
        const newAccessToken = sessionUtils_1.SessionManager.refreshAccessToken(refreshToken, userSession);
        if (!newAccessToken) {
            return res.status(401).json({
                message: 'Failed to refresh access token',
                code: 'REFRESH_FAILED'
            });
        }
        // Return new access token
        res.json({
            accessToken: newAccessToken,
            tokenType: 'Bearer',
            expiresIn: sessionUtils_1.SessionManager.getConfig().accessTokenExpiry,
            sessionId: refreshData.sessionId
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            message: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
}));
/**
 * POST /api/auth/logout
 * Invalidate session and clear tokens
 */
router.post('/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = sessionUtils_1.SessionManager.extractToken(req);
        if (token) {
            // Invalidate the session
            sessionUtils_1.SessionManager.invalidateSession(token);
        }
        // Clear cookies
        res.clearCookie('session_id');
        res.json({
            message: 'Logged out successfully',
            code: 'LOGOUT_SUCCESS'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
}));
/**
 * GET /api/auth/session-info
 * Get current session information
 */
router.get('/session-info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = sessionUtils_1.SessionManager.extractToken(req);
        if (!token) {
            return res.status(401).json({
                message: 'No session found',
                code: 'NO_SESSION'
            });
        }
        const sessionData = sessionUtils_1.SessionManager.verifyAccessToken(token);
        if (!sessionData) {
            return res.status(401).json({
                message: 'Invalid session',
                code: 'INVALID_SESSION'
            });
        }
        const timeUntilExpiry = sessionData.expiresAt - Math.floor(Date.now() / 1000);
        const isExpired = sessionUtils_1.SessionManager.isSessionExpired(sessionData.issuedAt);
        res.json({
            sessionId: sessionData.sessionId,
            userId: sessionData.userId,
            email: sessionData.email,
            role: sessionData.role,
            issuedAt: new Date(sessionData.issuedAt * 1000).toISOString(),
            expiresAt: new Date(sessionData.expiresAt * 1000).toISOString(),
            timeUntilExpiry,
            isExpired,
            sessionConfig: sessionUtils_1.SessionManager.getConfig()
        });
    }
    catch (error) {
        console.error('Session info error:', error);
        res.status(500).json({
            message: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
}));
exports.default = router;
