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
const feature_flags_1 = __importDefault(require("../services/feature-flags"));
const role_based_auth_1 = require("../middleware/role-based-auth");
const router = express_1.default.Router();
// Get all flags for current user
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const context = {
        userId: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
        userRole: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
        userEmail: (_d = req.user) === null || _d === void 0 ? void 0 : _d.email,
        environment: process.env.NODE_ENV,
    };
    const flags = yield feature_flags_1.default.getAllFlags(context);
    res.json({ success: true, data: flags });
}));
// Admin: Get all flag definitions
router.get("/admin", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const flags = yield feature_flags_1.default["getAllFlags"]();
    res.json({ success: true, data: flags });
}));
// Admin: Create new feature flag
router.post("/admin", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const flag = yield feature_flags_1.default.createFlag(req.body);
        res.status(201).json({ success: true, data: flag });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));
// Admin: Update feature flag
router.put("/admin/:key", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const flag = yield feature_flags_1.default.updateFlag(req.params.key, req.body);
        if (!flag) {
            return res.status(404).json({ success: false, message: "Flag not found" });
        }
        res.json({ success: true, data: flag });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));
// Admin: Delete feature flag
router.delete("/admin/:key", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield feature_flags_1.default.deleteFlag(req.params.key);
    res.json({ success: true, message: "Flag deleted" });
}));
// Admin: Clear cache
router.post("/admin/clear-cache", role_based_auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    feature_flags_1.default.clearCache();
    res.json({ success: true, message: "Cache cleared" });
}));
exports.default = router;
