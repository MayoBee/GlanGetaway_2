import express, { Request, Response } from "express";
import User from "../models/user";
import { verifyToken, requireAdmin } from "../middleware/role-based-auth";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";

const router = express.Router();

// Get all staff members (admin only)
router.get("/staff", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { hotelId, department, role, page = 1, limit = 20 } = req.query;
    
    const filter: any = {
      role: { $in: ["front_desk", "housekeeping", "resort_owner", "admin"] }
    };
    
    if (department) {
      filter["staffProfile.department"] = department;
    }
    if (role) {
      filter.role = role;
    }

    const staff = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create a new staff member (admin only)
router.post(
  "/staff",
  verifyToken,
  requireAdmin,
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({ min: 6 }),
    check("firstName", "First name is required").isString(),
    check("lastName", "Last name is required").isString(),
    check("role", "Role is required").isIn(["front_desk", "housekeeping", "admin"]),
    check("department", "Department is required").isIn(["front_desk", "housekeeping", "maintenance", "food_beverage", "activities"]),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      const { email, password, firstName, lastName, role, department, phone, staffProfile } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User with this email already exists" });
      }

      // Create staff user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        staffProfile: {
          department,
          employeeId: staffProfile?.employeeId,
          hireDate: staffProfile?.hireDate || new Date(),
          shiftSchedule: staffProfile?.shiftSchedule,
          hourlyRate: staffProfile?.hourlyRate,
          isActive: true,
        },
        permissions: {
          canManageBookings: role === "front_desk" || role === "resort_owner",
          canManageRooms: role === "front_desk" || role === "resort_owner",
          canManagePricing: role === "resort_owner",
          canManageAmenities: role === "resort_owner",
          canManageActivities: role === "resort_owner" || role === "front_desk",
          canViewReports: role === "resort_owner" || role === "front_desk",
          canManageBilling: role === "front_desk" || role === "resort_owner",
          canManageHousekeeping: role === "housekeeping" || role === "resort_owner",
          canManageMaintenance: role === "resort_owner",
          canManageUsers: role === "resort_owner",
        },
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          staffProfile: user.staffProfile,
        },
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// Update staff member (admin only)
router.put("/staff/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, department, staffProfile, permissions, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (department && user.staffProfile) {
      user.staffProfile.department = department;
    }
    if (staffProfile) {
      if (user.staffProfile) {
        if (staffProfile.employeeId) user.staffProfile.employeeId = staffProfile.employeeId;
        if (staffProfile.shiftSchedule) user.staffProfile.shiftSchedule = staffProfile.shiftSchedule;
        if (staffProfile.hourlyRate) user.staffProfile.hourlyRate = staffProfile.hourlyRate;
        if (staffProfile.isActive !== undefined) user.staffProfile.isActive = staffProfile.isActive;
      }
    }
    if (permissions) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: "Staff member updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Deactivate staff member (admin only)
router.delete("/staff/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    user.isActive = false;
    if (user.staffProfile) {
      user.staffProfile.isActive = false;
    }
    await user.save();

    res.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get staff by ID
router.get("/staff/:id", verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
