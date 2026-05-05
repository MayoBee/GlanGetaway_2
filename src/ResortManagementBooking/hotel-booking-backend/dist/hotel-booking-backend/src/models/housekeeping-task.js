"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
// Backwards compatibility - re-export from domain structure
var housekeeping_task_1 = require("../domains/admin/models/housekeeping-task");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(housekeeping_task_1).default; } });
