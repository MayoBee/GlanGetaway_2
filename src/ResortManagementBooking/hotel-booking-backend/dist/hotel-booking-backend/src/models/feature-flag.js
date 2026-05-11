"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlag = void 0;
// Backwards compatibility - re-export from domain structure
var feature_flag_1 = require("../domains/admin/models/feature-flag");
Object.defineProperty(exports, "FeatureFlag", { enumerable: true, get: function () { return __importDefault(feature_flag_1).default; } });
