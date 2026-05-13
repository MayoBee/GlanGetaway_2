import express, { Request, Response } from "express";
import User from "../models/user";
import Hotel from "../models/hotel";
import { verifyToken, requireRole } from "../middleware/role-based-auth";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Get all staff for current owner's resorts
router.get("/", verifyToken, requireRole(["resort_owner"]), async (req: Request, res: Response) => {
  try {
    const ownerUserId = req.userId;
    
    // Get all resorts owned by this owner
    const ownerResorts = await Hotel.find({ userId: ownerUserId }).select("_id name staff");
    
    // Collect all staff from all resorts
    const staffMap = new Map();
    
    for (const resort of ownerResorts) {
      if (resort.staff && Array.isArray(resort.staff)) {
        for (const staffMember of resort.staff) {
          if (staffMember.isActive) {
            const staffId = staffMember.staffUserId;
            if (!staffMap.has(staffId)) {
              staffMap.set(staffId, {
                _id: staffId,
                firstName: staffMember.firstName,
                lastName: staffMember.lastName,
                email: staffMember.email,
                role: staffMember.role,
                isActive: staffMember.isActive,
                mustChangePassword: staffMember.mustChangePassword,
                permissions: staffMember.permissions,
                assignedResorts: [],
              });
            }
            staffMap.get(staffId).assignedResorts.push({
              resortId: resort._id.toString(),
              resortName: resort.name,
              role: staffMember.role,
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: Array.from(staffMap.values()),
    });
  } catch (error) {
    console.error("Error fetching resort staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create a new front desk staff member (resort owner only)
router.post(
  "/",
  verifyToken,
  requireRole(["resort_owner"]),
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({ min: 6 }),
    check("firstName", "First name is required").isString(),
    check("lastName", "Last name is required").isString(),
    check("role", "Role is required").isIn(["front_desk", "housekeeping"]),
    check("resortIds", "At least one resort must be assigned").isArray({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      const { email, password, firstName, lastName, role, resortIds, permissions } = req.body;
      const ownerUserId = req.userId;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User with this email already exists" });
      }

      // Validate that all resortIds belong to the current owner
      const ownerResorts = await Hotel.find({ userId: ownerUserId }).select("_id");
      const ownerResortIds = ownerResorts.map(r => r._id.toString());
      const invalidIds = resortIds.filter((id: string) => !ownerResortIds.includes(id));
      
      if (invalidIds.length > 0) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only assign staff to your own resorts",
          invalidIds 
        });
      }

      // Create staff user with hashed password
      const user = new User({
        email,
        password, // Will be hashed by pre-save hook
        firstName,
        lastName,
        role,
        mustChangePassword: true, // Force password change on first login
        permissions: permissions || {
          canManageBookings: role === "front_desk",
          canManageRooms: role === "front_desk",
          canManagePricing: false,
          canManageAmenities: false,
          canManageActivities: role === "front_desk",
          canViewReports: role === "front_desk",
          canManageBilling: role === "front_desk",
          canManageHousekeeping: role === "housekeeping",
          canManageMaintenance: false,
          canManageUsers: false,
        },
      });

      await user.save();

      // Add staff to each resort's staff array
      const staffEntry = {
        staffUserId: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: true,
        mustChangePassword: user.mustChangePassword,
        assignedAt: new Date(),
      };

      await Hotel.updateMany(
        { _id: { $in: resortIds } },
        { $push: { staff: staffEntry } }
      );

      res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (error) {
      console.error("Error creating resort staff:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// Update staff member (resort owner only)
router.put("/:staffId", verifyToken, requireRole(["resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { firstName, lastName, phone, permissions, isActive, resortIds } = req.body;
    const ownerUserId = req.userId;

    // Update user fields
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (permissions) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Update resort assignments if provided
    if (resortIds && Array.isArray(resortIds)) {
      // Validate resort ownership
      const ownerResorts = await Hotel.find({ userId: ownerUserId }).select("_id");
      const ownerResortIds = ownerResorts.map(r => r._id.toString());
      const invalidIds = resortIds.filter((id: string) => !ownerResortIds.includes(id));
      
      if (invalidIds.length > 0) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only assign staff to your own resorts",
          invalidIds 
        });
      }

      // Remove staff from all owner's resorts first
      await Hotel.updateMany(
        { userId: ownerUserId },
        { $pull: { staff: { staffUserId: staffId } } }
      );

      // Add staff to new resorts
      const staffEntry = {
        staffUserId: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        assignedAt: new Date(),
      };

      await Hotel.updateMany(
        { _id: { $in: resortIds } },
        { $push: { staff: staffEntry } }
      );
    }

    res.json({
      success: true,
      message: "Staff member updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating resort staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Deactivate staff member (resort owner only)
router.delete("/:staffId", verifyToken, requireRole(["resort_owner"]), async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const ownerUserId = req.userId;

    // Remove staff from all owner's resorts
    const result = await Hotel.updateMany(
      { userId: ownerUserId },
      { $pull: { staff: { staffUserId: staffId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Staff member not found or not assigned to your resorts" });
    }

    // Deactivate user
    const user = await User.findById(staffId);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    res.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating resort staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get resorts assigned to current front desk user
router.get("/assigned-resorts", verifyToken, requireRole(["front_desk", "housekeeping"]), async (req: Request, res: Response) => {
  try {
    const staffUserId = req.userId;
    
    // Find all hotels where this staff user is assigned and active
    const hotels = await Hotel.find({
      "staff.staffUserId": staffUserId,
      "staff.isActive": true,
    });

    res.json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    console.error("Error fetching assigned resorts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
