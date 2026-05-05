"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("../models/user"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Quick fix: Promote current user to admin (TEMPORARY - FOR DEBUGGING ONLY)
router.put("/promote-me-to-admin", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const oldRole = user.role || "user";
        user.role = "admin";
        yield user.save();
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
    }
    catch (error) {
        console.error("Error in quick fix:", error);
        res.status(500).json({ message: "Failed to apply quick fix" });
    }
}));
exports.default = router;
