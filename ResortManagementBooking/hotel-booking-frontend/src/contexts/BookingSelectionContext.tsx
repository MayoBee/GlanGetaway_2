import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { HotelType } from "../../../shared/types";
import { PricingEngine, type HotelDiscounts, type PricingInputs } from "../utils/pricingEngine";

// LocalStorage keys for persistence
const BOOKING_SELECTION_KEY = 'glan_booking_selection';
const BOOKING_SELECTION_VERSION = '1.0';

// Helper functions for localStorage persistence
const saveToLocalStorage = (data: any) => {
  try {
    const payload = {
      version: BOOKING_SELECTION_VERSION,
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(BOOKING_SELECTION_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to save booking selection to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(BOOKING_SELECTION_KEY);
    if (!stored) return null;
    
    const payload = JSON.parse(stored);
    
    // Check version and timestamp (expire after 24 hours)
    if (payload.version !== BOOKING_SELECTION_VERSION) {
      localStorage.removeItem(BOOKING_SELECTION_KEY);
      return null;
    }
    
    const age = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > maxAge) {
      localStorage.removeItem(BOOKING_SELECTION_KEY);
      return null;
    }
    
    return payload.data;
  } catch (error) {
    console.warn('Failed to load booking selection from localStorage:', error);
    localStorage.removeItem(BOOKING_SELECTION_KEY);
    return null;
  }
};

const clearBookingSelectionStorage = () => {
  try {
    localStorage.removeItem(BOOKING_SELECTION_KEY);
  } catch (error) {
    console.warn('Failed to clear booking selection from localStorage:', error);
  }
};

export interface SelectedRoom {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  maxOccupancy: number;
  units: number;
  description?: string;
}

export interface SelectedCottage {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  dayRate: number;
  nightRate: number;
  hasDayRate: boolean;
  hasNightRate: boolean;
  maxOccupancy: number;
  units: number;
  description?: string;
}

export interface SelectedAmenity {
  id: string;
  name: string;
  price: number;
  units: number;
  description?: string;
}

export interface SelectedPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  includedCottages: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    dayRate: number;
    nightRate: number;
    hasDayRate: boolean;
    hasNightRate: boolean;
    maxOccupancy: number;
    description?: string;
  }>;
  includedRooms: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    description?: string;
  }>;
  includedAmenities: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  includedAdultEntranceFee: boolean;
  includedChildEntranceFee: boolean;
}

export interface DiscountInfo {
  type: "pwd" | "senior_citizen" | null;
  percentage: number;
  amount: number;
}

interface BookingSelectionContextType {
  selectedRooms: SelectedRoom[];
  selectedCottages: SelectedCottage[];
  selectedAmenities: SelectedAmenity[];
  selectedPackages: SelectedPackage[];
  basePrice: number;
  accommodationTotal: number;
  amenitiesTotal: number;
  packagesTotal: number;
  totalCost: number;
  downPaymentAmount: number;
  remainingAmount: number;
  numberOfNights: number;
  depositPercentage: number;
  selectedRateType: 'day' | 'night';
  discountInfo: DiscountInfo | null;
  hotelDiscounts: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  } | null;
  addRoom: (room: SelectedRoom) => void;
  removeRoom: (roomId: string) => void;
  addCottage: (cottage: SelectedCottage) => void;
  removeCottage: (cottageId: string) => void;
  addAmenity: (amenity: SelectedAmenity) => void;
  removeAmenity: (amenityId: string) => void;
  addPackage: (pkg: SelectedPackage) => void;
  removePackage: (packageId: string) => void;
  updateRoomUnits: (roomId: string, units: number) => void;
  updateCottageUnits: (cottageId: string, units: number) => void;
  updateAmenityUnits: (amenityId: string, units: number) => void;
  clearSelections: () => void;
  setBasePrice: (price: number) => void;
  setNumberOfNights: (nights: number) => void;
  setDepositPercentage: (percentage: number) => void;
  setRateType: (rateType: 'day' | 'night') => void;
  calculateTotal: () => void;
  isRoomSelected: (roomId: string) => boolean;
  isCottageSelected: (cottageId: string) => boolean;
  isAmenitySelected: (amenityId: string) => boolean;
  isPackageSelected: (packageId: string) => boolean;
  updateDepositPercentageFromHotel: (hotel: HotelType) => void;
  setDiscountInfo: (discountInfo: DiscountInfo | null) => void;
  setHotelDiscounts: (discounts: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  } | null) => void;
}

const BookingSelectionContext = createContext<BookingSelectionContextType | undefined>(undefined);

export const useBookingSelection = () => {
  const context = useContext(BookingSelectionContext);
  if (!context) {
    throw new Error("useBookingSelection must be used within BookingSelectionProvider");
  }
  return context;
};

interface BookingSelectionProviderProps {
  children: ReactNode;
}

