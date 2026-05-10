import { useForm, FormProvider, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import DetailsSection from "./DetailsSection";
import GuestsSection from "./GuestsSection";
import TypeSection from "./TypeSection";
import FacilitiesSection from "./FacilitiesSection";
import FreshRoomsSection from "./FreshRoomsSection";
import FreshCottagesSection from "./FreshCottagesSection";
import AmenitiesSection from "./AmenitiesSection";
import FreshPackagesSection from "./FreshPackagesSection";
import ContactSection from "./ContactSection";
import PoliciesSection from "./PoliciesSection";
import ImagesSection from "./ImagesSection";
import PaymentModuleSection from "./PaymentModuleSection";
import DiscountsSection from "./DiscountsSection";
import { mergeUnitsWithBackendData, extractUnitsFromFormData } from "../../utils/unitsStorage";
import { HotelType } from "../../shared/types";

export type HotelFormData = {
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  dayRate: number;
  nightRate: number;
  hasDayRate: boolean;
  hasNightRate: boolean;
  dayRateCheckInTime: string;
  dayRateCheckOutTime: string;
  nightRateCheckInTime: string;
  nightRateCheckOutTime: string;
  hasNightRateTimeRestrictions: boolean;
  starRating: number;
  facilities: string[];
  imageFiles?: FileList;
  imageUrls: string[];
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
    units: number;
    description?: string;
    imageUrl?: string;
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
    isConfirmed?: boolean;
    includedEntranceFee?: {
      enabled: boolean;
      adultCount: number;
      childCount: number;
    };
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
    isConfirmed?: boolean;
    includedEntranceFee?: {
      enabled: boolean;
      adultCount: number;
      childCount: number;
    };
  }>;
  // New fields
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
  isFeatured: boolean;
  discounts?: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  };
  // Entrance fee fields
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
  packages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    includedCottages: string[];
    includedRooms: string[];
    includedAmenities: string[];
    customItems: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
    customRooms?: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      capacity: number;
      features: string;
      availability: number;
    }>;
    customCottages?: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      capacity: number;
      features: string;
      availability: number;
    }>;
    customAmenities?: Array<{
      id: string;
      name: string;
      description: string;
      quantity: number;
      inclusionType: 'included' | 'addon';
      imageUrl?: string;
    }>;
    includedAdultEntranceFee: boolean;
    includedChildEntranceFee: boolean;
    isConfirmed?: boolean;
  }>;
  downPaymentPercentage: number;
  gcashNumber?: string;
};

type Props = {
  hotel?: HotelType;
  onSave: (hotelFormData: HotelFormData) => void;
  isLoading: boolean;
};

