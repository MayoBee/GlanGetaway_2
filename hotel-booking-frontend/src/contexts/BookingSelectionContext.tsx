import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { HotelType } from "../../../shared/types";

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
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [selectedCottages, setSelectedCottages] = useState<SelectedCottage[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<SelectedAmenity[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [numberOfNights, setNumberOfNights] = useState<number>(1);
  const [depositPercentage, setDepositPercentage] = useState<number>(50); // Default 50% down payment
  const [selectedRateType, setSelectedRateType] = useState<'day' | 'night'>('night');
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [hotelDiscounts, setHotelDiscounts] = useState<{
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  } | null>(null);
  const [calculatedTotals, setCalculatedTotals] = useState<{
    total: number;
    downPayment: number;
    remaining: number;
    discountAmount: number;
  }>({
    total: 0,
    downPayment: 0,
    remaining: 0,
    discountAmount: 0
  });

  // Trigger recalculation when dependencies change
  const calculateTotal = useCallback(() => {
    const accommodationTotal = 
      selectedRooms.reduce((sum, room) => sum + (room.pricePerNight * (room.units ?? 1) * numberOfNights), 0) +
      selectedCottages.reduce((sum, cottage) => {
        const rate = selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate;
        return sum + (rate * (cottage.units ?? 1) * numberOfNights);
      }, 0);
    
    const amenitiesTotal = selectedAmenities.reduce((sum, amenity) => sum + (amenity.price * (amenity.units ?? 1)), 0);
    const packagesTotal = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
    
    let total = basePrice + accommodationTotal + amenitiesTotal + packagesTotal;
    let discountAmount = 0;
    
    // Apply discount if applicable
    if (discountInfo && hotelDiscounts) {
      const { type } = discountInfo;
      
      if (type === "pwd" && hotelDiscounts.pwdEnabled) {
        discountAmount = Math.round(total * (hotelDiscounts.pwdPercentage / 100));
      } else if (type === "senior_citizen" && hotelDiscounts.seniorCitizenEnabled) {
        discountAmount = Math.round(total * (hotelDiscounts.seniorCitizenPercentage / 100));
      }
      
      total = total - discountAmount;
    }
    
    const downPayment = Math.round(total * (depositPercentage / 100));
    const remaining = total - downPayment;
    
    return {
      total,
      downPayment,
      remaining,
      discountAmount
    };
  }, [selectedRooms, selectedCottages, selectedAmenities, selectedPackages, basePrice, numberOfNights, depositPercentage, selectedRateType, discountInfo, hotelDiscounts]);

  useEffect(() => {
    const result = calculateTotal();
    setCalculatedTotals(result);
  }, [calculateTotal]);

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

  const addRoom = (room: SelectedRoom) => {
    setSelectedRooms(prev => {
      const exists = prev.some(r => r.id === room.id);
      if (exists) return prev;
      return [...prev, room];
    });
  };

  const removeRoom = (roomId: string) => {
    setSelectedRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const addCottage = (cottage: SelectedCottage) => {
    setSelectedCottages(prev => {
      const exists = prev.some(c => c.id === cottage.id);
      if (exists) return prev;
      return [...prev, cottage];
    });
  };

  const removeCottage = (cottageId: string) => {
    setSelectedCottages(prev => prev.filter(cottage => cottage.id !== cottageId));
  };

  const addAmenity = (amenity: SelectedAmenity) => {
    setSelectedAmenities(prev => {
      const exists = prev.some(a => a.id === amenity.id);
      if (exists) return prev;
      return [...prev, amenity];
    });
  };

  const removeAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => prev.filter(amenity => amenity.id !== amenityId));
  };

  const addPackage = (pkg: SelectedPackage) => {
    setSelectedPackages(prev => {
      const exists = prev.some(p => p.id === pkg.id);
      if (exists) return prev;
      return [...prev, pkg];
    });
  };

  const removePackage = (packageId: string) => {
    setSelectedPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  const updateRoomUnits = (roomId: string, units: number) => {
    setSelectedRooms(prev => 
      prev.map(room => 
        room.id === roomId ? { ...room, units } : room
      )
    );
  };

  const updateCottageUnits = (cottageId: string, units: number) => {
    setSelectedCottages(prev => 
      prev.map(cottage => 
        cottage.id === cottageId ? { ...cottage, units } : cottage
      )
    );
  };

  const updateAmenityUnits = (amenityId: string, units: number) => {
    setSelectedAmenities(prev => 
      prev.map(amenity => 
        amenity.id === amenityId ? { ...amenity, units } : amenity
      )
    );
  };

  const clearSelections = () => {
    setSelectedRooms([]);
    setSelectedCottages([]);
    setSelectedAmenities([]);
    setSelectedPackages([]);
  };

  const isRoomSelected = (roomId: string) => {
    return selectedRooms.some(room => room.id === roomId);
  };

  const isCottageSelected = (cottageId: string) => {
    return selectedCottages.some(cottage => cottage.id === cottageId);
  };

  const isAmenitySelected = (amenityId: string) => {
    return selectedAmenities.some(amenity => amenity.id === amenityId);
  };

  const isPackageSelected = (packageId: string) => {
    return selectedPackages.some(pkg => pkg.id === packageId);
  };

  const setRateType = (rateType: 'day' | 'night') => {
    setSelectedRateType(rateType);
  };

  const updateDepositPercentageFromHotel = (hotel: HotelType) => {
    if (hotel.downPaymentPercentage) {
      setDepositPercentage(hotel.downPaymentPercentage);
    }
  };

  const value: BookingSelectionContextType = {
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
  };

  return (
    <BookingSelectionContext.Provider value={value}>
      {children}
    </BookingSelectionContext.Provider>
  );
};

export default BookingSelectionProvider;
