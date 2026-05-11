"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
// Backwards compatibility - re-export from domain structure
var room_block_1 = require("../domains/booking/models/room-block");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(room_block_1).default; } });
