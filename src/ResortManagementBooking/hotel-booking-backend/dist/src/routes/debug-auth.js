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
// Debug route to check current user role
router.get("/current-user", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findById(req.userId).select("-password");
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
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
// Test route without admin requirement
router.get("/test-public", (req, res) => {
    res.json({ message: "Public route works" });
});
// Test route with token verification only
router.get("/test-auth", auth_1.default, (req, res) => {
    res.json({
        message: "Authenticated route works",
        userId: req.userId
    });
});
exports.default = router;
