import express, { Request, Response } from "express";
import User from "../models/user";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Debug route to check current user role
router.get("/current-user", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        userId: req.userId 
      });
    }

    res.json({
      message: "Current user info",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      permissions: {
        isAdmin: user.role === "admin",
        isResortOwner: user.role === "resort_owner",
        isUser: user.role === "user"
      }
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test route without admin requirement
router.get("/test-public", (req: Request, res: Response) => {
  res.json({ message: "Public route works" });
});

// Test route with token verification only
router.get("/test-auth", verifyToken, (req: Request, res: Response) => {
  res.json({ 
    message: "Authenticated route works",
    userId: req.userId 
  });
});

export default router;
