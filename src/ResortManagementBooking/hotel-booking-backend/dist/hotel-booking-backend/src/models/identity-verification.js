"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
// Backwards compatibility - re-export from domain structure
var identity_verification_1 = require("../domains/identity/models/identity-verification");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(identity_verification_1).default; } });
