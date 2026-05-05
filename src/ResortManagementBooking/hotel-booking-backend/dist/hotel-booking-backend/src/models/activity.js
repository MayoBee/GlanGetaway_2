"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
// Backwards compatibility - re-export from domain structure
var activity_1 = require("../domains/hotel/models/activity");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(activity_1).default; } });
