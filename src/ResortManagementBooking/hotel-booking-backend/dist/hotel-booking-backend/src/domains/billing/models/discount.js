"use strict";
/**
 * Discount System Database Schema
 *
 * This file defines the Mongoose schema for storing resort-specific discount rules
 * in MongoDB. The schema supports standard discounts (Senior Citizen, PWD) and
 * custom promo codes.
 *
 * Formula: Discount = (P/G) × N × D
 * Where:
 * - P = Number of discounted guests
 * - G = Total number of guests
 * - N = Number of nights
 * - D = Daily rate/price per person
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleDiscountConfig = exports.DiscountConfig = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ========================
// Sub-Schemas
// ========================
const CustomDiscountSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    promoCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        unique: true
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    maxUses: {
        type: Number,
        default: null,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    validFrom: {
        type: Date,
        default: null
    },
    validUntil: {
        type: Date,
        default: null
    },
    minBookingValue: {
        type: Number,
        default: 0,
        min: 0
    },
    applicableRoomTypes: [{
            type: String,
            trim: true
        }]
}, {
    timestamps: true
});
// ========================
// Main Schema
// ========================
const DiscountConfigSchema = new mongoose_1.Schema({
    hotelId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true,
        unique: true,
        index: true
    },
    seniorCitizen: {
        enabled: {
            type: Boolean,
            default: true
        },
        percentage: {
            type: Number,
            default: 20,
            min: 0,
            max: 100
        },
        requiredDocuments: [{
                type: String,
                trim: true
            }],
        description: {
            type: String,
            default: 'Senior Citizen Discount - Available for guests aged 60 and above'
        }
    },
    pwd: {
        enabled: {
            type: Boolean,
            default: true
        },
        percentage: {
            type: Number,
            default: 20,
            min: 0,
            max: 100
        },
        requiredDocuments: [{
                type: String,
                trim: true
            }],
        description: {
            type: String,
            default: 'PWD Discount - Available for guests with valid PWD ID'
        }
    },
    customDiscounts: [CustomDiscountSchema],
    allowStackDiscounts: {
        type: Boolean,
        default: false
    },
    maxDiscountPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});
// ========================
// Indexes
// ========================
DiscountConfigSchema.index({ hotelId: 1 });
DiscountConfigSchema.index({ 'customDiscounts.promoCode': 1 });
DiscountConfigSchema.index({ 'customDiscounts.isEnabled': 1 });
// ========================
// Instance Methods
// ========================
/**
 * Check if a promo code is valid and can be applied
 */
DiscountConfigSchema.methods.isPromoCodeValid = function (promoCode) {
    const promo = this.customDiscounts.find(d => d.promoCode.toUpperCase() === promoCode.toUpperCase());
    if (!promo) {
        return { isValid: false, error: 'Invalid promo code' };
    }
    if (!promo.isEnabled) {
        return { isValid: false, error: 'This promo code is no longer active' };
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return { isValid: false, error: 'This promo code has reached its maximum usage limit' };
    }
    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
        return { isValid: false, error: 'This promo code is not yet active' };
    }
    if (promo.validUntil && now > promo.validUntil) {
        return { isValid: false, error: 'This promo code has expired' };
    }
    return { isValid: true, discount: promo };
};
/**
 * Calculate the final price after applying discounts
 * Formula: Discount = (P/G) × N × D
 */
