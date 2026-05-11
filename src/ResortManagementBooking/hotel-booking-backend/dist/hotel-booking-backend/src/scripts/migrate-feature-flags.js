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
const mongoose_1 = __importDefault(require("mongoose"));
const feature_flag_1 = require("../models/feature-flag");
require("dotenv/config");
const defaultFlags = [
    {
        name: "New Booking Flow",
        key: "new-booking-flow",
        description: "Enable the redesigned booking checkout flow",
        enabled: true,
        rolloutPercentage: 100,
    },
    {
        name: "Dynamic Pricing",
        key: "dynamic-pricing",
        description: "Enable AI powered dynamic room pricing",
        enabled: false,
        rolloutPercentage: 0,
    },
    {
        name: "Online Checkin",
        key: "online-checkin",
        description: "Allow guests to checkin online before arrival",
        enabled: true,
        rolloutPercentage: 50,
    },
    {
        name: "Mobile Key",
        key: "mobile-key",
        description: "Enable digital mobile room keys",
        enabled: false,
        rolloutPercentage: 0,
    },
    {
        name: "Loyalty Program",
        key: "loyalty-program",
        description: "Enable guest loyalty points and rewards",
        enabled: true,
        rolloutPercentage: 100,
    },
];
const migrateFeatureFlags = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("✅ Connected to database");
        for (const flagData of defaultFlags) {
            const existing = yield feature_flag_1.FeatureFlag.findOne({ key: flagData.key });
            if (!existing) {
                yield feature_flag_1.FeatureFlag.create(flagData);
                console.log(`✅ Created flag: ${flagData.key}`);
            }
            else {
                console.log(`ℹ️ Flag already exists: ${flagData.key}`);
            }
        }
        console.log("\n✅ Feature flag migration completed");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
});
migrateFeatureFlags();
