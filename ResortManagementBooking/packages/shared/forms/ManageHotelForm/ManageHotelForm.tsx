import { useForm, FormProvider } from "react-hook-form";
import { useEffect } from "react";
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
import { HotelType } from "../../../../shared/types";

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
  const formMethods = useForm<HotelFormData>({
    mode: 'onChange',
    shouldFocusError: true,
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
      adultEntranceFee: {
        dayRate: 0,
        nightRate: 0,
        pricingModel: "per_head",
        groupQuantity: 1,
      },
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
      
      // Ensure contact and policies are properly initialized
      const formData = {
        ...mergedHotelData,
        // Handle the new day/night rate fields with fallbacks
        dayRate: mergedHotelData.dayRate || 0,
        nightRate: mergedHotelData.nightRate || 0,
        hasDayRate: mergedHotelData.hasDayRate !== undefined ? mergedHotelData.hasDayRate : false,
        hasNightRate: mergedHotelData.hasNightRate !== undefined ? mergedHotelData.hasNightRate : false,
        dayRateCheckInTime: (mergedHotelData as any).dayRateCheckInTime || "08:00 AM",
        dayRateCheckOutTime: (mergedHotelData as any).dayRateCheckOutTime || "05:00 PM",
        nightRateCheckInTime: (mergedHotelData as any).nightRateCheckInTime || "02:00 PM",
        nightRateCheckOutTime: (mergedHotelData as any).nightRateCheckOutTime || "02:00 PM",
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
        adultEntranceFee: mergedHotelData.adultEntranceFee || {
          dayRate: 0,
          nightRate: 0,
          pricingModel: "per_head",
          groupQuantity: 1,
        },
        childEntranceFee: preserveConfirmedStates(
          currentValues.childEntranceFee || [],
          mergedHotelData.childEntranceFee || []
        ),
        imageUrls: mergedHotelData.imageUrls || [],
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

  const handleSave = async (formDataJson: HotelFormData) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Complete form data:', JSON.stringify(formDataJson, null, 2));
    
    // Extract and save units data to local storage (for persistence when backend doesn't handle it)
    const hotelId = (formDataJson as any)._id || 'new_hotel';
    extractUnitsFromFormData(formDataJson, hotelId);
    
    // Convert units from strings to numbers for cottages and amenities
    const processedData = {
      ...formDataJson,
      amenities: formDataJson.amenities?.map(amenity => ({
        ...amenity,
        units: parseInt(String(amenity.units)) || 1
      })),
      cottages: formDataJson.cottages?.map(cottage => ({
        ...cottage,
        units: parseInt(String(cottage.units)) || 1
      })),
      // Rooms units are already numbers, but ensure consistency
      rooms: formDataJson.rooms?.map(room => ({
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

    // For JSON endpoint, send data directly as JSON
    // This bypasses FormData issues and ensures rooms/cottages/packages are preserved
    onSave(processedData);
  };

  const onSubmit = handleSubmit(handleSave);

  return (
    <FormProvider {...formMethods}>
      <form className="flex flex-col gap-10" onSubmit={onSubmit}>
        <DetailsSection />
        <GuestsSection />
        <TypeSection />
        <FacilitiesSection />
        <FreshRoomsSection />
        <FreshCottagesSection />
        <AmenitiesSection />
        <FreshPackagesSection />
        <ContactSection />
        <PoliciesSection />
        <PaymentModuleSection />
        <DiscountsSection />
        <ImagesSection />
        <span className="flex justify-end">
          <button
            disabled={isLoading}
            type="submit"
            className="bg-blue-600 text-white  px-6 py-2 rounded-lg font-semibold hover:bg-blue-500 text-xl disabled:bg-gray-500"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </span>
      </form>
    </FormProvider>
  );
};

export default ManageHotelForm;
