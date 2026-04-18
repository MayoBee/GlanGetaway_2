import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../domains/identity/models/user";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      user?: any;
    }
  }
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  // Check for token in Authorization header first (for axios interceptor)
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to session cookie
    token = req.cookies["session_id"];
  }

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload & { userId: string; email?: string; role?: string };
    req.userId = decoded.userId;

    if (decoded.role && decoded.email) {
      // New token with embedded claims - no database query
      req.user = {
        _id: decoded.userId,
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isActive: true
      };
    } else {
      // Legacy token fallback - database lookup
      const user = await User.findById(decoded.userId).select('email role isActive');
      req.user = user;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "unauthorized" });
  }
};

export default verifyToken;
