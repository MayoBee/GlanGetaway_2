import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  type: [{ type: String, required: true }],
  starRating: { type: Number, required: true, min: 1, max: 5 },
  facilities: [{ type: String, required: true }],
  imageUrls: [{ type: String, required: true }],
  userId: { type: String, required: true },
  dayRate: { type: Number },
  nightRate: { type: Number, required: true },
  hasDayRate: { type: Boolean, default: true },
  hasNightRate: { type: Boolean, default: true },
  pricePerNight: { type: Number },
  amenities: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model("Hotel", hotelSchema);
