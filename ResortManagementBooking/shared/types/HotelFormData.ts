export interface HotelFormData {
  // Basic Information
  name: string;
  city: string;
  country: string;
  barangay: string;
  purok: string;
  description: string;
  type: string[];
  starRating: number;
  facilities: string[];
  imageUrls: string[];
  imageFiles?: FileList;

  // Pricing
  dayRate: number;
  nightRate: number;
  hasDayRate: boolean;
  hasNightRate: boolean;
  dayRateCheckInTime: string;
  dayRateCheckOutTime: string;
  nightRateCheckInTime: string;
  nightRateCheckOutTime: string;
  hasNightRateTimeRestrictions: boolean;

  // Contact Information
  contact: {
    phone: string;
    email: string;
    website: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };

  // Policies
  policies: {
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

  // Location
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

  // Amenities
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
    units: number;
    description?: string;
    imageUrl?: string;
    imageFile?: File;
    isFree?: boolean;
    category?: string;
    isConfirmed?: boolean;
  }>;

  // Rooms
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

  // Cottages
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

  // Packages
  packages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    imageFile?: File;
    
    // Inventory selections with units
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
    
    // Custom items (package-exclusive)
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
    
    // Entrance fee integration
    includedAdultEntranceFee: boolean;
    includedChildEntranceFee: boolean;
    
    isConfirmed?: boolean;
  }>;

  // Entrance Fees
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

  // Discounts
  discounts?: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  };

  // Payment Settings
  downPaymentPercentage: number;
  gcashNumber?: string;

  // Featured Status
  isFeatured: boolean;
}
