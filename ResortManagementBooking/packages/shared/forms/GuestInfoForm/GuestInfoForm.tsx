import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useSearchContext from "../../hooks/useSearchContext";
import useAppContext from "../../hooks/useAppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Calendar, Users, User, Baby, CreditCard, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useBookingSelection } from "../../contexts/BookingSelectionContext";
import BookingSummary from "../../components/BookingSummary";
import * as apiClient from "../../api-client";
import { useQuery } from "react-query";

type Props = {
  hotelId: string;
  pricePerNight: number;
  initialRateType?: 'day' | 'night';
  editMode?: boolean;
  bookingId?: string;
  bookingData?: any;
};

type GuestInfoFormData = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  seniorCount: number;
  pwdCount: number;
};

const GuestInfoForm = ({ 
  hotelId, 
  pricePerNight, 
  initialRateType = 'night', 
  editMode = false, 
  bookingId, 
  bookingData 
}: Props) => {
  const search = useSearchContext();
  const { isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch hotel data to get entrance fees
  const { data: hotel } = useQuery(
    "fetchHotelById",
    () => apiClient.fetchHotelById(hotelId),
    {
      enabled: !!hotelId,
    }
  );

  const { 
    setBasePrice, 
    setNumberOfNights, 
    totalCost, 
    selectedRooms, 
    selectedCottages, 
    selectedAmenities,
    clearSelections,
    selectedRateType,
    setRateType
  } = useBookingSelection();

  // Time state variables - initialize with booking data if in edit mode
  const [checkInTime, setCheckInTime] = useState<string>(
    editMode && bookingData?.checkInTime ? bookingData.checkInTime : search.checkInTime
  );
  const [checkOutTime, setCheckOutTime] = useState<string>(
    editMode && bookingData?.checkOutTime ? bookingData.checkOutTime : search.checkOutTime
  );
  const [childAges, setChildAges] = useState<number[]>(() => []);
  
  // Senior/PWD verification state - initialize with booking data if in edit mode
  const [hasSeniorGuest, setHasSeniorGuest] = useState<boolean>(
    editMode ? (bookingData?.isSeniorCitizenBooking || false) : (search.seniorCount > 0)
  );
  const [hasPwdGuest, setHasPwdGuest] = useState<boolean>(
    editMode ? (bookingData?.isPwdBooking || false) : (search.pwdCount > 0)
  );
  const [seniorCount, setSeniorCount] = useState<number>(
    editMode ? (bookingData?.isSeniorCitizenBooking ? 1 : 0) : search.seniorCount
  );
  const [pwdCount, setPwdCount] = useState<number>(
    editMode ? (bookingData?.isPwdBooking ? 1 : 0) : search.pwdCount
  );
  
  // Verification files state
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);

  // Rate type state - use from context instead of local state
  const [selectedNights, setSelectedNights] = useState<number>(1);

  // Initialize form with booking data if in edit mode
  const getDefaultValues = () => {
    if (editMode && bookingData) {
      return {
        checkIn: new Date(bookingData.checkIn),
        checkOut: new Date(bookingData.checkOut),
        adultCount: bookingData.adultCount || 1,
        childCount: bookingData.childCount || 0,
        seniorCount: bookingData.isSeniorCitizenBooking ? 1 : 0,
        pwdCount: bookingData.isPwdBooking ? 1 : 0,
      };
    }
    return {
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adultCount: search.adultCount,
      childCount: search.childCount,
      seniorCount: search.seniorCount,
      pwdCount: search.pwdCount,
    };
  };

  // Calculate entrance fee total based on adults, children, and their ages
  const calculateEntranceFeeTotal = () => {
    if (!hotel) return 0;

    let total = 0;
    const rate = selectedRateType === 'day' ? 'dayRate' : 'nightRate';

    // Adult entrance fees
    if (hotel.adultEntranceFee && hotel.adultEntranceFee[rate] > 0) {
      if (hotel.adultEntranceFee.pricingModel === 'per_group') {
        // Per group pricing - one charge covers groupQuantity people
        const groupsNeeded = Math.ceil(adultCount / (hotel.adultEntranceFee.groupQuantity || 1));
        total += groupsNeeded * hotel.adultEntranceFee[rate];
      } else {
        // Per head pricing
        total += adultCount * hotel.adultEntranceFee[rate];
      }
    }

    // Child entrance fees
    if (hotel.childEntranceFee && hotel.childEntranceFee.length > 0) {
      childAges.forEach((age) => {
        // Find the appropriate age group for this child
        const ageGroup = hotel.childEntranceFee?.find(
          (group) => age >= group.minAge && age <= group.maxAge
        );
        
        if (ageGroup) {
          // Child falls within a defined age group
          if (ageGroup[rate] > 0) {
            if (ageGroup.pricingModel === 'per_group') {
              // Per group pricing - one charge covers groupQuantity people
              const groupsNeeded = Math.ceil(1 / (ageGroup.groupQuantity || 1));
              total += groupsNeeded * ageGroup[rate];
            } else {
              // Per head pricing
              total += ageGroup[rate];
            }
          }
          // If ageGroup[rate] is 0, it means free entrance for this age group
        } else {
          // Child does not fall within any defined age group - charge adult rate
          if (hotel.adultEntranceFee && hotel.adultEntranceFee[rate] > 0) {
            if (hotel.adultEntranceFee.pricingModel === 'per_group') {
              // Per group pricing - one charge covers groupQuantity people
              const groupsNeeded = Math.ceil(1 / (hotel.adultEntranceFee.groupQuantity || 1));
              total += groupsNeeded * hotel.adultEntranceFee[rate];
            } else {
              // Per head pricing
              total += hotel.adultEntranceFee[rate];
            }
          }
        }
      });
    } else if (childCount > 0 && hotel.adultEntranceFee && hotel.adultEntranceFee[rate] > 0) {
      // No child age groups defined but there are children - charge all children adult rates
      if (hotel.adultEntranceFee.pricingModel === 'per_group') {
        // Per group pricing - one charge covers groupQuantity people
        const groupsNeeded = Math.ceil(childCount / (hotel.adultEntranceFee.groupQuantity || 1));
        total += groupsNeeded * hotel.adultEntranceFee[rate];
      } else {
        // Per head pricing
        total += childCount * hotel.adultEntranceFee[rate];
      }
    }

    return total;
  };

  // Determine available rate types based on entrance fees
  const hasDayRate = hotel?.adultEntranceFee?.dayRate && hotel.adultEntranceFee.dayRate > 0 || 
                    hotel?.childEntranceFee?.some(child => child.dayRate > 0);
  const hasNightRate = hotel?.adultEntranceFee?.nightRate && hotel.adultEntranceFee.nightRate > 0 || 
                     hotel?.childEntranceFee?.some(child => child.nightRate > 0);

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestInfoFormData>({
    defaultValues: getDefaultValues(),
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const adultCount = watch("adultCount");
  const childCount = watch("childCount");

  // Calculate number of nights for display
  if (checkIn && checkOut) {
    const diff = checkOut.getTime() - checkIn.getTime();
    Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Calculate number of nights and update booking context
  useEffect(() => {
    let nights = 1;
    if (checkIn && checkOut) {
      const diff = checkOut.getTime() - checkIn.getTime();
      nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    // Use entrance fees for base price calculation
    const entranceFeeTotal = calculateEntranceFeeTotal();
    const basePrice = entranceFeeTotal;
    setBasePrice(basePrice);
    setNumberOfNights(nights);
  }, [checkIn, checkOut, adultCount, childCount, childAges, selectedRateType, hotel, setBasePrice, setNumberOfNights]);

  // Update child ages when child count changes
  useEffect(() => {
    if (childCount > childAges.length) {
      setChildAges((prev) => [
        ...prev,
        ...Array(childCount - prev.length).fill(1),
      ]);
    } else if (childCount < childAges.length) {
      setChildAges((prev) => prev.slice(0, childCount));
    }
  }, [childCount, childAges.length]);

  // Update local rate type when context changes
  useEffect(() => {
    if (selectedRateType !== undefined) {
      // Context rate type takes precedence
    }
  }, [selectedRateType]);

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const onSignInClick = (data: GuestInfoFormData) => {
    search.saveSearchValues(
      "",
      data.checkIn,
      data.checkOut,
      data.adultCount,
      data.childCount,
      childAges,
      checkInTime,
      checkOutTime,
      "PM",
      "AM",
      seniorCount,
      pwdCount
    );
    navigate("/sign-in", { state: { from: location } });
  };

  const onSubmit = async (data: GuestInfoFormData) => {
    if (editMode && bookingId) {
      // Edit mode - update existing booking
      try {
        const updatedBookingData = {
          firstName: bookingData?.firstName || '',
          lastName: bookingData?.lastName || '',
          email: bookingData?.email || '',
          phone: bookingData?.phone || '',
          adultCount: data.adultCount,
          childCount: data.childCount,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          checkInTime,
          checkOutTime,
          specialRequests: bookingData?.specialRequests || '',
          isPwdBooking: hasPwdGuest,
          isSeniorCitizenBooking: hasSeniorGuest,
          selectedRooms,
          selectedCottages,
          selectedAmenities,
        };

        await apiClient.updateBooking(bookingId, updatedBookingData);
        alert("Booking updated successfully!");
        navigate("/my-bookings");
      } catch (error: any) {
        console.error("Error updating booking:", error);
        alert(error.response?.data?.message || "Failed to update booking. Please try again.");
      }
    } else {
      // New booking mode - proceed to booking page
      search.saveSearchValues(
        "",
        data.checkIn,
        data.checkOut,
        data.adultCount,
        data.childCount,
        childAges,
        checkInTime,
        checkOutTime,
        "PM",
        "AM",
        seniorCount,
        pwdCount
      );
      navigate(`/hotel/${hotelId}/booking`);
    }
  };


  return (
    <>
      <style>
        {`
          .react-datepicker {
            background-color: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            font-family: inherit !important;
          }
          .react-datepicker__header {
            background-color: #f8fafc !important;
            border-bottom: 1px solid #e5e7eb !important;
            border-radius: 8px 8px 0 0 !important;
          }
          .react-datepicker__current-month {
            color: #374151 !important;
            font-weight: 600 !important;
          }
          .react-datepicker__day-name {
            color: #6b7280 !important;
            font-weight: 500 !important;
          }
          .react-datepicker__day {
            color: #374151 !important;
            border-radius: 6px !important;
            margin: 2px !important;
          }
          .react-datepicker__day:hover {
            background-color: #dbeafe !important;
            color: #1e40af !important;
          }
          .react-datepicker__day--selected {
            background-color: #3b82f6 !important;
            color: white !important;
          }
          .react-datepicker__day--in-range {
            background-color: #dbeafe !important;
            color: #1e40af !important;
          }
          .react-datepicker__day--keyboard-selected {
            background-color: #3b82f6 !important;
            color: white !important;
          }
          .react-datepicker__day--outside-month {
            color: #9ca3af !important;
          }
          .react-datepicker__navigation {
            color: #6b7280 !important;
          }
          .react-datepicker__navigation:hover {
            color: #374151 !important;
          }
        `}
      </style>
      <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>{editMode ? "Edit Booking" : "Booking Summary"}</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {selectedRateType === 'day' ? 'Day Rate' : 'Night Rate'}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price Display */}
          <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                Entrance Fees ({selectedRateType === 'day' ? 'Day' : 'Night'})
                {totalCost > calculateEntranceFeeTotal() && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200 ml-2">
                    + Extras
                  </Badge>
                )}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ₱{totalCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Booking Summary */}
          <BookingSummary />

          <form
            onSubmit={
              isLoggedIn ? handleSubmit(onSubmit) : handleSubmit(onSignInClick)
            }
            className="space-y-4"
          >
            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                {selectedRateType === 'day' ? 'Select Check-in Date' : 'Select Dates'}
              </Label>

              {selectedRateType === 'day' ? (
                // Day Rate: Check-in only, checkout fixed at 5PM
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <DatePicker
                      required
                      selected={checkIn}
                      onChange={(date) => {
                        setValue("checkIn", date as Date);
                        // For day rate, set checkout to same date at 5PM
                        const checkoutDate = new Date(date as Date);
                        checkoutDate.setHours(17, 0, 0, 0); // 5:00 PM
                        setValue("checkOut", checkoutDate);
                        setCheckOutTime("17:00");
                      }}
                      minDate={minDate}
                      maxDate={maxDate}
                      placeholderText="Check-in Date"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      wrapperClassName="w-full"
                    />
                    <div className="mt-2">
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Day Rate:</strong> Check-out is automatically set to 5:00 PM
                    </p>
                  </div>
                </div>
              ) : (
                // Night Rate: Check-in/Check-out with quantity adjustment
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <DatePicker
                        required
                        selected={checkIn}
                        onChange={(date) => {
                          setValue("checkIn", date as Date);
                          // Auto-calculate checkout based on number of nights
                          const checkoutDate = new Date(date as Date);
                          checkoutDate.setDate(checkoutDate.getDate() + selectedNights);
                          setValue("checkOut", checkoutDate);
                        }}
                        minDate={minDate}
                        maxDate={maxDate}
                        placeholderText="Check-in Date"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        wrapperClassName="w-full"
                      />
                      <div className="mt-2">
                        <input
                          type="time"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <DatePicker
                        required
                        selected={checkOut}
                        onChange={(date) => {
                          setValue("checkOut", date as Date);
                          // Recalculate number of nights
                          if (checkIn && date) {
                            const nights = Math.max(1, Math.ceil((date.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                            setSelectedNights(nights);
                          }
                        }}
                        minDate={checkIn || minDate}
                        placeholderText="Check-out Date"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        wrapperClassName="w-full"
                      />
                      <div className="mt-2">
                        <input
                          type="time"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Night Quantity Adjustment */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Label className="text-sm font-medium text-green-700 mb-3 block">
                      Number of Nights
                    </Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          const newNights = Math.max(1, selectedNights - 1);
                          setSelectedNights(newNights);
                          if (checkIn) {
                            const checkoutDate = new Date(checkIn);
                            checkoutDate.setDate(checkoutDate.getDate() + newNights);
                            setValue("checkOut", checkoutDate);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-green-700 min-w-[60px] text-center">
                        {selectedNights} {selectedNights === 1 ? 'night' : 'nights'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newNights = selectedNights + 1;
                          setSelectedNights(newNights);
                          if (checkIn) {
                            const checkoutDate = new Date(checkIn);
                            checkoutDate.setDate(checkoutDate.getDate() + newNights);
                            setValue("checkOut", checkoutDate);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Each night = 24 hours. Total entrance fees: ₱{calculateEntranceFeeTotal().toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>


            {/* Guest Count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Guest Information
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Adults
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-full">
                    <button
                      type="button"
                      onClick={() => setValue("adultCount", Math.max(1, adultCount - 1))}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {adultCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue("adultCount", adultCount + 1)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="hidden"
                    {...register("adultCount", {
                      required: "This field is required",
                      min: {
                        value: 1,
                        message: "There must be at least one adult",
                      },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.adultCount && (
                    <span className="text-red-500 text-xs">
                      {errors.adultCount.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Children
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-full">
                    <button
                      type="button"
                      onClick={() => setValue("childCount", Math.max(0, childCount - 1))}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {childCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue("childCount", childCount + 1)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="hidden"
                    {...register("childCount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              {/* Child age selectors */}
              {childCount > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {childAges.map((age, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Child {idx + 1} age
                      </label>
                      <select
                        value={age}
                        onChange={(e) => {
                          const newAges = [...childAges];
                          newAges[idx] = parseInt(e.target.value);
                          setChildAges(newAges);
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n} yr{n > 1 ? "s" : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Senior/PWD Guest Verification Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Guest Discount Verification
              </Label>
              
              <p className="text-xs text-gray-500">
                Select if any guest is a Senior Citizen or Person with Disability (PWD) to avail of discounts. 
                Valid ID must be presented upon check-in.
              </p>

              {/* Senior Citizen Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <input
                  type="checkbox"
                  id="hasSeniorGuest"
                  checked={hasSeniorGuest}
                  onChange={(e) => {
                    setHasSeniorGuest(e.target.checked);
                    if (!e.target.checked) {
                      setSeniorCount(0);
                    } else if (seniorCount === 0) {
                      setSeniorCount(1);
                    }
                  }}
                  className="h-4 w-4 text-amber-600"
                />
                <label htmlFor="hasSeniorGuest" className="flex-1 cursor-pointer">
                  <span className="font-medium text-amber-800">Senior Citizen</span>
                  <span className="text-xs text-amber-600 block">20% discount</span>
                </label>
                {hasSeniorGuest && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeniorCount(Math.max(0, seniorCount - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded hover:bg-amber-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{seniorCount}</span>
                    <button
                      type="button"
                      onClick={() => setSeniorCount(Math.min(adultCount + childCount, seniorCount + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded hover:bg-amber-300"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* PWD Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  id="hasPwdGuest"
                  checked={hasPwdGuest}
                  onChange={(e) => {
                    setHasPwdGuest(e.target.checked);
                    if (!e.target.checked) {
                      setPwdCount(0);
                    } else if (pwdCount === 0) {
                      setPwdCount(1);
                    }
                  }}
                  className="h-4 w-4 text-purple-600"
                />
                <label htmlFor="hasPwdGuest" className="flex-1 cursor-pointer">
                  <span className="font-medium text-purple-800">Person with Disability (PWD)</span>
                  <span className="text-xs text-purple-600 block">20% discount</span>
                </label>
                {hasPwdGuest && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPwdCount(Math.max(0, pwdCount - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-purple-200 rounded hover:bg-purple-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{pwdCount}</span>
                    <button
                      type="button"
                      onClick={() => setPwdCount(Math.min(adultCount + childCount, pwdCount + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-purple-200 rounded hover:bg-purple-300"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Verification Layer */}
              {(seniorCount > 0 || pwdCount > 0) && (
                <div className="mt-4 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-2">Verification Instructions</h4>
                        <p className="text-sm text-amber-700 mb-3">
                          Send a PDF or DOCX file containing the following:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                          <li><strong>Full names</strong> of Senior Citizens/PWDs (organized by person based on the quantity you specified above)</li>
                          <li><strong>Clear pictures</strong> of each person holding their National ID or PWD ID</li>
                        </ol>
                        <p className="text-sm text-amber-600 mt-3 font-medium">
                          ⚠️ Final downpayment confirmation will be pending until the resort owner verifies the legitimacy of your submitted document.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verificationFiles" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Verification Document
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        id="verificationFiles"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setVerificationFiles(files);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="verificationFiles"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {verificationFiles.length > 0 
                            ? `${verificationFiles.length} file(s) selected`
                            : "Click to upload PDF or DOCX files"
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          Maximum file size: 10MB per file
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {verificationFiles.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Documents uploaded successfully</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Discount amount: ₱{(calculateEntranceFeeTotal() * (seniorCount + pwdCount) * 0.2).toFixed(2)} ({seniorCount + pwdCount} guests × 20%)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {editMode ? "Update Booking" : "Book Now"}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign in to Book
                </div>
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Free cancellation • No booking fees • Instant confirmation
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default GuestInfoForm;