export const BookingSelectionProvider: React.FC<BookingSelectionProviderProps> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const persistedData = loadFromLocalStorage();
  
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>(persistedData?.selectedRooms || []);
  const [selectedCottages, setSelectedCottages] = useState<SelectedCottage[]>(persistedData?.selectedCottages || []);
  const [selectedAmenities, setSelectedAmenities] = useState<SelectedAmenity[]>(persistedData?.selectedAmenities || []);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>(persistedData?.selectedPackages || []);
  const [basePrice, setBasePrice] = useState<number>(persistedData?.basePrice || 0);
  const [numberOfNights, setNumberOfNights] = useState<number>(persistedData?.numberOfNights || 1);
  const [depositPercentage, setDepositPercentage] = useState<number>(persistedData?.depositPercentage || 50); // Default 50% down payment
  const [selectedRateType, setSelectedRateType] = useState<'day' | 'night'>(persistedData?.selectedRateType || 'night');
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(persistedData?.discountInfo || null);
  const [hotelDiscounts, setHotelDiscounts] = useState<{
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  } | null>(persistedData?.hotelDiscounts || null);
  const [calculatedTotals, setCalculatedTotals] = useState<{
    total: number;
    downPayment: number;
    remaining: number;
    discountAmount: number;
  }>(persistedData?.calculatedTotals || {
    total: 0,
    downPayment: 0,
    remaining: 0,
    discountAmount: 0
  });

  // Trigger recalculation when dependencies change using centralized pricing engine
  const calculateTotal = useCallback(() => {
    const accommodationTotal = 
      selectedRooms.reduce((sum, room) => sum + (room.pricePerNight * (room.units ?? 1) * numberOfNights), 0) +
      selectedCottages.reduce((sum, cottage) => {
        const rate = selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate;
        return sum + (rate * (cottage.units ?? 1) * numberOfNights);
      }, 0);
    
    const amenitiesTotal = selectedAmenities.reduce((sum, amenity) => sum + (amenity.price * (amenity.units ?? 1)), 0);
    const packagesTotal = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
    
    const pricingInputs: PricingInputs = {
      basePrice,
      accommodationTotal,
      amenitiesTotal,
      packagesTotal,
      numberOfNights,
      depositPercentage,
      discountInfo,
      hotelDiscounts
    };
    
    return PricingEngine.calculateTotal(pricingInputs);
  }, [selectedRooms, selectedCottages, selectedAmenities, selectedPackages, basePrice, numberOfNights, depositPercentage, selectedRateType, discountInfo, hotelDiscounts]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const result = calculateTotal();
    setCalculatedTotals(result);
  }, [calculateTotal]);

  // Persist state to localStorage
  useEffect(() => {
    const stateToSave = {
      selectedRooms,
      selectedCottages,
      selectedAmenities,
      selectedPackages,
      basePrice,
      numberOfNights,
      depositPercentage,
      selectedRateType,
      discountInfo,
      hotelDiscounts,
      calculatedTotals
    };
    saveToLocalStorage(stateToSave);
  }, [selectedRooms, selectedCottages, selectedAmenities, selectedPackages, basePrice, numberOfNights, depositPercentage, selectedRateType, discountInfo, hotelDiscounts, calculatedTotals]);

  const accommodationTotal = 
    selectedRooms.reduce((sum, room) => sum + (room.pricePerNight * (room.units ?? 1) * numberOfNights), 0) +
    selectedCottages.reduce((sum, cottage) => {
      const rate = selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate;
      return sum + (rate * (cottage.units ?? 1) * numberOfNights);
    }, 0);

  const amenitiesTotal = selectedAmenities.reduce((sum, amenity) => sum + (amenity.price * (amenity.units ?? 1)), 0);
  const packagesTotal = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);

  const totalCost = calculatedTotals.total;
  const downPaymentAmount = calculatedTotals.downPayment;
  const remainingAmount = calculatedTotals.remaining;

  const addRoom = useCallback((room: SelectedRoom) => {
    setSelectedRooms(prev => {
      const exists = prev.some(r => r.id === room.id);
      if (exists) return prev;
      return [...prev, room];
    });
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setSelectedRooms(prev => prev.filter(r => r.id !== roomId));
  }, []);

  const addCottage = useCallback((cottage: SelectedCottage) => {
    setSelectedCottages(prev => {
      const exists = prev.some(c => c.id === cottage.id);
      if (exists) return prev;
      return [...prev, cottage];
    });
  }, []);

  const removeCottage = useCallback((cottageId: string) => {
    setSelectedCottages(prev => prev.filter(cottage => cottage.id !== cottageId));
  }, []);

  const addAmenity = useCallback((amenity: SelectedAmenity) => {
    setSelectedAmenities(prev => {
      const exists = prev.some(a => a.id === amenity.id);
      if (exists) return prev;
      return [...prev, amenity];
    });
  }, []);

  const removeAmenity = useCallback((amenityId: string) => {
    setSelectedAmenities(prev => prev.filter(amenity => amenity.id !== amenityId));
  }, []);

  const addPackage = useCallback((pkg: SelectedPackage) => {
    setSelectedPackages(prev => {
      const exists = prev.some(p => p.id === pkg.id);
      if (exists) return prev;
      return [...prev, pkg];
    });
  }, []);

  const removePackage = useCallback((packageId: string) => {
    setSelectedPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  }, []);

  const updateRoomUnits = useCallback((roomId: string, units: number) => {
    setSelectedRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, units } : room
      )
    );
  }, []);

  const updateCottageUnits = useCallback((cottageId: string, units: number) => {
    setSelectedCottages(prev =>
      prev.map(cottage =>
        cottage.id === cottageId ? { ...cottage, units } : cottage
      )
    );
  }, []);

  const updateAmenityUnits = useCallback((amenityId: string, units: number) => {
    setSelectedAmenities(prev =>
      prev.map(amenity =>
        amenity.id === amenityId ? { ...amenity, units } : amenity
      )
    );
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedRooms([]);
    setSelectedCottages([]);
    setSelectedAmenities([]);
    setSelectedPackages([]);
    // Also clear localStorage
    clearBookingSelectionStorage();
  }, []);

  const isRoomSelected = useCallback((roomId: string) => {
    return selectedRooms.some(room => room.id === roomId);
  }, [selectedRooms]);

  const isCottageSelected = useCallback((cottageId: string) => {
    return selectedCottages.some(cottage => cottage.id === cottageId);
  }, [selectedCottages]);

  const isAmenitySelected = useCallback((amenityId: string) => {
    return selectedAmenities.some(amenity => amenity.id === amenityId);
  }, [selectedAmenities]);

  const isPackageSelected = useCallback((packageId: string) => {
    return selectedPackages.some(pkg => pkg.id === packageId);
  }, [selectedPackages]);

  const setRateType = useCallback((rateType: 'day' | 'night') => {
    setSelectedRateType(rateType);
  }, []);

  const updateDepositPercentageFromHotel = useCallback((hotel: HotelType) => {
    if (hotel.downPaymentPercentage) {
      setDepositPercentage(hotel.downPaymentPercentage);
    }

    // Update hotel discounts if available
    if (hotel.discounts) {
      const validDiscounts = PricingEngine.validateDiscountConfig(hotel.discounts);
      if (validDiscounts) {
        setHotelDiscounts(hotel.discounts);
      }
    } else {
      // Set default discounts if hotel doesn't have any
      setHotelDiscounts(PricingEngine.getDefaultDiscounts());
    }
  }, []);

  const value: BookingSelectionContextType = useMemo(() => ({
    selectedRooms,
    selectedCottages,
    selectedAmenities,
    selectedPackages,
    basePrice,
    accommodationTotal,
    amenitiesTotal,
    packagesTotal,
    totalCost,
    downPaymentAmount,
    remainingAmount,
    numberOfNights,
    depositPercentage,
    selectedRateType,
    discountInfo,
    hotelDiscounts,
    addRoom,
    removeRoom,
    addCottage,
    removeCottage,
    addAmenity,
    removeAmenity,
    addPackage,
    removePackage,
    updateRoomUnits,
    updateCottageUnits,
    updateAmenityUnits,
    clearSelections,
    setBasePrice,
    setNumberOfNights,
    setDepositPercentage,
    setRateType,
    calculateTotal,
    isRoomSelected,
    isCottageSelected,
    isAmenitySelected,
    isPackageSelected,
    updateDepositPercentageFromHotel,
    setDiscountInfo,
    setHotelDiscounts,
  }), [
    selectedRooms,
    selectedCottages,
    selectedAmenities,
    selectedPackages,
    basePrice,
    accommodationTotal,
    amenitiesTotal,
    packagesTotal,
    totalCost,
    downPaymentAmount,
    remainingAmount,
    numberOfNights,
    depositPercentage,
    selectedRateType,
    discountInfo,
    hotelDiscounts,
    addRoom,
    removeRoom,
    addCottage,
    removeCottage,
    addAmenity,
    removeAmenity,
    addPackage,
    removePackage,
    updateRoomUnits,
    updateCottageUnits,
    updateAmenityUnits,
    clearSelections,
    setBasePrice,
    setNumberOfNights,
    setDepositPercentage,
    setRateType,
    calculateTotal,
    isRoomSelected,
    isCottageSelected,
    isAmenitySelected,
    isPackageSelected,
    updateDepositPercentageFromHotel,
    setDiscountInfo,
    setHotelDiscounts,
  ]);

  return (
    <BookingSelectionContext.Provider value={value}>
      {children}
    </BookingSelectionContext.Provider>
  );
};

export default BookingSelectionProvider;