DiscountConfigSchema.methods.calculateDiscount = function (params) {
    const { basePrice, totalGuests, seniorCitizens, pwdGuests, numberOfNights, promoCode } = params;
    let originalPrice = basePrice;
    let totalSavings = 0;
    const discountBreakdown = [];
    // Apply Senior Citizen Discount
    if (this.seniorCitizen.enabled && seniorCitizens > 0) {
        const proportion = seniorCitizens / totalGuests;
        const discountAmount = basePrice * proportion * (this.seniorCitizen.percentage / 100);
        discountBreakdown.push({
            type: 'Senior Citizen',
            count: seniorCitizens,
            percentage: this.seniorCitizen.percentage,
            amount: discountAmount
        });
        totalSavings += discountAmount;
    }
    // Apply PWD Discount
    if (this.pwd.enabled && pwdGuests > 0) {
        const proportion = pwdGuests / totalGuests;
        const discountAmount = basePrice * proportion * (this.pwd.percentage / 100);
        discountBreakdown.push({
            type: 'PWD',
            count: pwdGuests,
            percentage: this.pwd.percentage,
            amount: discountAmount
        });
        totalSavings += discountAmount;
    }
    // Apply Promo Code Discount (to remaining total)
    if (promoCode) {
        const promoValidation = this.isPromoCodeValid(promoCode);
        if (promoValidation.isValid && promoValidation.discount) {
            const remainingAfterStandard = originalPrice - totalSavings;
            const promoDiscount = remainingAfterStandard * (promoValidation.discount.percentage / 100);
            discountBreakdown.push({
                type: promoValidation.discount.name,
                count: totalGuests,
                percentage: promoValidation.discount.percentage,
                amount: promoDiscount
            });
            totalSavings += promoDiscount;
        }
    }
    // Enforce maximum discount percentage
    const maxDiscountAmount = originalPrice * (this.maxDiscountPercentage / 100);
    if (totalSavings > maxDiscountAmount) {
        totalSavings = maxDiscountAmount;
    }
    return {
        originalPrice,
        totalSavings,
        finalPrice: Math.max(0, originalPrice - totalSavings),
        discountBreakdown
    };
};
/**
 * Increment usage count for a promo code
 */
DiscountConfigSchema.methods.usePromoCode = function (promoCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const promo = this.customDiscounts.find(d => d.promoCode.toUpperCase() === promoCode.toUpperCase());
        if (!promo)
            return false;
        promo.usedCount = (promo.usedCount || 0) + 1;
        yield this.save();
        return true;
    });
};
// ========================
// Static Methods
// ========================
/**
 * Find discount config by hotel ID
 */
DiscountConfigSchema.statics.findByHotelId = function (hotelId) {
    return this.findOne({ hotelId: new mongoose_1.default.Types.ObjectId(hotelId) });
};
/**
 * Find valid promo code across all hotels
 */
DiscountConfigSchema.statics.findPromoCode = function (promoCode) {
    return this.findOne({
        'customDiscounts': {
            $elemMatch: {
                promoCode: promoCode.toUpperCase(),
                isEnabled: true
            }
        }
    });
};
// ========================
// Export Model
// ========================
exports.DiscountConfig = mongoose_1.default.model('DiscountConfig', DiscountConfigSchema);
// ========================
// Sample JSON Data
// ========================
exports.sampleDiscountConfig = {
    hotelId: "507f1f77bcf86cd799439011",
    seniorCitizen: {
        enabled: true,
        percentage: 20,
        requiredDocuments: ["Senior Citizen ID", "Valid Government ID"],
        description: "20% discount for senior citizens aged 60 and above"
    },
    pwd: {
        enabled: true,
        percentage: 20,
        requiredDocuments: ["PWD ID", "Valid Government ID"],
        description: "20% discount for persons with disabilities"
    },
    customDiscounts: [
        {
            name: "Sports Club Member",
            percentage: 15,
            promoCode: "PROMO-SPORT25",
            isEnabled: true,
            maxUses: 100,
            usedCount: 23,
            validFrom: "2026-01-01",
            validUntil: "2026-12-31",
            minBookingValue: 5000,
            applicableRoomTypes: ["Deluxe Room", "Suite"],
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-03-01T00:00:00Z"
        },
        {
            name: "Government Employee",
            percentage: 10,
            promoCode: "PROMO-GOV10",
            isEnabled: true,
            maxUses: null,
            usedCount: 5,
            validFrom: "2026-01-01",
            validUntil: null,
            minBookingValue: 0,
            applicableRoomTypes: [],
            createdAt: "2026-01-15T00:00:00Z",
            updatedAt: "2026-01-15T00:00:00Z"
        },
        {
            name: "Early Bird Special",
            percentage: 25,
            promoCode: "PROMO-EARLY25",
            isEnabled: true,
            maxUses: 50,
            usedCount: 50,
            validFrom: "2026-01-01",
            validUntil: "2026-03-31",
            minBookingValue: 10000,
            applicableRoomTypes: [],
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-03-15T00:00:00Z"
        }
    ],
    allowStackDiscounts: false,
    maxDiscountPercentage: 50,
    createdBy: "507f1f77bcf86cd799439012",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-14T00:00:00Z"
};
exports.default = exports.DiscountConfig;
