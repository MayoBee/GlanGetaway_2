/**
 * Authentication Refresh Routes
 * Handles token refresh and session renewal
 */

import express, { Request, Response } from 'express';
import { SessionManager } from '../utils/sessionUtils';

const router = express.Router();

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const refreshData = SessionManager.verifyRefreshToken(refreshToken);
    
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
      email: '', // Would come from database
      role: 'user' // Would come from database
    };

    // Create new access token
    const newAccessToken = SessionManager.refreshAccessToken(refreshToken, userSession);
    
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
      expiresIn: SessionManager.getConfig().accessTokenExpiry,
      sessionId: refreshData.sessionId
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session and clear tokens
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = SessionManager.extractToken(req);
    
    if (token) {
      // Invalidate the session
      SessionManager.invalidateSession(token);
    }

    // Clear cookies
    res.clearCookie('session_id');
    
    res.json({
      message: 'Logged out successfully',
      code: 'LOGOUT_SUCCESS'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/auth/session-info
 * Get current session information
 */
router.get('/session-info', async (req: Request, res: Response) => {
  try {
    const token = SessionManager.extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        message: 'No session found',
        code: 'NO_SESSION'
      });
    }

    const sessionData = SessionManager.verifyAccessToken(token);
    
    if (!sessionData) {
      return res.status(401).json({
        message: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }

    const timeUntilExpiry = sessionData.expiresAt - Math.floor(Date.now() / 1000);
    const isExpired = SessionManager.isSessionExpired(sessionData.issuedAt);

    res.json({
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      issuedAt: new Date(sessionData.issuedAt * 1000).toISOString(),
      expiresAt: new Date(sessionData.expiresAt * 1000).toISOString(),
      timeUntilExpiry,
      isExpired,
      sessionConfig: SessionManager.getConfig()
    });

  } catch (error) {
    console.error('Session info error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
