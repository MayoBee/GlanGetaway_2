// Shared types for frontend and backend

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "superAdmin",
  RESORT_OWNER = "resortOwner",
  FRONT_DESK = "frontDesk",
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

export interface HotelSearchResponse {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}
