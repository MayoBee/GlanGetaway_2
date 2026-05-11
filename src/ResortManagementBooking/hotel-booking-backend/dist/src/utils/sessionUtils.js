"use strict";
/**
 * Session Management Utilities
 * Provides secure session handling with proper timeout and refresh mechanisms
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class SessionManager {
    /**
     * Generate a secure session ID
     */
    static generateSessionId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        const userId = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random}-${userId}`;
    }
    /**
     * Create access token with session information
     */
    static createAccessToken(userId, email, role) {
        const sessionId = this.generateSessionId();
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId,
            email,
            role,
            sessionId,
            issuedAt: now,
            expiresAt: now + this.parseDuration(this.config.accessTokenExpiry)
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: this.config.accessTokenExpiry,
            issuer: 'hotel-booking-system',
            audience: 'hotel-booking-client'
        });
    }
    /**
     * Create refresh token for session renewal
     */
    static createRefreshToken(userId, sessionId) {
        const payload = {
            userId,
            sessionId,
            type: 'refresh',
            issuedAt: Math.floor(Date.now() / 1000)
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY, {
            expiresIn: this.config.refreshTokenExpiry,
            issuer: 'hotel-booking-system',
            audience: 'hotel-booking-client'
        });
    }
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY, {
                issuer: 'hotel-booking-system',
                audience: 'hotel-booking-client'
            });
            // Check if token is expired
            if (Date.now() / 1000 > decoded.expiresAt) {
                return null;
            }
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY, {
                issuer: 'hotel-booking-system',
                audience: 'hotel-booking-client'
            });
            if (decoded.type !== 'refresh') {
                return null;
            }
            return {
                userId: decoded.userId,
                sessionId: decoded.sessionId
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    static refreshAccessToken(refreshToken, userSession) {
        const refreshData = this.verifyRefreshToken(refreshToken);
        if (!refreshData) {
            return null;
        }
        // Create new access token with same session ID
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId: userSession.userId,
            email: userSession.email,
            role: userSession.role,
            sessionId: refreshData.sessionId,
            issuedAt: now,
            expiresAt: now + this.parseDuration(this.config.accessTokenExpiry)
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: this.config.accessTokenExpiry,
            issuer: 'hotel-booking-system',
            audience: 'hotel-booking-client'
        });
    }
    /**
     * Check if session has exceeded maximum age
     */
    static isSessionExpired(issuedAt) {
        const maxAge = this.parseDuration(this.config.maxSessionAge);
        return (Date.now() / 1000 - issuedAt) > maxAge;
    }
    /**
     * Check if session has been idle for too long
     */
    static isSessionIdle(lastActivity) {
        const idleTimeout = this.parseDuration(this.config.idleTimeout);
        return (Date.now() / 1000 - lastActivity) > idleTimeout;
    }
    /**
     * Parse duration string to seconds
     */
    static parseDuration(duration) {
        const units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
            'w': 604800,
            'M': 2592000,
            'y': 31536000
        };
        const match = duration.match(/^(\d+)([smhdwMy])$/);
        if (!match) {
            throw new Error(`Invalid duration format: ${duration}`);
        }
        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }
    /**
     * Get session configuration
     */
    static getConfig() {
        return Object.assign({}, this.config);
    }
    /**
     * Extract token from request headers/cookies
     */
    static extractToken(req) {
        // Check Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // Check cookies
        if (req.cookies && req.cookies.session_id) {
            return req.cookies.session_id;
        }
        return null;
    }
    /**
     * Create secure HTTP-only cookie options
     */
    static getCookieOptions() {
        const maxAge = this.parseDuration(this.config.refreshTokenExpiry) * 1000; // Convert to milliseconds
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge,
            path: '/'
        };
    }
    /**
     * Invalidate session by setting expiration to past
     */
    static invalidateSession(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded)
                return false;
            // Create a token that's immediately expired
            const invalidToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, decoded), { expiresAt: 0 }), process.env.JWT_SECRET_KEY, { expiresIn: '0s' });
            return !!invalidToken;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.SessionManager = SessionManager;
SessionManager.DEFAULT_CONFIG = {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    maxSessionAge: '30d',
    idleTimeout: '2h'
};
SessionManager.config = Object.assign(Object.assign({}, SessionManager.DEFAULT_CONFIG), { accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m', refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d', maxSessionAge: process.env.MAX_SESSION_AGE || '30d', idleTimeout: process.env.IDLE_TIMEOUT || '2h' });
