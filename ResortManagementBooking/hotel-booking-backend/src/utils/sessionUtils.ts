/**
 * Session Management Utilities
 * Provides secure session handling with proper timeout and refresh mechanisms
 */

import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  refreshToken?: string;
}

export interface SessionConfig {
  accessTokenExpiry: string; // e.g., '15m'
  refreshTokenExpiry: string; // e.g., '7d'
  maxSessionAge: string; // e.g., '30d'
  idleTimeout: string; // e.g., '2h'
}

export class SessionManager {
  private static readonly DEFAULT_CONFIG: SessionConfig = {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    maxSessionAge: '30d',
    idleTimeout: '2h'
  };

  private static readonly config: SessionConfig = {
    ...SessionManager.DEFAULT_CONFIG,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    maxSessionAge: process.env.MAX_SESSION_AGE || '30d',
    idleTimeout: process.env.IDLE_TIMEOUT || '2h'
  };

  /**
   * Generate a secure session ID
   */
  private static generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const userId = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}-${userId}`;
  }

  /**
   * Create access token with session information
   */
  static createAccessToken(userId: string, email: string, role: string): string {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);
    
    const payload: SessionPayload = {
      userId,
      email,
      role,
      sessionId,
      issuedAt: now,
      expiresAt: now + this.parseDuration(this.config.accessTokenExpiry)
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY as string,
      { 
        expiresIn: this.config.accessTokenExpiry,
        issuer: 'hotel-booking-system',
        audience: 'hotel-booking-client'
      }
    );
  }

  /**
   * Create refresh token for session renewal
   */
  static createRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      type: 'refresh',
      issuedAt: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY as string,
      { 
        expiresIn: this.config.refreshTokenExpiry,
        issuer: 'hotel-booking-system',
        audience: 'hotel-booking-client'
      }
    );
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): SessionPayload | null {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET_KEY as string,
        {
          issuer: 'hotel-booking-system',
          audience: 'hotel-booking-client'
        }
      ) as SessionPayload;

      // Check if token is expired
      if (Date.now() / 1000 > decoded.expiresAt) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY as string,
        {
          issuer: 'hotel-booking-system',
          audience: 'hotel-booking-client'
        }
      ) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return {
        userId: decoded.userId,
        sessionId: decoded.sessionId
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string, userSession: { userId: string; email: string; role: string }): string | null {
    const refreshData = this.verifyRefreshToken(refreshToken);
    
    if (!refreshData) {
      return null;
    }

    // Create new access token with same session ID
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      userId: userSession.userId,
      email: userSession.email,
      role: userSession.role,
      sessionId: refreshData.sessionId,
      issuedAt: now,
      expiresAt: now + this.parseDuration(this.config.accessTokenExpiry)
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY as string,
      { 
        expiresIn: this.config.accessTokenExpiry,
        issuer: 'hotel-booking-system',
        audience: 'hotel-booking-client'
      }
    );
  }

  /**
   * Check if session has exceeded maximum age
   */
  static isSessionExpired(issuedAt: number): boolean {
    const maxAge = this.parseDuration(this.config.maxSessionAge);
    return (Date.now() / 1000 - issuedAt) > maxAge;
  }

  /**
   * Check if session has been idle for too long
   */
  static isSessionIdle(lastActivity: number): boolean {
    const idleTimeout = this.parseDuration(this.config.idleTimeout);
    return (Date.now() / 1000 - lastActivity) > idleTimeout;
  }

  /**
   * Parse duration string to seconds
   */
  private static parseDuration(duration: string): number {
    const units: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'M': 2592000, // 30 days
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
  static getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Extract token from request headers/cookies
   */
  static extractToken(req: any): string | null {
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
  static getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    path: string;
  } {
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
  static invalidateSession(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded) return false;

      // Create a token that's immediately expired
      const invalidToken = jwt.sign(
        { ...decoded, expiresAt: 0 },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '0s' }
      );

      return !!invalidToken;
    } catch {
      return false;
    }
  }
}
