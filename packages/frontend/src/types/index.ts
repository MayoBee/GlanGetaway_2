// Frontend types - re-export from shared package for backward compatibility
import type {
  UserRole,
  UserType,
  HotelType,
  BookingType,
  HotelSearchResponse,
  HotelWithBookingsType,
  ReviewType,
  StripePaymentInfo,
  GCashPaymentInfo,
  PaymentIntentResponse,
  HotelFormData,
  BookingFormData,
} from "../../../shared/types";

export type UserDocument = UserType;

export {
  UserRole,
  HotelType,
  BookingType,
  PaymentIntentResponse,
  HotelSearchResponse,
  HotelWithBookingsType,
  ReviewType,
  StripePaymentInfo,
  GCashPaymentInfo,
  HotelFormData,
  BookingFormData,
};
