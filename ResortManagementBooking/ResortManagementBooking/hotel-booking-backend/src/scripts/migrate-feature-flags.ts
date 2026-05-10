import mongoose from "mongoose";
import { FeatureFlag } from "../models/feature-flag";
import "dotenv/config";

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

const migrateFeatureFlags = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);
    console.log("✅ Connected to database");

    for (const flagData of defaultFlags) {
      const existing = await FeatureFlag.findOne({ key: flagData.key });
      if (!existing) {
        await FeatureFlag.create(flagData);
        console.log(`✅ Created flag: ${flagData.key}`);
      } else {
        console.log(`ℹ️ Flag already exists: ${flagData.key}`);
      }
    }

    console.log("\n✅ Feature flag migration completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateFeatureFlags();
