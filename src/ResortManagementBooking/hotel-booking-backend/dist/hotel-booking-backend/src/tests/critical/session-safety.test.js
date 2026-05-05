"use strict";
/**
 * Session Safety Tests
 * Tests session management, token refresh, and security
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
const supertest_1 = __importDefault(require("supertest"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bootstrap_1 = require("../../bootstrap");
const user_1 = __importDefault(require("../../domains/identity/models/user"));
const sessionUtils_1 = require("../../utils/sessionUtils");
describe('Session Safety', () => {
    let app;
    let testUser;
    let authToken;
    let refreshToken;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Increase timeout for test setup
        jest.setTimeout(30000);
        app = (0, bootstrap_1.createAndConfigureApp)();
        // Create test user
        const hashedPassword = yield bcryptjs_1.default.hash('testpassword123', 12);
        testUser = new user_1.default({
            email: `session-test-${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: 'Session',
            lastName: 'Test',
            role: 'user'
        });
        yield testUser.save();
        // Create access token
        authToken = sessionUtils_1.SessionManager.createAccessToken(testUser._id.toString(), testUser.email, testUser.role);
        // Create refresh token
        refreshToken = sessionUtils_1.SessionManager.createRefreshToken(testUser._id.toString(), 'test-session-id');
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup
        try {
            if (testUser) {
                yield user_1.default.deleteMany({ _id: testUser._id });
            }
        }
        catch (error) {
            console.log('Cleanup error:', error);
        }
    }));
    describe('Token Creation and Verification', () => {
        it('should create valid access token', () => {
            const token = sessionUtils_1.SessionManager.createAccessToken(testUser._id.toString(), testUser.email, testUser.role);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            const verified = sessionUtils_1.SessionManager.verifyAccessToken(token);
            expect(verified).not.toBeNull();
            expect(verified.userId).toBe(testUser._id.toString());
            expect(verified.email).toBe(testUser.email);
            expect(verified.role).toBe(testUser.role);
            expect(verified.sessionId).toBeDefined();
        });
        it('should create valid refresh token', () => {
            const token = sessionUtils_1.SessionManager.createRefreshToken(testUser._id.toString(), 'test-session-id');
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            const verified = sessionUtils_1.SessionManager.verifyRefreshToken(token);
            expect(verified).not.toBeNull();
            expect(verified.userId).toBe(testUser._id.toString());
            expect(verified.sessionId).toBe('test-session-id');
        });
        it('should reject invalid tokens', () => {
            const invalidToken = 'invalid.token.here';
            const accessVerified = sessionUtils_1.SessionManager.verifyAccessToken(invalidToken);
            expect(accessVerified).toBeNull();
            const refreshVerified = sessionUtils_1.SessionManager.verifyRefreshToken(invalidToken);
            expect(refreshVerified).toBeNull();
        });
        it('should reject expired tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a token that expires immediately
            const expiredToken = jsonwebtoken_1.default.sign({ userId: testUser._id, email: testUser.email, role: testUser.role }, process.env.JWT_SECRET_KEY, { expiresIn: '0s' });
            // Wait a moment to ensure expiration
            yield new Promise(resolve => setTimeout(resolve, 100));
            const verified = sessionUtils_1.SessionManager.verifyAccessToken(expiredToken);
            expect(verified).toBeNull();
        }));
    });
    describe('Session Age Limits', () => {
        it('should detect expired sessions', () => {
            const oldTimestamp = Math.floor(Date.now() / 1000) - (31 * 24 * 60 * 60); // 31 days ago
            expect(sessionUtils_1.SessionManager.isSessionExpired(oldTimestamp)).toBe(true);
        });
        it('should allow valid sessions', () => {
            const recentTimestamp = Math.floor(Date.now() / 1000) - (24 * 60 * 60); // 1 day ago
            expect(sessionUtils_1.SessionManager.isSessionExpired(recentTimestamp)).toBe(false);
        });
        it('should detect idle sessions', () => {
            const oldActivity = Math.floor(Date.now() / 1000) - (3 * 60 * 60); // 3 hours ago
            expect(sessionUtils_1.SessionManager.isSessionIdle(oldActivity)).toBe(true);
        });
        it('should allow active sessions', () => {
            const recentActivity = Math.floor(Date.now() / 1000) - (30 * 60); // 30 minutes ago
            expect(sessionUtils_1.SessionManager.isSessionIdle(recentActivity)).toBe(false);
        });
    });
    describe('Token Refresh', () => {
        it('should refresh access token successfully', () => {
            const userSession = {
                userId: testUser._id.toString(),
                email: testUser.email,
                role: testUser.role
            };
            const newToken = sessionUtils_1.SessionManager.refreshAccessToken(refreshToken, userSession);
            expect(newToken).not.toBeNull();
            expect(typeof newToken).toBe('string');
            const verified = sessionUtils_1.SessionManager.verifyAccessToken(newToken);
            expect(verified).not.toBeNull();
            expect(verified.userId).toBe(testUser._id.toString());
        });
        it('should reject refresh with invalid token', () => {
            const userSession = {
                userId: testUser._id.toString(),
                email: testUser.email,
                role: testUser.role
            };
            const newToken = sessionUtils_1.SessionManager.refreshAccessToken('invalid-token', userSession);
            expect(newToken).toBeNull();
        });
    });
    describe('Session API Endpoints', () => {
        it('should get session info with valid token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/auth/session-info')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.sessionId).toBeDefined();
            expect(response.body.userId).toBe(testUser._id.toString());
            expect(response.body.email).toBe(testUser.email);
            expect(response.body.role).toBe(testUser.role);
            expect(response.body.timeUntilExpiry).toBeDefined();
            expect(response.body.isExpired).toBe(false);
        }));
        it('should reject session info with invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/auth/session-info')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_SESSION');
        }));
        it('should handle token refresh endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });
            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.tokenType).toBe('Bearer');
            expect(response.body.expiresIn).toBeDefined();
        }));
        it('should reject refresh with missing token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/refresh')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('MISSING_REFRESH_TOKEN');
        }));
        it('should handle logout endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toContain('logged out');
        }));
        it('should handle logout without token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/auth/logout');
            expect(response.status).toBe(200);
            expect(response.body.message).toContain('logged out');
        }));
    });
    describe('Token Extraction', () => {
        it('should extract token from Authorization header', () => {
            const req = {
                headers: {
                    authorization: 'Bearer test-token-here'
                }
            };
            const token = sessionUtils_1.SessionManager.extractToken(req);
            expect(token).toBe('test-token-here');
        });
        it('should extract token from cookies', () => {
            const req = {
                headers: {},
                cookies: {
                    session_id: 'cookie-token-here'
                }
            };
            const token = sessionUtils_1.SessionManager.extractToken(req);
            expect(token).toBe('cookie-token-here');
        });
        it('should return null when no token found', () => {
            const req = {
                headers: {},
                cookies: {}
            };
            const token = sessionUtils_1.SessionManager.extractToken(req);
            expect(token).toBeNull();
        });
    });
    describe('Cookie Options', () => {
        it('should generate secure cookie options', () => {
            const options = sessionUtils_1.SessionManager.getCookieOptions();
            expect(options.httpOnly).toBe(true);
            expect(options.secure).toBe(process.env.NODE_ENV === 'production');
            expect(options.sameSite).toBe('strict');
            expect(options.maxAge).toBeGreaterThan(0);
            expect(options.path).toBe('/');
        });
    });
    describe('Session Configuration', () => {
        it('should return session configuration', () => {
            const config = sessionUtils_1.SessionManager.getConfig();
            expect(config.accessTokenExpiry).toBeDefined();
            expect(config.refreshTokenExpiry).toBeDefined();
            expect(config.maxSessionAge).toBeDefined();
            expect(config.idleTimeout).toBeDefined();
        });
    });
    describe('Session Invalidation', () => {
        it('should invalidate session successfully', () => {
            const result = sessionUtils_1.SessionManager.invalidateSession(authToken);
            expect(result).toBe(true);
        });
        it('should handle invalid session during invalidation', () => {
            const result = sessionUtils_1.SessionManager.invalidateSession('invalid-token');
            expect(result).toBe(false);
        });
    });
});
