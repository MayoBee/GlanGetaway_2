import mongoose from "mongoose";
import {
  UserRole,
  UserType,
  HotelType as SharedHotelType,
  BookingType as SharedBookingType,
  HotelSearchResponse,
  HotelWithBookingsType,
  ReviewType,
  StripePaymentInfo,
  GCashPaymentInfo,
  PaymentIntentResponse,
} from "@shared/types";

export interface UserDocument extends Omit<UserType, 'comparePassword'>, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type HotelType = SharedHotelType;
export type BookingType = SharedBookingType;

export {
  UserRole,
  HotelSearchResponse,
  HotelWithBookingsType,
  ReviewType,
  StripePaymentInfo,
  GCashPaymentInfo,
  PaymentIntentResponse,
};
