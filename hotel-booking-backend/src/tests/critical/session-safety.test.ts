/**
 * Session Safety Tests
 * Tests session management, token refresh, and security
 */

import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAndConfigureApp } from '../../bootstrap';
import User from '../../domains/identity/models/user';
import { SessionManager } from '../../utils/sessionUtils';

describe('Session Safety', () => {
  let app: any;
  let testUser: any;
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Increase timeout for test setup
    jest.setTimeout(30000);
    app = createAndConfigureApp();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    testUser = new User({
      email: `session-test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Session',
      lastName: 'Test',
      role: 'user'
    });
    await testUser.save();
    
    // Create access token
    authToken = SessionManager.createAccessToken(
      testUser._id.toString(),
      testUser.email,
      testUser.role
    );
    
    // Create refresh token
    refreshToken = SessionManager.createRefreshToken(
      testUser._id.toString(),
      'test-session-id'
    );
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testUser) {
        await User.deleteMany({ _id: testUser._id });
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  describe('Token Creation and Verification', () => {
    it('should create valid access token', () => {
      const token = SessionManager.createAccessToken(
        testUser._id.toString(),
        testUser.email,
        testUser.role
      );
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const verified = SessionManager.verifyAccessToken(token);
      expect(verified).not.toBeNull();
      expect(verified!.userId).toBe(testUser._id.toString());
      expect(verified!.email).toBe(testUser.email);
      expect(verified!.role).toBe(testUser.role);
      expect(verified!.sessionId).toBeDefined();
    });

    it('should create valid refresh token', () => {
      const token = SessionManager.createRefreshToken(
        testUser._id.toString(),
        'test-session-id'
      );
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const verified = SessionManager.verifyRefreshToken(token);
      expect(verified).not.toBeNull();
      expect(verified!.userId).toBe(testUser._id.toString());
      expect(verified!.sessionId).toBe('test-session-id');
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      const accessVerified = SessionManager.verifyAccessToken(invalidToken);
      expect(accessVerified).toBeNull();
      
      const refreshVerified = SessionManager.verifyRefreshToken(invalidToken);
      expect(refreshVerified).toBeNull();
    });

    it('should reject expired tokens', async () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const verified = SessionManager.verifyAccessToken(expiredToken);
      expect(verified).toBeNull();
    });
  });

  describe('Session Age Limits', () => {
    it('should detect expired sessions', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - (31 * 24 * 60 * 60); // 31 days ago
      
      expect(SessionManager.isSessionExpired(oldTimestamp)).toBe(true);
    });

    it('should allow valid sessions', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - (24 * 60 * 60); // 1 day ago
      
      expect(SessionManager.isSessionExpired(recentTimestamp)).toBe(false);
    });

    it('should detect idle sessions', () => {
      const oldActivity = Math.floor(Date.now() / 1000) - (3 * 60 * 60); // 3 hours ago
      
      expect(SessionManager.isSessionIdle(oldActivity)).toBe(true);
    });

    it('should allow active sessions', () => {
      const recentActivity = Math.floor(Date.now() / 1000) - (30 * 60); // 30 minutes ago
      
      expect(SessionManager.isSessionIdle(recentActivity)).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', () => {
      const userSession = {
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role
      };
      
      const newToken = SessionManager.refreshAccessToken(refreshToken, userSession);
      
      expect(newToken).not.toBeNull();
      expect(typeof newToken).toBe('string');
      
      const verified = SessionManager.verifyAccessToken(newToken);
      expect(verified).not.toBeNull();
      expect(verified!.userId).toBe(testUser._id.toString());
    });

    it('should reject refresh with invalid token', () => {
      const userSession = {
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role
      };
      
      const newToken = SessionManager.refreshAccessToken('invalid-token', userSession);
      expect(newToken).toBeNull();
    });
  });

  describe('Session API Endpoints', () => {
    it('should get session info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/session-info')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.userId).toBe(testUser._id.toString());
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.role).toBe(testUser.role);
      expect(response.body.timeUntilExpiry).toBeDefined();
      expect(response.body.isExpired).toBe(false);
    });

    it('should reject session info with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/session-info')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_SESSION');
    });

    it('should handle token refresh endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.tokenType).toBe('Bearer');
      expect(response.body.expiresIn).toBeDefined();
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_REFRESH_TOKEN');
    });

    it('should handle logout endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('logged out');
    });

    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('logged out');
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', () => {
      const req = {
        headers: {
          authorization: 'Bearer test-token-here'
        }
      };
      
      const token = SessionManager.extractToken(req);
      expect(token).toBe('test-token-here');
    });

    it('should extract token from cookies', () => {
      const req = {
        headers: {},
        cookies: {
          session_id: 'cookie-token-here'
        }
      };
      
      const token = SessionManager.extractToken(req);
      expect(token).toBe('cookie-token-here');
    });

    it('should return null when no token found', () => {
      const req = {
        headers: {},
        cookies: {}
      };
      
      const token = SessionManager.extractToken(req);
      expect(token).toBeNull();
    });
  });

  describe('Cookie Options', () => {
    it('should generate secure cookie options', () => {
      const options = SessionManager.getCookieOptions();
      
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(process.env.NODE_ENV === 'production');
      expect(options.sameSite).toBe('strict');
      expect(options.maxAge).toBeGreaterThan(0);
      expect(options.path).toBe('/');
    });
  });

  describe('Session Configuration', () => {
    it('should return session configuration', () => {
      const config = SessionManager.getConfig();
      
      expect(config.accessTokenExpiry).toBeDefined();
      expect(config.refreshTokenExpiry).toBeDefined();
      expect(config.maxSessionAge).toBeDefined();
      expect(config.idleTimeout).toBeDefined();
    });
  });

  describe('Session Invalidation', () => {
    it('should invalidate session successfully', () => {
      const result = SessionManager.invalidateSession(authToken);
      expect(result).toBe(true);
    });

    it('should handle invalid session during invalidation', () => {
      const result = SessionManager.invalidateSession('invalid-token');
      expect(result).toBe(false);
    });
  });
});