const ManageHotelForm = ({ onSave, isLoading, hotel }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isManualSubmit, setIsManualSubmit] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      sections: ["DetailsSection", "TypeSection"]
    },
    {
      id: 2,
      title: "Rates & Facilities",
      sections: ["GuestsSection", "FacilitiesSection"]
    },
    {
      id: 3,
      title: "Accommodations",
      sections: ["FreshRoomsSection", "FreshCottagesSection"]
    },
    {
      id: 4,
      title: "Amenities & Packages",
      sections: ["AmenitiesSection", "FreshPackagesSection"]
    },
    {
      id: 5,
      title: "Contact & Policies",
      sections: ["ContactSection", "PoliciesSection", "PaymentModuleSection", "DiscountsSection"]
    },
    {
      id: 6,
      title: "Images & Review",
      sections: ["ImagesSection", "ReviewSection"]
    }
  ];

  const formMethods = useForm<HotelFormData>({
    mode: 'onSubmit',
    shouldFocusError: true,
    resolver: async (values) => {
      const errors: any = {};
      
      // Custom validation: at least one rate type must be selected
      if (!values.hasDayRate && !values.hasNightRate) {
        errors.hasDayRate = {
          type: 'manual',
          message: 'Please select at least one rate type (Day Rate or Night Rate)'
        };
        errors.hasNightRate = {
          type: 'manual',
          message: 'Please select at least one rate type (Day Rate or Night Rate)'
        };
      }
      
      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {}
      };
    },
    defaultValues: {
      name: "",
      city: "",
      country: "",
      description: "",
      type: [],
      dayRate: 0,
      nightRate: 0,
      hasDayRate: false,
      hasNightRate: false,
      dayRateCheckInTime: "08:00 AM",
      dayRateCheckOutTime: "05:00 PM",
      nightRateCheckInTime: "02:00 PM",
      nightRateCheckOutTime: "02:00 PM",
      starRating: 3,
      facilities: [],
      imageUrls: [],
      contact: {
        phone: "",
        email: "",
        website: "",
        facebook: "",
        instagram: "",
        tiktok: "",
      },
      policies: {
        checkInTime: "",
        checkOutTime: "",
        dayCheckInTime: "",
        dayCheckOutTime: "",
        nightCheckInTime: "",
        nightCheckOutTime: "",
        resortPolicies: [],
      },
      amenities: [],
      rooms: [],
      cottages: [],
      discounts: {
        seniorCitizenEnabled: true,
        seniorCitizenPercentage: 20,
        pwdEnabled: true,
        pwdPercentage: 20,
      },
      packages: [],
      isFeatured: false,
      childEntranceFee: [],
      downPaymentPercentage: 50,
      gcashNumber: "",
    },
  });
  const { handleSubmit, reset } = formMethods;

  useEffect(() => {
    if (hotel) {
      console.log('=== MANAGE HOTEL FORM: Loading hotel data', hotel._id);
      
      // Get current form values to preserve confirmed states
      const currentValues = formMethods.getValues();
      
      // Merge backend data with saved units data
      const mergedHotelData = mergeUnitsWithBackendData(hotel._id, hotel);
      
      // Helper function to preserve confirmed states
      const preserveConfirmedStates = (currentItems: any[], newItems: any[]) => {
        const confirmedMap = new Map();
        currentItems.forEach(item => {
          if (item.isConfirmed) {
            confirmedMap.set(item.id, true);
          }
        });
        
        return newItems.map(item => ({
          ...item,
          isConfirmed: confirmedMap.get(item.id) || item.isConfirmed || false
        }));
      };
      
      // Map HotelType to HotelFormData with proper defaults for missing required properties
      const formData: HotelFormData = {
        name: mergedHotelData.name,
        city: mergedHotelData.city,
        country: mergedHotelData.country,
        description: mergedHotelData.description,
        type: mergedHotelData.type,
        dayRate: mergedHotelData.dayRate || 0,
        nightRate: mergedHotelData.nightRate || 0,
        hasDayRate: mergedHotelData.hasDayRate !== undefined ? mergedHotelData.hasDayRate : false,
        hasNightRate: mergedHotelData.hasNightRate !== undefined ? mergedHotelData.hasNightRate : false,
        dayRateCheckInTime: (mergedHotelData as any).dayRateCheckInTime || "08:00 AM",
        dayRateCheckOutTime: (mergedHotelData as any).dayRateCheckOutTime || "05:00 PM",
        nightRateCheckInTime: (mergedHotelData as any).nightRateCheckInTime || "02:00 PM",
        nightRateCheckOutTime: (mergedHotelData as any).nightRateCheckOutTime || "02:00 PM",
        hasNightRateTimeRestrictions: (mergedHotelData as any).hasNightRateTimeRestrictions || false,
        starRating: mergedHotelData.starRating,
        facilities: mergedHotelData.facilities,
        imageUrls: mergedHotelData.imageUrls || [],
        contact: mergedHotelData.contact || {
          phone: "",
          email: "",
          website: "",
          facebook: "",
          instagram: "",
          tiktok: "",
        },
        policies: {
          ...mergedHotelData.policies,
          resortPolicies: preserveConfirmedStates(
            currentValues.policies?.resortPolicies || [],
            mergedHotelData.policies?.resortPolicies || []
          )
        },
        amenities: preserveConfirmedStates(
          currentValues.amenities || [],
          (mergedHotelData.amenities || []).map(amenity => ({
            ...amenity,
            units: parseInt(String(amenity.units)) || 1
          }))
        ),
        rooms: preserveConfirmedStates(
          currentValues.rooms || [],
          (mergedHotelData.rooms || []).map(room => ({
            ...room,
            units: parseInt(String(room.units)) || 1
          }))
        ),
        cottages: preserveConfirmedStates(
          currentValues.cottages || [],
          (mergedHotelData.cottages || []).map(cottage => ({
            ...cottage,
            units: parseInt(String(cottage.units)) || 1
          }))
        ),
        isFeatured: mergedHotelData.isFeatured || false,
        discounts: mergedHotelData.discounts || {
          seniorCitizenEnabled: true,
          seniorCitizenPercentage: 20,
          pwdEnabled: true,
          pwdPercentage: 20
        },
        packages: preserveConfirmedStates(
          currentValues.packages || [],
          mergedHotelData.packages || []
        ),
                childEntranceFee: preserveConfirmedStates(
          currentValues.childEntranceFee || [],
          mergedHotelData.childEntranceFee || []
        ),
        downPaymentPercentage: mergedHotelData.downPaymentPercentage || 50,
        gcashNumber: mergedHotelData.gcashNumber || "",
      };
      
      console.log('=== MANAGE HOTEL FORM: Setting form data with merged units', {
        hotelId: hotel._id,
        roomsUnits: formData.rooms?.map(r => ({ id: r.id, units: r.units })),
        cottagesUnits: formData.cottages?.map(c => ({ id: c.id, units: c.units })),
        amenitiesUnits: formData.amenities?.map(a => ({ id: a.id, units: a.units }))
      });
      
      reset(formData);
    }
  }, [hotel, reset, formMethods]);

  // Check for saved form data after authentication
  useEffect(() => {
    const savedFormData = localStorage.getItem('pendingHotelFormData');
    const savedTimestamp = localStorage.getItem('pendingHotelFormTimestamp');
    
    if (savedFormData && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      // Only restore if data is less than 1 hour old
      if (now - timestamp < oneHour) {
        try {
          const parsedData = JSON.parse(savedFormData);
          console.log('=== RESTORING SAVED FORM DATA ===');
          console.log('Restored data:', parsedData);
          
          // Restore form data
          reset(parsedData);
          
          // Clear the saved data
          localStorage.removeItem('pendingHotelFormData');
          localStorage.removeItem('pendingHotelFormTimestamp');
          
          // Show notification to user
          alert('Your previous form data has been restored. You can continue editing your resort.');
        } catch (error) {
          console.error('Error restoring saved form data:', error);
          // Clear corrupted data
          localStorage.removeItem('pendingHotelFormData');
          localStorage.removeItem('pendingHotelFormTimestamp');
        }
      } else {
        // Clear expired data
        localStorage.removeItem('pendingHotelFormData');
        localStorage.removeItem('pendingHotelFormTimestamp');
      }
    }
  }, [reset]);

  const handleSave = async (formDataJson: HotelFormData) => {
    // Only allow submission if manually triggered by user
    if (!isManualSubmit) {
      console.log('=== BLOCKED AUTOMATIC SUBMISSION ===');
      return;
    }
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Complete form data:', JSON.stringify(formDataJson, null, 2));
    
    // Save form data to global variable for recovery after authentication
    (window as any).currentHotelFormData = formDataJson;
    
    // Comprehensive validation gatekeeper
    const validationErrors: string[] = [];
    
    // Required fields validation
    if (!formDataJson.name || formDataJson.name.trim() === '') {
      validationErrors.push('Resort name is required');
    }
    if (!formDataJson.city || formDataJson.city.trim() === '') {
      validationErrors.push('Barangay is required');
    }
    if (!formDataJson.country || formDataJson.country.trim() === '') {
      validationErrors.push('Purok is required');
    }
    if (!formDataJson.description || formDataJson.description.trim() === '') {
      validationErrors.push('Description is required');
    }
    
    // Rate type validation
    if (!formDataJson.hasDayRate && !formDataJson.hasNightRate) {
      validationErrors.push('Please select at least one rate type (Day Rate or Night Rate)');
    }
    if (formDataJson.hasDayRate && (!formDataJson.dayRate || formDataJson.dayRate <= 0)) {
      validationErrors.push('Day rate price is required when Day Rate is enabled');
    }
    if (formDataJson.hasNightRate && (!formDataJson.nightRate || formDataJson.nightRate <= 0)) {
      validationErrors.push('Night rate price is required when Night Rate is enabled');
    }
    
    // Contact information validation
    if (formDataJson.contact) {
      if (!formDataJson.contact.phone || formDataJson.contact.phone.trim() === '') {
        validationErrors.push('Contact phone number is required');
      } else if (!/^[\d\s\-+()]+$/.test(formDataJson.contact.phone) || formDataJson.contact.phone.replace(/\D/g, '').length < 7) {
        validationErrors.push('Please enter a valid phone number (at least 7 digits)');
      }
      if (!formDataJson.contact.email || formDataJson.contact.email.trim() === '') {
        validationErrors.push('Contact email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDataJson.contact.email)) {
        validationErrors.push('Please enter a valid email address');
      }
    }
    
    // Facilities validation
    if (!formDataJson.facilities || formDataJson.facilities.length === 0) {
      validationErrors.push('Please select at least one facility');
    }
    
    // Check if at least one accommodation type is configured
    const hasRooms = formDataJson.rooms && formDataJson.rooms.length > 0;
    const hasCottages = formDataJson.cottages && formDataJson.cottages.length > 0;
    
    if (!hasRooms && !hasCottages) {
      validationErrors.push('Please add at least one room or cottage');
    }
    
    // Note: Image validation is now handled with fallback placeholder images
    // No validation error needed since we provide default images
    
    // Validate rooms
    if (hasRooms) {
      formDataJson.rooms?.forEach((room, index) => {
        if (!room.name || room.name.trim() === '') {
          validationErrors.push(`Room ${index + 1}: Name is required`);
        }
        if (!room.type || room.type.trim() === '') {
          validationErrors.push(`Room ${index + 1}: Type is required`);
        }
        if (!room.pricePerNight || room.pricePerNight <= 0) {
          validationErrors.push(`Room ${index + 1}: Price per night is required`);
        }
        if (!room.minOccupancy || room.minOccupancy <= 0) {
          validationErrors.push(`Room ${index + 1}: Minimum occupancy is required`);
        }
        if (!room.maxOccupancy || room.maxOccupancy <= 0) {
          validationErrors.push(`Room ${index + 1}: Maximum occupancy is required`);
        }
        if (room.minOccupancy > room.maxOccupancy) {
          validationErrors.push(`Room ${index + 1}: Minimum occupancy cannot exceed maximum occupancy`);
        }
      });
    }
    
    // Validate cottages
    if (hasCottages) {
      formDataJson.cottages?.forEach((cottage, index) => {
        if (!cottage.name || cottage.name.trim() === '') {
          validationErrors.push(`Cottage ${index + 1}: Name is required`);
        }
        if (!cottage.type || cottage.type.trim() === '') {
          validationErrors.push(`Cottage ${index + 1}: Type is required`);
        }
        // Validate pricing based on enabled rate types
        const hasDayRate = cottage.hasDayRate || (cottage.dayRate && cottage.dayRate > 0);
        const hasNightRate = cottage.hasNightRate || (cottage.nightRate && cottage.nightRate > 0);
        
        if (!hasDayRate && !hasNightRate) {
          validationErrors.push(`Cottage ${index + 1}: At least one rate type (Day Rate or Night Rate) must be enabled`);
        }
        if (hasDayRate && (!cottage.dayRate || cottage.dayRate <= 0)) {
          validationErrors.push(`Cottage ${index + 1}: Day rate is required when Day Rate is enabled`);
        }
        if (hasNightRate && (!cottage.nightRate || cottage.nightRate <= 0)) {
          validationErrors.push(`Cottage ${index + 1}: Night rate is required when Night Rate is enabled`);
        }
        if (!cottage.minOccupancy || cottage.minOccupancy <= 0) {
          validationErrors.push(`Cottage ${index + 1}: Minimum occupancy is required`);
        }
        if (!cottage.maxOccupancy || cottage.maxOccupancy <= 0) {
          validationErrors.push(`Cottage ${index + 1}: Maximum occupancy is required`);
        }
        if (cottage.minOccupancy > cottage.maxOccupancy) {
          validationErrors.push(`Cottage ${index + 1}: Minimum occupancy cannot exceed maximum occupancy`);
        }
      });
    }
    
    // If there are validation errors, prevent submission
    if (validationErrors.length > 0) {
      console.error('=== VALIDATION FAILED ===');
      console.error('Validation errors:', validationErrors);
      alert('Please fix the following errors before submitting:\n\n' + validationErrors.join('\n'));
      return;
    }
    
    // Extract and save units data to local storage (for persistence when backend doesn't handle it)
    const hotelId = (formDataJson as any)._id || 'new_hotel';
    extractUnitsFromFormData(formDataJson, hotelId);
    
    // Fix policy times - populate empty required fields with proper defaults
    const fixedPolicies = {
      ...formDataJson.policies,
      // Use day rate times as defaults for general check-in/out if empty
      checkInTime: formDataJson.policies?.checkInTime || formDataJson.dayRateCheckInTime || "08:00 AM",
      checkOutTime: formDataJson.policies?.checkOutTime || formDataJson.dayRateCheckOutTime || "05:00 PM",
      // Ensure day check-in/out times are populated
      dayCheckInTime: formDataJson.policies?.dayCheckInTime || formDataJson.dayRateCheckInTime || "08:00 AM",
      dayCheckOutTime: formDataJson.policies?.dayCheckOutTime || formDataJson.dayRateCheckOutTime || "05:00 PM",
      // For night times, use provided values or default to flexible times
      nightCheckInTime: formDataJson.policies?.nightCheckInTime || (formDataJson.hasNightRate ? formDataJson.nightRateCheckInTime : "02:00 PM"),
      nightCheckOutTime: formDataJson.policies?.nightCheckOutTime || (formDataJson.hasNightRate ? formDataJson.nightRateCheckOutTime : "02:00 PM"),
    };

    // Ensure at least one image URL is provided (fallback to placeholder if needed)
    console.log('=== IMAGE FALLBACK DEBUG ===');
    console.log('Original imageUrls:', formDataJson.imageUrls);
    console.log('ImageFiles:', formDataJson.imageFiles);
    
    let finalImageUrls = formDataJson.imageUrls || [];
    console.log('Initial finalImageUrls:', finalImageUrls);
    console.log('finalImageUrls.length:', finalImageUrls.length);
    
    // Properly check for imageFiles (FileList object)
    const hasImageFiles = formDataJson.imageFiles && 
                         (formDataJson.imageFiles instanceof FileList || Array.isArray(formDataJson.imageFiles)) && 
                         formDataJson.imageFiles.length > 0;
    console.log('hasImageFiles check:', hasImageFiles);
    
    if (finalImageUrls.length === 0 && !hasImageFiles) {
      // Provide a default placeholder image URL for new resorts without images
      console.log('Applying fallback image URL');
      finalImageUrls = ["https://picsum.photos/seed/resort/800/600.jpg"];
    }
    
    console.log('Final imageUrls to be sent:', finalImageUrls);

    // Debug includedEntranceFee data before processing
    console.log('=== INCLUDED ENTRANCE FEE DEBUG ===');
    formDataJson.rooms?.forEach((room, index) => {
      console.log(`Room ${index} (${room.name}):`, {
        includedEntranceFee: room.includedEntranceFee,
        enabled: room.includedEntranceFee?.enabled,
        adultCount: room.includedEntranceFee?.adultCount,
        childCount: room.includedEntranceFee?.childCount
      });
    });

    // Clean up amenities arrays - remove "Free entrance" entries if not enabled
    const cleanedRooms = formDataJson.rooms?.map(room => ({
      ...room,
      amenities: room.amenities?.filter(amenity =>
        !amenity.toLowerCase().includes('free entrance') ||
        (room.includedEntranceFee?.enabled && amenity.toLowerCase().includes('free entrance'))
      ) || []
    }));

    const cleanedCottages = formDataJson.cottages?.map(cottage => ({
      ...cottage,
      amenities: cottage.amenities?.filter(amenity =>
        !amenity.toLowerCase().includes('free entrance') ||
        (cottage.includedEntranceFee?.enabled && amenity.toLowerCase().includes('free entrance'))
      ) || []
    }));

    // Convert units from strings to numbers for cottages and amenities
    const processedData = {
      ...formDataJson,
      policies: fixedPolicies,
      imageUrls: finalImageUrls,
      amenities: formDataJson.amenities?.map(amenity => ({
        ...amenity,
        units: parseInt(String(amenity.units)) || 1
      })),
      cottages: cleanedCottages?.map(cottage => ({
        ...cottage,
        units: parseInt(String(cottage.units)) || 1
      })),
      // Rooms units are already numbers, but ensure consistency
      rooms: cleanedRooms?.map(room => ({
        ...room,
        units: parseInt(String(room.units)) || 1
      }))
    };
    
    // Debug units specifically
    console.log('ROOMS UNITS DEBUG:');
    processedData.rooms?.forEach((room, index) => {
      console.log(`Room ${index} (${room.name}):`, {
        id: room.id,
        units: room.units,
        unitsType: typeof room.units,
        unitsValue: room.units?.toString()
      });
    });
    
    console.log('COTTAGES UNITS DEBUG:');
    processedData.cottages?.forEach((cottage, index) => {
      console.log(`Cottage ${index} (${cottage.name}):`, {
        id: cottage.id,
        units: cottage.units,
        unitsType: typeof cottage.units,
        unitsValue: cottage.units?.toString()
      });
    });
    
    console.log('AMENITIES UNITS DEBUG:');
    processedData.amenities?.forEach((amenity, index) => {
      console.log(`Amenity ${index} (${amenity.name}):`, {
        id: amenity.id,
        units: amenity.units,
        unitsType: typeof amenity.units,
        unitsValue: amenity.units?.toString()
      });
    });
    
    console.log('Form data keys:', Object.keys(processedData));
    console.log('Rooms being sent:', processedData.rooms);
    console.log('Cottages being sent:', processedData.cottages);
    console.log('Packages being sent:', processedData.packages);

    // Debug final includedEntranceFee data being sent
    console.log('=== FINAL INCLUDED ENTRANCE FEE DATA BEING SENT ===');
    processedData.rooms?.forEach((room, index) => {
      console.log(`Final Room ${index} (${room.name}):`, {
        includedEntranceFee: room.includedEntranceFee,
        enabled: room.includedEntranceFee?.enabled,
        adultCount: room.includedEntranceFee?.adultCount,
        childCount: room.includedEntranceFee?.childCount
      });
    });

    // Reset manual submit flag
    setIsManualSubmit(false);

    // Check if there are new image files to upload
    const hasNewImageFiles = formDataJson.imageFiles && 
                           (formDataJson.imageFiles instanceof FileList || Array.isArray(formDataJson.imageFiles)) && 
                           formDataJson.imageFiles.length > 0;

    console.log('=== FORM DATA CONSTRUCTION DEBUG ===');
    console.log('hasNewImageFiles:', hasNewImageFiles);
    console.log('imageFiles:', formDataJson.imageFiles);

    // If there are new image files, construct FormData
    if (hasNewImageFiles) {
      console.log('Constructing FormData with image files');
      const formData = new FormData();
      
      // Add hotelId if available (for edit mode)
      if (hotel?._id) {
        formData.append('hotelId', hotel._id);
      }
      
      // Add all string fields
      formData.append('name', processedData.name);
      formData.append('city', processedData.city);
      formData.append('country', processedData.country);
      formData.append('description', processedData.description);
      formData.append('dayRate', String(processedData.dayRate));
      formData.append('nightRate', String(processedData.nightRate));
      formData.append('hasDayRate', String(processedData.hasDayRate));
      formData.append('hasNightRate', String(processedData.hasNightRate));
      formData.append('dayRateCheckInTime', processedData.dayRateCheckInTime);
      formData.append('dayRateCheckOutTime', processedData.dayRateCheckOutTime);
      formData.append('nightRateCheckInTime', processedData.nightRateCheckInTime);
      formData.append('nightRateCheckOutTime', processedData.nightRateCheckOutTime);
      formData.append('hasNightRateTimeRestrictions', String(processedData.hasNightRateTimeRestrictions));
      formData.append('starRating', String(processedData.starRating));
      formData.append('isFeatured', String(processedData.isFeatured));
      formData.append('downPaymentPercentage', String(processedData.downPaymentPercentage));
      
      if (processedData.gcashNumber) {
        formData.append('gcashNumber', processedData.gcashNumber);
      }
      
      // Add arrays
      processedData.type.forEach((type, index) => {
        formData.append(`type[${index}]`, type);
      });
      
      processedData.facilities.forEach((facility, index) => {
        formData.append(`facilities[${index}]`, facility);
      });
      
      // Add imageUrls (existing images)
      processedData.imageUrls.forEach((url, index) => {
        formData.append(`imageUrls[${index}]`, url);
      });
      
      // Add imageFiles (new images)
      if (formDataJson.imageFiles) {
        Array.from(formDataJson.imageFiles).forEach((file: File) => {
          formData.append('imageFiles', file);
        });
      }
      
      // Add contact information
      if (processedData.contact) {
        formData.append('contact.phone', processedData.contact.phone);
        formData.append('contact.email', processedData.contact.email);
        formData.append('contact.website', processedData.contact.website);
        formData.append('contact.facebook', processedData.contact.facebook || '');
        formData.append('contact.instagram', processedData.contact.instagram || '');
        formData.append('contact.tiktok', processedData.contact.tiktok || '');
      }
      
      // Add policies
      if (processedData.policies) {
        formData.append('policies.checkInTime', processedData.policies.checkInTime);
        formData.append('policies.checkOutTime', processedData.policies.checkOutTime);
        formData.append('policies.dayCheckInTime', processedData.policies.dayCheckInTime);
        formData.append('policies.dayCheckOutTime', processedData.policies.dayCheckOutTime);
        formData.append('policies.nightCheckInTime', processedData.policies.nightCheckInTime);
        formData.append('policies.nightCheckOutTime', processedData.policies.nightCheckOutTime);
        
        if (processedData.policies.resortPolicies) {
          processedData.policies.resortPolicies.forEach((policy, index) => {
            formData.append(`policies.resortPolicies[${index}][id]`, policy.id);
            formData.append(`policies.resortPolicies[${index}][title]`, policy.title);
            formData.append(`policies.resortPolicies[${index}][description]`, policy.description);
            formData.append(`policies.resortPolicies[${index}][isConfirmed]`, String(policy.isConfirmed || false));
            if (policy._id) {
              formData.append(`policies.resortPolicies[${index}][_id]`, policy._id);
            }
          });
        }
      }
      
      // Add rooms
      if (processedData.rooms) {
        processedData.rooms.forEach((room, index) => {
          formData.append(`rooms[${index}][id]`, room.id);
          formData.append(`rooms[${index}][name]`, room.name);
          formData.append(`rooms[${index}][type]`, room.type);
          formData.append(`rooms[${index}][pricePerNight]`, String(room.pricePerNight));
          formData.append(`rooms[${index}][minOccupancy]`, String(room.minOccupancy));
          formData.append(`rooms[${index}][maxOccupancy]`, String(room.maxOccupancy));
          formData.append(`rooms[${index}][units]`, String(room.units));
          formData.append(`rooms[${index}][description]`, room.description || '');
          
          if (room.includedEntranceFee) {
            formData.append(`rooms[${index}][includedEntranceFee][enabled]`, String(room.includedEntranceFee.enabled));
            formData.append(`rooms[${index}][includedEntranceFee][adultCount]`, String(room.includedEntranceFee.adultCount));
            formData.append(`rooms[${index}][includedEntranceFee][childCount]`, String(room.includedEntranceFee.childCount));
          }
          
          if (room.amenities) {
            room.amenities.forEach((amenity, amenityIndex) => {
              formData.append(`rooms[${index}][amenities][${amenityIndex}]`, amenity);
            });
          }
        });
      }
      
      // Add cottages
      if (processedData.cottages) {
        processedData.cottages.forEach((cottage, index) => {
          formData.append(`cottages[${index}][id]`, cottage.id);
          formData.append(`cottages[${index}][name]`, cottage.name);
          formData.append(`cottages[${index}][type]`, cottage.type);
          formData.append(`cottages[${index}][pricePerNight]`, String(cottage.pricePerNight));
          formData.append(`cottages[${index}][dayRate]`, String(cottage.dayRate));
          formData.append(`cottages[${index}][nightRate]`, String(cottage.nightRate));
          formData.append(`cottages[${index}][hasDayRate]`, String(cottage.hasDayRate));
          formData.append(`cottages[${index}][hasNightRate]`, String(cottage.hasNightRate));
          formData.append(`cottages[${index}][minOccupancy]`, String(cottage.minOccupancy));
          formData.append(`cottages[${index}][maxOccupancy]`, String(cottage.maxOccupancy));
          formData.append(`cottages[${index}][units]`, String(cottage.units));
          formData.append(`cottages[${index}][description]`, cottage.description || '');
          
          if (cottage.includedEntranceFee) {
            formData.append(`cottages[${index}][includedEntranceFee][enabled]`, String(cottage.includedEntranceFee.enabled));
            formData.append(`cottages[${index}][includedEntranceFee][adultCount]`, String(cottage.includedEntranceFee.adultCount));
            formData.append(`cottages[${index}][includedEntranceFee][childCount]`, String(cottage.includedEntranceFee.childCount));
          }
          
          if (cottage.amenities) {
            cottage.amenities.forEach((amenity, amenityIndex) => {
              formData.append(`cottages[${index}][amenities][${amenityIndex}]`, amenity);
            });
          }
        });
      }
      
      // Add amenities
      if (processedData.amenities) {
        processedData.amenities.forEach((amenity, index) => {
          formData.append(`amenities[${index}][id]`, amenity.id);
          formData.append(`amenities[${index}][name]`, amenity.name);
          formData.append(`amenities[${index}][price]`, String(amenity.price));
          formData.append(`amenities[${index}][units]`, String(amenity.units));
          formData.append(`amenities[${index}][description]`, amenity.description || '');
          formData.append(`amenities[${index}][imageUrl]`, amenity.imageUrl || '');
          formData.append(`amenities[${index}][isConfirmed]`, String(amenity.isConfirmed || false));
        });
      }
      
      // Add packages
      if (processedData.packages) {
        processedData.packages.forEach((pkg, index) => {
          formData.append(`packages[${index}][id]`, pkg.id);
          formData.append(`packages[${index}][name]`, pkg.name);
          formData.append(`packages[${index}][description]`, pkg.description || '');
          formData.append(`packages[${index}][price]`, String(pkg.price));
          formData.append(`packages[${index}][imageUrl]`, pkg.imageUrl || '');
          formData.append(`packages[${index}][includedAdultEntranceFee]`, String(pkg.includedAdultEntranceFee));
          formData.append(`packages[${index}][includedChildEntranceFee]`, String(pkg.includedChildEntranceFee));
          formData.append(`packages[${index}][isConfirmed]`, String(pkg.isConfirmed || false));
          
          if (pkg.includedCottages) {
            pkg.includedCottages.forEach((cottageId, cottageIndex) => {
              formData.append(`packages[${index}][includedCottages][${cottageIndex}]`, cottageId);
            });
          }
          
          if (pkg.includedRooms) {
            pkg.includedRooms.forEach((roomId, roomIndex) => {
              formData.append(`packages[${index}][includedRooms][${roomIndex}]`, roomId);
            });
          }
          
          if (pkg.includedAmenities) {
            pkg.includedAmenities.forEach((amenityId, amenityIndex) => {
              formData.append(`packages[${index}][includedAmenities][${amenityIndex}]`, amenityId);
            });
          }
        });
      }
      
      // Add child entrance fees
      if (processedData.childEntranceFee) {
        processedData.childEntranceFee.forEach((fee, index) => {
          formData.append(`childEntranceFee[${index}][id]`, fee.id);
          formData.append(`childEntranceFee[${index}][minAge]`, String(fee.minAge));
          formData.append(`childEntranceFee[${index}][maxAge]`, String(fee.maxAge));
          formData.append(`childEntranceFee[${index}][dayRate]`, String(fee.dayRate));
          formData.append(`childEntranceFee[${index}][nightRate]`, String(fee.nightRate));
          formData.append(`childEntranceFee[${index}][pricingModel]`, fee.pricingModel);
          if (fee.groupQuantity) {
            formData.append(`childEntranceFee[${index}][groupQuantity]`, String(fee.groupQuantity));
          }
          formData.append(`childEntranceFee[${index}][isConfirmed]`, String(fee.isConfirmed || false));
        });
      }
      
      // Add discounts
      if (processedData.discounts) {
        formData.append('discounts.seniorCitizenEnabled', String(processedData.discounts.seniorCitizenEnabled));
        formData.append('discounts.seniorCitizenPercentage', String(processedData.discounts.seniorCitizenPercentage));
        formData.append('discounts.pwdEnabled', String(processedData.discounts.pwdEnabled));
        formData.append('discounts.pwdPercentage', String(processedData.discounts.pwdPercentage));
      }
      
      console.log('FormData constructed successfully');
      onSave(formData as any);
    } else {
      // No new image files, send as JSON for backward compatibility
      console.log('Sending data as JSON (no new images)');
      onSave(processedData);
    }
  };

  const onSubmit = handleSubmit(handleSave);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStepSections = () => {
    const currentStepData = steps.find(step => step.id === currentStep);
    if (!currentStepData) return null;

    return currentStepData.sections.map(sectionName => {
      switch (sectionName) {
        case "DetailsSection":
          return <DetailsSection key={sectionName} />;
        case "GuestsSection":
          return <GuestsSection key={sectionName} />;
        case "TypeSection":
          return <TypeSection key={sectionName} />;
        case "FacilitiesSection":
          return <FacilitiesSection key={sectionName} />;
        case "FreshRoomsSection":
          return <FreshRoomsSection key={sectionName} />;
        case "FreshCottagesSection":
          return <FreshCottagesSection key={sectionName} />;
        case "AmenitiesSection":
          return <AmenitiesSection key={sectionName} />;
        case "FreshPackagesSection":
          return <FreshPackagesSection key={sectionName} />;
        case "ContactSection":
          return <ContactSection key={sectionName} />;
        case "PoliciesSection":
          return <PoliciesSection key={sectionName} />;
        case "ImagesSection":
          return <ImagesSection key={sectionName} />;
        case "PaymentModuleSection":
          return <PaymentModuleSection key={sectionName} />;
        case "DiscountsSection":
          return <DiscountsSection key={sectionName} />;
        case "ReviewSection":
          return <ReviewSection key={sectionName} />;
        default:
          return null;
      }
    });
  };

  const ReviewSection = () => {
    const watchedValues = useWatch({ control: formMethods.control });

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Review & Submit</h3>
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div>
            <h4 className="text-lg font-medium">Basic Information</h4>
            <p><strong>Name:</strong> {watchedValues.name}</p>
            <p><strong>City:</strong> {watchedValues.city}</p>
            <p><strong>Country:</strong> {watchedValues.country}</p>
            <p><strong>Description:</strong> {watchedValues.description}</p>
            <p><strong>Type:</strong> {watchedValues.type?.join(", ")}</p>
            <p><strong>Star Rating:</strong> {watchedValues.starRating}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Rates</h4>
            <p><strong>Day Rate:</strong> {watchedValues.hasDayRate ? `₱${watchedValues.dayRate}` : "Not available"}</p>
            <p><strong>Night Rate:</strong> {watchedValues.hasNightRate ? `₱${watchedValues.nightRate}` : "Not available"}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Facilities</h4>
            <p>{watchedValues.facilities?.join(", ") || "None"}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Rooms</h4>
            <p>{watchedValues.rooms?.length || 0} room types configured</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Cottages</h4>
            <p>{watchedValues.cottages?.length || 0} cottage types configured</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Amenities</h4>
            <p>{watchedValues.amenities?.length || 0} amenities configured</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Packages</h4>
            <p>{watchedValues.packages?.length || 0} packages configured</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Contact</h4>
            <p><strong>Phone:</strong> {watchedValues.contact?.phone}</p>
            <p><strong>Email:</strong> {watchedValues.contact?.email}</p>
            <p><strong>Website:</strong> {watchedValues.contact?.website}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium">Images</h4>
            <p>{watchedValues.imageUrls?.length || 0} images uploaded</p>
          </div>
        </div>
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSaveButtonClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsManualSubmit(true);
    // Trigger form submission
    const form = e.currentTarget.closest('form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form className="flex flex-col gap-10" onSubmit={onSubmit} onKeyDown={handleKeyDown}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.id < currentStep ? "bg-green-500 text-white" :
                  step.id === currentStep ? "bg-blue-500 text-white" :
                  "bg-gray-300 text-gray-600"
                }`}>
                  {step.id}
                </div>
                <span className={`mt-2 text-xs text-center ${step.id === currentStep ? "font-semibold text-blue-600" : "text-gray-500"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        {renderCurrentStepSections()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isLoading}
              type="button"
              onClick={handleSaveButtonClick}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-500 text-xl disabled:bg-gray-500"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
};

export default ManageHotelForm;

