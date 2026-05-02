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
  barangay?: string;
  purok?: string;
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
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
    units: number;
    description?: string;
    imageUrl?: string;
    isFree?: boolean;
    category?: string;
    isConfirmed?: boolean;
  }>;
  rooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    minOccupancy: number;
    maxOccupancy: number;
    units: number;
    description?: string;
    amenities?: string[];
    imageUrl?: string;
    imageFile?: File;
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
    units: number;
    description?: string;
    amenities?: string[];
    imageUrl?: string;
    imageFile?: File;
    isConfirmed?: boolean;
  }>;
  contact?: {
    phone: string;
    email: string;
    website: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    dayCheckInTime: string;
    dayCheckOutTime: string;
    nightCheckInTime: string;
    nightCheckOutTime: string;
    resortPolicies?: Array<{
      id: string;
      title: string;
      description: string;
      isConfirmed?: boolean;
    }>;
  };
  discounts?: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  };
  packages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    imageFile?: File;
    includedRooms: Array<{
      roomId: string;
      units: number;
    }>;
    includedCottages: Array<{
      cottageId: string;
      units: number;
    }>;
    includedAmenities: Array<{
      amenityId: string;
      quantity: number;
    }>;
    customAddOns: Array<{
      id: string;
      name: string;
      description: string;
      price?: number;
    }>;
    customRooms: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      pricePerNight: number;
      minOccupancy: number;
      maxOccupancy: number;
      units: number;
      amenities?: string[];
    }>;
    customCottages: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      dayRate: number;
      nightRate: number;
      minOccupancy: number;
      maxOccupancy: number;
      units: number;
      amenities?: string[];
    }>;
    customAmenities: Array<{
      id: string;
      name: string;
      description: string;
      type: 'included' | 'addon';
      price?: number;
      quantity: number;
    }>;
    includedAdultEntranceFee: boolean;
    includedChildEntranceFee: boolean;
    isConfirmed?: boolean;
  }>;
  adultEntranceFee?: {
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity?: number;
  };
  childEntranceFee?: Array<{
    id: string;
    minAge: number;
    maxAge: number;
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity?: number;
    isConfirmed?: boolean;
  }>;
  gcashNumber?: string;
  isFeatured?: boolean;
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
