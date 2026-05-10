import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import EnhancedBookingForm from "../forms/BookingForm/EnhancedBookingForm";
import useSearchContext from "../hooks/useSearchContext";
import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useBookingSelection } from "../contexts/BookingSelectionContext";
import { Elements } from "@stripe/react-stripe-js";
import useAppContext from "../hooks/useAppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/ui/card";
import { Badge } from "../shared/ui/badge";
import { Loader2, CreditCard, Calendar, Users } from "lucide-react";

const Booking = () => {
  console.log("Booking component rendering...");
  const { stripePromise, showToast } = useAppContext();
  const search = useSearchContext();
  const { hotelId } = useParams();
  
  console.log("Booking data:", { hotelId, search });
  
  const { 
    totalCost, 
    downPaymentAmount,
    remainingAmount,
    selectedRooms, 
    selectedCottages, 
    selectedAmenities,
    selectedPackages,
    setBasePrice,
    setNumberOfNights,
    selectedRateType,
    setRateType,
    updateDepositPercentageFromHotel
  } = useBookingSelection();

  console.log("Booking selection data:", { 
    totalCost, 
    selectedRooms, 
    selectedCottages, 
    selectedAmenities
  });

  // Calculate number of nights
  const numberOfNights = useMemo(() => {
    if (!search.checkIn || !search.checkOut) return 0;
    const checkIn = new Date(search.checkIn);
    const checkOut = new Date(search.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [search.checkIn, search.checkOut]);

  // Determine rate type based on check-in/check-out times
  useEffect(() => {
    if (search.checkInTime && search.checkOutTime) {
      // Night Rate is typically 12:00 PM check-in to 11:00 AM check-out
      // Day Rate is typically 8:00 AM check-in to 6:00 PM check-out
      const checkInHour = parseInt(search.checkInTime.split(':')[0]);
      const checkOutHour = parseInt(search.checkOutTime.split(':')[0]);
      const checkInPeriod = search.checkInPeriod?.toUpperCase() || 'PM';
      const checkOutPeriod = search.checkOutPeriod?.toUpperCase() || 'AM';
      
      // Convert to 24-hour format
      const checkInHour24 = checkInPeriod === 'PM' && checkInHour !== 12 ? checkInHour + 12 : 
                           checkInPeriod === 'AM' && checkInHour === 12 ? 0 : checkInHour;
      const checkOutHour24 = checkOutPeriod === 'PM' && checkOutHour !== 12 ? checkOutHour + 12 : 
                            checkOutPeriod === 'AM' && checkOutHour === 12 ? 0 : checkOutHour;
      
      // Determine rate type
      // Night Rate: check-in after 11:00 AM (11:00) or check-out before 12:00 PM (12:00)
      const isNightRate = checkInHour24 >= 11 || checkOutHour24 <= 12;
      
      const newRateType = isNightRate ? 'night' : 'day';
      
      if (newRateType !== selectedRateType) {
        console.log("Updating rate type from", selectedRateType, "to", newRateType, "based on times:", {
          checkInTime: search.checkInTime,
          checkOutTime: search.checkOutTime,
          checkInPeriod: search.checkInPeriod,
          checkOutPeriod: search.checkOutPeriod,
          checkInHour24,
          checkOutHour24,
          isNightRate
        });
        setRateType(newRateType);
      }
    }
  }, [search.checkInTime, search.checkOutTime, search.checkInPeriod, search.checkOutPeriod, setRateType]);

  const [stableClientSecret, setStableClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (search.checkIn && search.checkOut) {
      setNumberOfNights(numberOfNights);
      console.log("Calculated number of nights:", numberOfNights);
    }
  }, [search.checkIn, search.checkOut, numberOfNights]);

  const { data: paymentIntentData, isLoading: isLoadingPayment, error: paymentError } = useQuery(
    ["createPaymentIntent", hotelId, downPaymentAmount, numberOfNights],
    () =>
      apiClient.createPaymentIntent(
        hotelId as string,
        downPaymentAmount.toString(),
        numberOfNights.toString()
      ),
    {
      enabled: !!hotelId && numberOfNights >= 0 && downPaymentAmount >= 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
      onError: (error: any) => {
        console.error("Payment intent creation failed:", error);
        
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          console.log("User not authenticated, redirecting to login");
          window.location.href = "/sign-in";
          return;
        }
        
        // For other errors, show payment setup failed
        if (showToast) {
          showToast({
            title: "Payment Setup Failed",
            description: "There was an error setting up the payment. Please try again.",
            type: "ERROR",
          });
        }
      }
    }
  );

  // Store clientSecret in state to prevent it from changing
  useEffect(() => {
    if (paymentIntentData?.clientSecret && !stableClientSecret) {
      setStableClientSecret(paymentIntentData.clientSecret);
      console.log("Stable clientSecret set:", paymentIntentData.clientSecret);
    }
  }, [paymentIntentData?.clientSecret]);

  const { data: hotel, isLoading: isLoadingHotel } = useQuery(
    "fetchHotelByID",
    () => apiClient.fetchHotelById(hotelId as string),
    {
      enabled: !!hotelId,
    }
  );

  console.log("Hotel data fetched:", hotel);

  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser
  );

  // Update base price when hotel is loaded
  useEffect(() => {
    if (hotel && numberOfNights > 0) {
      // Update deposit percentage from hotel
      updateDepositPercentageFromHotel(hotel);
      
      // Calculate entrance fees using day/night rates
      let entranceFeeTotal = 0;
      const rateType = selectedRateType === 'day' ? 'dayRate' : 'nightRate';
      const adultRate = hotel[rateType];

      // Check if any selected packages include entrance fees (making them free)
      const hasAdultEntranceFeeInPackage = selectedPackages.some(pkg => pkg.includedAdultEntranceFee);
      const hasChildEntranceFeeInPackage = selectedPackages.some(pkg => pkg.includedChildEntranceFee);

      // Adult entrance fees (only if not included in any package)
      if (!hasAdultEntranceFeeInPackage && adultRate > 0) {
        entranceFeeTotal += search.adultCount * adultRate;
      }

      // Child entrance fees (only if not included in any package)
      if (!hasChildEntranceFeeInPackage && hotel.childEntranceFee && hotel.childEntranceFee.length > 0 && search.childAges) {
        search.childAges.forEach((age) => {
          const ageGroup = hotel.childEntranceFee?.find(
            (group) => age >= group.minAge && age <= group.maxAge
          );
          
          if (ageGroup) {
            // Child falls within a defined age group
            if (ageGroup[rateType] > 0) {
              if (ageGroup.pricingModel === 'per_group') {
                const groupsNeeded = Math.ceil(1 / (ageGroup.groupQuantity || 1));
                entranceFeeTotal += groupsNeeded * ageGroup[rateType];
              } else {
                entranceFeeTotal += ageGroup[rateType];
              }
            }
            // If ageGroup[rateType] is 0, it means free entrance for this age group
           } else {
             // Child does not fall within any defined age group - charge adult rate
             if (!hasAdultEntranceFeeInPackage && adultRate > 0) {
               entranceFeeTotal += adultRate;
             }
           }
        });
       } else if (!hasChildEntranceFeeInPackage && search.childCount > 0 && adultRate > 0) {
         // No child age groups defined but there are children - charge all children adult rates
         entranceFeeTotal += search.childCount * adultRate;
       }

      // Set basePrice with calculated entrance fees - this is needed for BookingSelectionContext calculations
      const basePrice = entranceFeeTotal;
      console.log("Setting basePrice to:", basePrice);
      setBasePrice(basePrice);

      // Force recalculation by calling calculateTotal after setting basePrice
      setTimeout(() => {
        console.log("Triggering calculateTotal after basePrice update");
      }, 100);

      // Log debugging info
      console.log("=== ENTRANCE FEE DEBUG ===");
      console.log("Selected rate type from context:", selectedRateType);
      console.log("Calculated rate type:", rateType);
      console.log("Search data:", search);
      console.log("Adult count:", search.adultCount);
      console.log("Child count:", search.childCount);
      console.log("Child ages:", search.childAges);
       console.log("Hotel adult rate:", adultRate);
      console.log("Hotel child entrance fee:", hotel.childEntranceFee);
      console.log("Has adult entrance fee in package:", hasAdultEntranceFeeInPackage);
      console.log("Has child entrance fee in package:", hasChildEntranceFeeInPackage);
      console.log("Calculated entrance fee total:", entranceFeeTotal);
      console.log("Base price being set:", basePrice);
      console.log("Total cost from context:", totalCost);
      console.log("Down payment amount:", downPaymentAmount);
      console.log("=== END DEBUG ===");
      
      if (hasAdultEntranceFeeInPackage || hasChildEntranceFeeInPackage) {
        console.log("Entrance fees included in package - making them free!");
        console.log("Adult entrance fee included:", hasAdultEntranceFeeInPackage);
        console.log("Child entrance fee included:", hasChildEntranceFeeInPackage);
      }
      console.log("Using existing total cost from context:", totalCost, "for hotel:", hotel.name);
    }
  }, [hotel, numberOfNights, search.adultCount, search.childCount, search.childAges, selectedPackages, selectedRateType]);

  // Check if entrance fees are applicable - MUST be called before any conditional returns
  const hasEntranceFees = useMemo(() => {
    // Check if totalCost includes entrance fees
    if (totalCost > 0) return true;
    
    // Check if hotel has entrance fees configured for the selected rate type
    const rate = selectedRateType === 'day' ? hotel?.dayRate : hotel?.nightRate;
    const hasAdultFees = rate > 0;
    const hasChildFees = hotel?.childEntranceFee && hotel.childEntranceFee.length > 0;
    const hasGuests = search.adultCount > 0 || search.childCount > 0;
    
    return (hasAdultFees || hasChildFees) && hasGuests;
  }, [totalCost, hotel, selectedRateType, search.adultCount, search.childCount]);

  // Add null checks after all hooks are called
  if (!hotelId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Invalid Booking
          </h2>
          <p className="text-gray-600">
            No hotel ID provided for this booking.
          </p>
        </div>
      </div>
    );
  }

  // Check if search context has required data after all hooks are called
  if (!search.checkIn || !search.checkOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Missing Booking Information
          </h2>
          <p className="text-gray-600">
            Please select check-in and check-out dates to continue with your booking.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingHotel || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">
            Loading booking details...
          </span>
        </div>
      </div>
    );
  }

  if (paymentError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Payment Setup Failed
          </h2>
          <p className="text-gray-600">
            There was an error setting up the payment. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Hotel Not Found
          </h2>
          <p className="text-gray-600">
            The hotel you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Check if there's anything to pay for (accommodations or entrance fees)
  const hasSelectedAccommodations = selectedRooms.length > 0 || selectedCottages.length > 0;

  // Check if there's nothing to book and return early message
  if (!hasSelectedAccommodations && !hasEntranceFees) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Nothing to Book
          </h2>
          <p className="text-gray-600 mb-4">
            Please select accommodations or ensure entrance fees are applicable before proceeding to payment.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back to Hotel Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Booking
            </h1>
          </div>
          <p className="text-gray-600">
            Please review your details and complete the payment to confirm your
            reservation.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Resort Info */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {hotel?.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {hotel?.city}, {hotel?.country}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Check-in</div>
                      <div className="font-medium">{search.checkIn.toDateString()}</div>
                      <div className="text-sm text-blue-600">{search.checkInTime} {search.checkInPeriod}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Check-out</div>
                      <div className="font-medium">{search.checkOut.toDateString()}</div>
                      <div className="text-sm text-blue-600">{search.checkOutTime} {search.checkOutPeriod}</div>
                    </div>
                  </div>

                  {/* Nights */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500">Length of stay</div>
                    <div className="font-medium">{numberOfNights} nights</div>
                  </div>

                  {/* Guests */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500">Guests</div>
                    <div className="font-medium">
                      {search.adultCount} adults & {search.childCount} children
                    </div>
                    {search.childCount > 0 && search.childAges && search.childAges.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Ages: {search.childAges.map((age, index) => (
                          <span key={index}>
                            {age} yr{age > 1 ? 's' : ''}{index < search.childAges.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Entrance Fees */}
                  {totalCost > 0 && (selectedRooms.length === 0 && selectedCottages.length === 0) && (
                    <div className="border-b pb-4">
                      <div className="text-sm text-gray-500 mb-2">Entrance Fees ({selectedRateType} rate)</div>
                      <div className="flex justify-between text-sm">
                        <span>Adults ({search.adultCount}) × ₱{selectedRateType === 'day' ? hotel?.dayRate : hotel?.nightRate}</span>
                        <span>₱{((selectedRateType === 'day' ? hotel?.dayRate : hotel?.nightRate) * search.adultCount).toFixed(2)}</span>
                      </div>
                      {search.childCount > 0 && hotel?.childEntranceFee && hotel.childEntranceFee.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Children ({search.childCount})</span>
                          <span>₱{(totalCost - ((selectedRateType === 'day' ? hotel?.dayRate : hotel?.nightRate) * search.adultCount)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Accommodations */}
                  {(selectedRooms.length > 0 || selectedCottages.length > 0) && (
                    <div className="border-b pb-4">
                      <div className="text-sm text-gray-500 mb-2">Selected Accommodations</div>
                      {selectedRooms.map(room => (
                        <div key={room.id} className="flex justify-between text-sm mb-1">
                          <span>{room.name} (Room)</span>
                          <span>₱{(room.pricePerNight * numberOfNights).toFixed(2)}</span>
                        </div>
                      ))}
                      {selectedCottages.map(cottage => {
                        const rate = selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate;
                        return (
                          <div key={cottage.id} className="flex justify-between text-sm mb-1">
                            <span>{cottage.name} (Cottage - {selectedRateType} rate)</span>
                            <span>₱{(rate * numberOfNights).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected Amenities */}
                  {selectedAmenities.length > 0 && (
                    <div className="border-b pb-4">
                      <div className="text-sm text-gray-500 mb-2">Selected Amenities</div>
                      {selectedAmenities.map(amenity => (
                        <div key={amenity.id} className="flex justify-between text-sm mb-1">
                          <span>{amenity.name}</span>
                          <span>₱{amenity.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Cost */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-semibold text-gray-900">Total Estimated Cost</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₱{totalCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Down Payment (50%)</span>
                        <span className="text-lg font-semibold text-green-600">
                          ₱{downPaymentAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Remaining Balance</span>
                        <span className="text-lg font-semibold text-orange-600">
                          ₱{remainingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      <div className="mb-1">• Only 50% down payment required to book</div>
                      <div>• Remaining balance to be paid on-site</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Info Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5 text-blue-600" />
                  Resort Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {hotel.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {hotel.city}, {hotel.country}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {hotel.starRating} Stars
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ₱{selectedRateType === 'day' ? hotel.dayRate : hotel.nightRate}/{selectedRateType}
                    </Badge>
                  </div>
                  {hotel.type && (
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        let types = [];
                        if (Array.isArray(hotel.type)) {
                          types = hotel.type;
                        } else if (typeof hotel.type === 'string') {
                          try {
                            // Try to parse as JSON string
                            const parsed = JSON.parse(hotel.type);
                            types = Array.isArray(parsed) ? parsed : [hotel.type];
                          } catch {
                            // If parsing fails, treat as single type
                            types = [hotel.type];
                          }
                        }
                        
                        return types.map((type, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {type}
                          </Badge>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            {isLoadingPayment ? (
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-700">Preparing payment...</span>
                  </div>
                </CardContent>
              </Card>
            ) : currentUser && paymentIntentData ? (
              (() => {
                // Check if this is a zero-amount booking
                const isZeroAmount = paymentIntentData.message === "No payment required - zero amount booking" || 
                                   paymentIntentData.totalCost === 0 || 
                                   paymentIntentData.paymentIntentId?.startsWith('pi_mock_');
                
                if (isZeroAmount) {
                  // Render without Stripe Elements for zero-amount bookings
                  return (
                    <Card className="shadow-lg border-0 bg-white">
                      <CardContent className="p-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Required</h3>
                          <p className="text-gray-600">Your booking has been confirmed without payment.</p>
                        </div>
                        <EnhancedBookingForm
                          currentUser={currentUser}
                          paymentIntent={paymentIntentData}
                          calculatedTotal={totalCost}
                          downPaymentAmount={downPaymentAmount}
                          remainingAmount={remainingAmount}
                          selectedRooms={selectedRooms}
                          selectedCottages={selectedCottages}
                          selectedAmenities={selectedAmenities}
                          hotel={hotel}
                          skipPayment={true}
                        />
                      </CardContent>
                    </Card>
                  );
                }
                
                // Render with Stripe Elements for paid bookings
                if (!stableClientSecret) {
                  return (
                    <Card className="shadow-lg border-0 bg-white">
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          <span className="text-gray-700">Preparing payment...</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card className="shadow-lg border-0 bg-white">
                    <CardContent className="p-0">
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: stableClientSecret,
                        }}
                      >
                        <EnhancedBookingForm
                          currentUser={currentUser}
                          paymentIntent={paymentIntentData}
                          calculatedTotal={totalCost}
                          downPaymentAmount={downPaymentAmount}
                          remainingAmount={remainingAmount}
                          selectedRooms={selectedRooms}
                          selectedCottages={selectedCottages}
                          selectedAmenities={selectedAmenities}
                          hotel={hotel}
                        />
                      </Elements>
                    </CardContent>
                  </Card>
                );
              })()
            ) : (
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-700">Loading payment form...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
