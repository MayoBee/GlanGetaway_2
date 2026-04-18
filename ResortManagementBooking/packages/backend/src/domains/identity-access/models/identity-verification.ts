import mongoose, { Document } from "mongoose";

export interface IIdentityVerification extends Document {
  _id: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  // Guest info from booking
  guestName: string;
  guestEmail: string;
  // ID document info
  idType: "passport" | "drivers_license" | "national_id" | "postal_id" | "other";
  idNumber: string;
  idImageUrl: string;
  idBackImageUrl?: string;
  // OCR extracted data
  ocrExtractedName?: string;
  ocrExtractedDOB?: string;
  ocrExtractedAddress?: string;
  ocrConfidenceScore?: number;
  ocrRawText?: string;
  // Verification results
  verificationStatus: "pending" | "verified" | "high_risk" | "failed" | "manual_review";
  nameMatchScore: number; // 0-100 percentage
  nameMatchResult: "match" | "partial_match" | "no_match";
  riskFlags: string[];
  // Admin review
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  // Fraud detection
  isFlaggedForFraud: boolean;
  fraudReason?: string;
  // Auto-confirmation
  autoConfirmed: boolean;
  confirmationSentAt?: Date;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const identityVerificationSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    hotelId: { type: String, required: true },
    guestId: { type: String, required: true },
    // Guest info from booking
    guestName: { type: String, required: true },
    guestEmail: { type: String },
    // ID document info
    idType: {
      type: String,
      enum: ["passport", "drivers_license", "national_id", "postal_id", "other"],
      required: true,
    },
    idNumber: { type: String, required: true },
    idImageUrl: { type: String, required: true },
    idBackImageUrl: { type: String },
    // OCR extracted data
    ocrExtractedName: { type: String },
    ocrExtractedDOB: { type: String },
    ocrExtractedAddress: { type: String },
    ocrConfidenceScore: { type: Number },
    ocrRawText: { type: String },
    // Verification results
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "high_risk", "failed", "manual_review"],
      default: "pending",
    },
    nameMatchScore: { type: Number, default: 0 },
    nameMatchResult: {
      type: String,
      enum: ["match", "partial_match", "no_match"],
      default: "no_match",
    },
    riskFlags: [{ type: String }],
    // Admin review
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
    // Fraud detection
    isFlaggedForFraud: { type: Boolean, default: false },
    fraudReason: { type: String },
    // Auto-confirmation
    autoConfirmed: { type: Boolean, default: false },
    confirmationSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
identityVerificationSchema.index({ bookingId: 1 }, { unique: true });
identityVerificationSchema.index({ hotelId: 1, verificationStatus: 1 });
identityVerificationSchema.index({ isFlaggedForFraud: 1 });

// Method to calculate name match score
identityVerificationSchema.methods.calculateNameMatch = function (
  bookingName: string,
  ocrName: string
): { score: number; result: "match" | "partial_match" | "no_match" } {
  const normalizeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const normalizedBooking = normalizeName(bookingName);
  const normalizedOCR = normalizeName(ocrName);

  if (normalizedBooking === normalizedOCR) {
    return { score: 100, result: "match" };
  }

  if (
    normalizedBooking.includes(normalizedOCR) ||
    normalizedOCR.includes(normalizedBooking)
  ) {
    return { score: 75, result: "partial_match" };
  }

  // Calculate Levenshtein distance for more nuanced matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;

    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / longer.length;
  };

  const similarity = calculateSimilarity(normalizedBooking, normalizedOCR);
  const score = Math.round(similarity * 100);

  if (score >= 60) {
    return { score, result: "partial_match" };
  }

  return { score, result: "no_match" };
};

export default mongoose.model<IIdentityVerification>(
  "IdentityVerification",
  identityVerificationSchema
);
