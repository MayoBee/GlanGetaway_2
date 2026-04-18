export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  image?: string;
  role?: "user" | "admin" | "resort_owner" | "front_desk" | "housekeeping" | "superAdmin";
  // Staff-specific fields
  staffProfile?: {
    department?: "front_desk" | "housekeeping" | "maintenance" | "food_beverage" | "activities";
    employeeId?: string;
    hireDate?: Date;
    shiftSchedule?: {
      monday: { start: string; end: string };
      tuesday: { start: string; end: string };
      wednesday: { start: string; end: string };
      thursday: { start: string; end: string };
      friday: { start: string; end: string };
      saturday: { start: string; end: string };
      sunday: { start: string; end: string };
    };
    hourlyRate?: number;
    isActive?: boolean;
  };
  // Permissions for fine-grained access control
  permissions?: {
    canManageBookings?: boolean;
    canManageRooms?: boolean;
    canManagePricing?: boolean;
    canManageAmenities?: boolean;
    canManageActivities?: boolean;
    canViewReports?: boolean;
    canManageBilling?: boolean;
    canManageHousekeeping?: boolean;
    canManageMaintenance?: boolean;
    canManageUsers?: boolean;
  };
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  preferences?: {
    preferredDestinations: string[];
    preferredHotelTypes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
  };
  totalBookings?: number;
  totalSpent?: number;
  lastLogin?: Date;
  isActive?: boolean;
  emailVerified?: boolean;
  // Birthdate (required for account creation)
  birthdate?: Date;
  // PWD (Person With Disability) fields
  isPWD?: boolean;
  pwdId?: string; // PWD ID number
  pwdIdVerified?: boolean; // Verified by super admin
  pwdVerifiedBy?: string;
  pwdVerifiedAt?: Date;
  // Account verification (required for PWD discount eligibility)
  accountVerified?: boolean; // Verified by super admin
  accountVerifiedBy?: string;
  accountVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type HotelType = {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  facilities: string[];
  dayRate: number;
  nightRate: number;
  hasDayRate: boolean;
  hasNightRate: boolean;
  dayRateCheckInTime: string;
  dayRateCheckOutTime: string;
  nightRateCheckInTime: string;
  nightRateCheckOutTime: string;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  // Remove embedded bookings - using separate collection now
  // bookings: BookingType[];

  // New fields for better hotel management and analytics
  location?: {
    latitude: number;
    longitude: number;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
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
    cancellationPolicy?: string;
    petPolicy?: string;
    smokingPolicy?: string;
    resortPolicies?: Array<{
      id: string;
      title: string;
      description: string;
      isConfirmed?: boolean;
    }>;
  };
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
    isConfirmed?: boolean;
  }>;
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
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount?: number;
  occupancyRate?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  // Discount system fields
  discounts?: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
    customDiscounts?: Array<{
      id: string;
      name: string;
      percentage: number;
      promoCode: string;
      isEnabled: boolean;
      maxUses?: number;
      validUntil?: string;
    }>;
  };
  // Package offers
  packages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    includedCottages: string[];
    includedRooms: string[];
    includedAmenities: string[];
    includedAdultEntranceFee: boolean;
    includedChildEntranceFee: boolean;
    isConfirmed?: boolean;
  }>;
  // Approval system fields
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  // Entrance fee fields
  adultEntranceFee?: {
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity?: number; // Only required if pricingModel is "per_group"
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
  downPaymentPercentage?: number;
  gcashNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type BookingType = {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  totalCost: number;
  basePrice: number;
  selectedRooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    minOccupancy: number;
    maxOccupancy: number;
    description?: string;
  }>;
  selectedCottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    minOccupancy: number;
    maxOccupancy: number;
    description?: string;
  }>;
  selectedAmenities?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  selectedPackages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    includedCottages: Array<{
      id: string;
      name: string;
      type: string;
      pricePerNight: number;
      minOccupancy: number;
      maxOccupancy: number;
      description?: string;
    }>;
    includedRooms: Array<{
      id: string;
      name: string;
      type: string;
      pricePerNight: number;
      minOccupancy: number;
      maxOccupancy: number;
      description?: string;
    }>;
    includedAmenities: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
    }>;
  }>;
  paymentIntentId?: string;
  paymentMethod?: "card" | "gcash";
  gcashPayment?: {
    screenshotUrl?: string;
    gcashNumber?: string;
    referenceNumber?: string;
    amountPaid?: number;
    paymentTime?: Date;
    status?: "pending" | "verified" | "rejected";
    verifiedBy?: string;
    verifiedAt?: Date;
    rejectionReason?: string;
  };
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  bookingStatus?: "Pending" | "Confirmed" | "Cancelled" | "Completed";
  refundAmount?: number;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  specialRequests?: string;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type HotelWithBookingsType = HotelType & {
  bookings: BookingType[];
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};
