"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransaction = void 0;
// Backwards compatibility - re-export from domain structure
var payment_1 = require("../domains/billing/models/payment");
Object.defineProperty(exports, "PaymentTransaction", { enumerable: true, get: function () { return __importDefault(payment_1).default; } });
