import express from "express";
import FeatureFlagService from "../services/feature-flags";
import { requireFeatureFlag } from "../middleware/feature-flag";
import { verifyToken } from "../middleware/role-based-auth";

const router = express.Router();

// Get all flags for current user
router.get("/", async (req, res) => {
  const context = {
    userId: (req as any).user?._id?.toString(),
    userRole: (req as any).user?.role,
    userEmail: (req as any).user?.email,
    environment: process.env.NODE_ENV,
  };

  const flags = await FeatureFlagService.getAllFlags(context);
  res.json({ success: true, data: flags });
});

// Admin: Get all flag definitions
router.get("/admin", verifyToken, async (req, res) => {
  const flags = await FeatureFlagService["getAllFlags"]();
  res.json({ success: true, data: flags });
});

// Admin: Create new feature flag
router.post("/admin", verifyToken, async (req, res) => {
  try {
    const flag = await FeatureFlagService.createFlag(req.body);
    res.status(201).json({ success: true, data: flag });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Update feature flag
router.put("/admin/:key", verifyToken, async (req, res) => {
  try {
    const flag = await FeatureFlagService.updateFlag(req.params.key, req.body);
    if (!flag) {
      return res.status(404).json({ success: false, message: "Flag not found" });
    }
    res.json({ success: true, data: flag });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Delete feature flag
router.delete("/admin/:key", verifyToken, async (req, res) => {
  await FeatureFlagService.deleteFlag(req.params.key);
  res.json({ success: true, message: "Flag deleted" });
});

// Admin: Clear cache
router.post("/admin/clear-cache", verifyToken, async (req, res) => {
  FeatureFlagService.clearCache();
  res.json({ success: true, message: "Cache cleared" });
});

export default router;
