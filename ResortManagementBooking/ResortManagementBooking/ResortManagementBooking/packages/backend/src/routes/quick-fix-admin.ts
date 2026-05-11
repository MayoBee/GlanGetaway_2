import express, { Request, Response } from "express";
import User from "../models/user";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Quick fix: Promote current user to admin (TEMPORARY - FOR DEBUGGING ONLY)
router.put("/promote-me-to-admin", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = user.role || "user";
    user.role = "admin";
    await user.save();

    console.log(`🚨 QUICK FIX: User promoted to admin: ${user.email} (${oldRole} -> admin)`);

    res.json({
      message: "Quick fix applied - You are now an admin!",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        oldRole,
        newRole: "admin"
      },
      warning: "This is a temporary debug route. Remove it in production!"
    });
  } catch (error) {
    console.error("Error in quick fix:", error);
    res.status(500).json({ message: "Failed to apply quick fix" });
  }
});

export default router;
