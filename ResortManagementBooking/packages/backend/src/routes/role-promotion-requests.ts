import express from "express";

const router = express.Router();

// Placeholder routes for role promotion requests
router.get("/", (req, res) => {
  res.json({ message: "Role promotion requests endpoint" });
});

export default router;
