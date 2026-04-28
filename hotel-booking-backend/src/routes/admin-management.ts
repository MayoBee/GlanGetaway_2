import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/role-based-auth";
import User from "../models/user";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import RolePromotionRequest from "../models/role-promotion-request";
import { check, validationResult } from "express-validator";

const router = express.Router();

/**
 * @swagger
 * /api/admin-management/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve all users with their roles and details
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/users", verifyToken, async (req: Request, res: Response) => {
  try {
    const users = await User.find({})
      .select("firstName lastName email role createdAt isActive")
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/**
 * @swagger
 * /api/admin-management/promote-to-admin/{userId}:
 *   put:
 *     summary: Promote user to resort owner (Admin only)
 *     description: Promote a regular user to resort owner role
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User promoted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.put("/promote-to-admin/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID")
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid user ID", errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot modify Admin role" });
    }

    const oldRole = user.role || "user";
    user.set("role", "resort_owner");
    await user.save();

    console.log(`👤 User promoted to resort owner: ${user.email} (${oldRole} -> resort_owner) by Admin`);

    res.json({
      message: "User promoted to resort owner successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        oldRole,
        newRole: "resort_owner"
      }
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ message: "Failed to promote user" });
  }
});

/**
 * @swagger
 * /api/admin-management/demote-to-user/{userId}:
 *   put:
 *     summary: Demote resort owner to user (Admin only)
 *     description: Demote a resort owner back to regular user role
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User demoted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.put("/demote-to-user/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID")
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid user ID", errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot modify Admin role" });
    }

    const oldRole = user.role || "resort_owner";
    user.set("role", "user");
    await user.save();

    console.log(`👤 User demoted to user: ${user.email} (${oldRole} -> user) by Admin`);

    res.json({
      message: "User demoted to user successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        oldRole,
        newRole: "user"
      }
    });
  } catch (error) {
    console.error("Error demoting user:", error);
    res.status(500).json({ message: "Failed to demote user" });
  }
});

/**
 * @swagger
 * /api/admin-management/search-users:
 *   get:
 *     summary: Search users by email or name (Admin only)
 *     description: Search for users to promote/demote
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Search query for email or name
 *     responses:
 *       200:
 *         description: Users found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/search-users", verifyToken, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ]
    })
    .select("firstName lastName email role createdAt isActive")
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});

/**
 * @swagger
 * /api/admin-management/verify-pwd/{userId}:
 *   put:
 *     summary: Verify user's PWD ID (Super Admin only)
 *     description: Verify a user's PWD ID for discount eligibility
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PWD ID verified successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.put("/verify-pwd/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID"),
  check("verified").isBoolean().withMessage("Verification status is required"),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request", errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    const { verified, rejectionReason } = req.body;
    const adminId = req.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isPWD) {
      return res.status(400).json({ message: "User is not registered as PWD" });
    }

    if (!user.pwdId) {
      return res.status(400).json({ message: "User has no PWD ID on file" });
    }

    user.pwdIdVerified = verified;
    user.pwdVerifiedBy = adminId;
    user.pwdVerifiedAt = new Date();
    
    // Also verify the account if PWD is verified
    if (verified) {
      user.accountVerified = true;
      user.accountVerifiedBy = adminId;
      user.accountVerifiedAt = new Date();
    }
    
    await user.save();

    console.log(`👤 PWD ID ${verified ? 'verified' : 'rejected'} for user: ${user.email} by Super Admin`);

    res.json({
      message: verified 
        ? "PWD ID verified successfully" 
        : "PWD ID verification rejected",
      rejectionReason: verified ? undefined : rejectionReason,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isPWD: user.isPWD,
        pwdIdVerified: user.pwdIdVerified,
        accountVerified: user.accountVerified
      }
    });
  } catch (error) {
    console.error("Error verifying PWD ID:", error);
    res.status(500).json({ message: "Failed to verify PWD ID" });
  }
});

/**
 * @swagger
 * /api/admin-management/verify-account/{userId}:
 *   put:
 *     summary: Verify user's account (Super Admin only)
 *     description: Verify a user's account for full access
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.put("/verify-account/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID"),
  check("verified").isBoolean().withMessage("Verification status is required"),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request", errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    const { verified, rejectionReason } = req.body;
    const adminId = req.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.accountVerified = verified;
    user.accountVerifiedBy = verified ? adminId : undefined;
    user.accountVerifiedAt = verified ? new Date() : undefined;
    
    await user.save();

    console.log(`👤 Account ${verified ? 'verified' : 'unverified'} for user: ${user.email} by Super Admin`);

    res.json({
      message: verified 
        ? "Account verified successfully" 
        : "Account verification removed",
      rejectionReason: verified ? undefined : rejectionReason,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountVerified: user.accountVerified
      }
    });
  } catch (error) {
    console.error("Error verifying account:", error);
    res.status(500).json({ message: "Failed to verify account" });
  }
});

/**
 * @swagger
 * /api/admin-management/users-pending-verification:
 *   get:
 *     summary: Get users pending verification (Super Admin only)
 *     description: Get all users that need PWD or account verification
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.get("/users-pending-verification", verifyToken, async (req: Request, res: Response) => {
  try {
    // Get users who are PWD but not verified, or accounts pending verification
    const users = await User.find({
      $or: [
        { isPWD: true, pwdIdVerified: false },
        { accountVerified: false }
      ]
    })
    .select("firstName lastName email role birthdate isPWD pwdId pwdIdVerified accountVerified createdAt")
    .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users pending verification:", error);
    res.status(500).json({ message: "Failed to fetch users pending verification" });
  }
});

/**
 * @swagger
 * /api/admin-management/user-details/{userId}:
 *   get:
 *     summary: Get detailed user information (Super Admin only)
 *     description: Get full user details including verification status
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.get("/user-details/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID")
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid user ID", errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select("-password")
      .populate("pwdVerifiedBy", "firstName lastName email")
      .populate("accountVerifiedBy", "firstName lastName email");
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

/**
 * @swagger
 * /api/admin-management/users/{userId}:
 *   delete:
 *     summary: Delete user account with cascade (Admin only)
 *     description: Permanently delete a user account and all associated data (bookings, hotels, promotion requests)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User and associated data deleted successfully
 *       400:
 *         description: Invalid user ID or cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.delete("/users/:userId", verifyToken, [
  check("userId").isMongoId().withMessage("Invalid user ID")
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid user ID", errors: errors.array() });
  }

  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Cascade delete associated data
    const [bookingDeleteResult, hotelDeleteResult, promotionRequestDeleteResult] = await Promise.all([
      Booking.deleteMany({ userId }),
      Hotel.deleteMany({ userId }),
      RolePromotionRequest.deleteMany({ userId })
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log(`🗑️ User deleted with cascade: ${user.email} by admin ${req.userId}`);
    console.log(`Deleted: ${bookingDeleteResult.deletedCount} bookings, ${hotelDeleteResult.deletedCount} hotels, ${promotionRequestDeleteResult.deletedCount} promotion requests`);

    res.json({
      message: "User and associated data deleted successfully",
      deletedData: {
        bookings: bookingDeleteResult.deletedCount,
        hotels: hotelDeleteResult.deletedCount,
        promotionRequests: promotionRequestDeleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error("Error deleting user with cascade:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/**
 * @swagger
 * /api/admin-management/delete-user/{userId}:
 *   delete:
 *     summary: Delete user account (Admin only)
 *     description: Permanently delete a user account
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.delete("/delete-user/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(userId);
    
    console.log(`🗑️ User deleted: ${user.email} by admin ${req.userId}`);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/**
 * @swagger
 * /api/admin-management/toggle-user-status/{userId}:
 *   put:
 *     summary: Toggle user active status (Admin only)
 *     description: Enable or disable a user account
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to toggle
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.put("/toggle-user-status/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }

    user.isActive = !user.isActive;
    await user.save();
    
    console.log(`${user.isActive ? '✅' : '🔒'} User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email} by admin ${req.userId}`);
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to toggle user status" });
  }
});

/**
 * @swagger
 * /api/admin-management/hotels:
 *   get:
 *     summary: Get all hotels including unapproved ones (Admin only)
 *     description: Retrieve all hotels for admin review, including unapproved hotels
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotels retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/hotels", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({})
      .populate("userId", "firstName lastName email")
      .sort({ lastUpdated: -1 });

    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Failed to fetch hotels" });
  }
});

export default router;
