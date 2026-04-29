// Shared types for frontend and backend

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "superAdmin",
  RESORT_OWNER = "resort_owner",
  FRONT_DESK = "front_desk",
  HOUSEKEEPING = "housekeeping",
}

export interface UserType {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelType {
  _id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  starRating: number;
  facilities: string[];
  imageUrls: string[];
  userId: string;
  dayRate?: number;
  nightRate?: number;
  hasDayRate?: boolean;
  hasNightRate?: boolean;
  pricePerNight?: number;
  amenities?: any[];
  rooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    minOccupancy: number;
    maxOccupancy: number;
    description?: string;
    amenities?: string[];
    isConfirmed?: boolean;
  }>;
  cottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    dayRate: number;
    nightRate: number;
    hasDayRate: boolean;
    hasNightRate: boolean;
    minOccupancy: number;
    maxOccupancy: number;
    description?: string;
    amenities?: string[];
    isConfirmed?: boolean;
  }>;
  downPaymentPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingType {
  _id: string;
  hotelId: string;
  userId: string;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  selectedRooms?: any[];
  selectedCottages?: any[];
  selectedAmenities?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
}

export interface StripePaymentInfo {
  paymentIntentId: string;
  clientSecret: string;
}

export interface GCashPaymentInfo {
  gcashNumber: string;
  referenceNumber: string;
  amountPaid: number;
  paymentTime: string;
}

export interface HotelFormData {
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  pricePerNight: number;
  starRating: number;
  facilities: string[];
  imageUrls: string[];
  imageFiles?: FileList;
  adultCount?: number;
  childCount?: number;
}

export interface HotelSearchResponse {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface ReviewType {
  _id: string;
  userId: string;
  hotelId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelWithBookingsType extends HotelType {
  bookings: BookingType[];
}

export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  hotelId: string;
  paymentIntentId: string;
  totalCost: number;
  basePrice: number;
  specialRequests?: string;
  paymentMethod: "card" | "gcash";
  selectedRooms?: any[];
  selectedCottages?: any[];
  selectedAmenities?: any[];
}
