import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

export interface AuthRequest extends Request {
  userId: string;
  user?: any;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Access denied. User not authenticated." });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
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

      req.user = user;
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      return res.status(500).json({ message: "Server error during role verification." });
    }
  };
};

// Specific role checkers
export const requireSuperAdmin = requireRole(["admin"]);
export const requireAdmin = requireRole(["admin"]);
export const requireStaff = requireRole(["admin", "resort_owner", "front_desk", "housekeeping"]);
export const requireUser = requireRole(["user", "admin", "resort_owner", "front_desk", "housekeeping"]);

// Check if user owns the resource or is admin/super admin
export const requireOwnershipOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Access denied. User not authenticated." });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
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
  } catch (error) {
    console.error("Ownership verification error:", error);
    return res.status(500).json({ message: "Server error during ownership verification." });
  }
};
