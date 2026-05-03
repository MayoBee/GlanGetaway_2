import { useQuery } from "react-query";
import { createPaymentIntent, fetchHotelById, fetchCurrentUser } from "../api-client";
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
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, CreditCard, Calendar, Users } from "lucide-react";

const Booking = () => {
  console.log("Booking component rendering...");
  const { stripePromise } = useAppContext();
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
    updateDepositPercentageFromHotel
  } = useBookingSelection();

  console.log("Booking selection data:", { 
    totalCost, 
    selectedRooms, 
    selectedCottages, 
    selectedAmenities
  });

  const [numberOfNights, setNumberOfNightsState] = useState<number>(0);

  useEffect(() => {
    if (search.checkIn && search.checkOut) {
      const nights =
        Math.abs(search.checkOut.getTime() - search.checkIn.getTime()) /
        (1000 * 60 * 60 * 24);

      const calculatedNights = Math.max(1, Math.ceil(nights));
      setNumberOfNightsState(calculatedNights);
      setNumberOfNights(calculatedNights);
    }
  }, [search.checkIn, search.checkOut, setNumberOfNights]);

  const { data: hotel, isLoading: isLoadingHotel } = useQuery(
    "fetchHotelByID",
    () => fetchHotelById(hotelId as string),
    {
      enabled: !!hotelId,
    }
  );

  console.log("Hotel data fetched:", hotel);

  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    "fetchCurrentUser",
    fetchCurrentUser
  );

  const { data: paymentIntentData, isLoading: isLoadingPayment, error: paymentError } = useQuery(
    "createPaymentIntent",
    () =>
      createPaymentIntent(
        hotelId as string,
        downPaymentAmount.toString(),
        numberOfNights.toString()
      ),
    {
      enabled: !!hotelId && numberOfNights >= 0 && !!currentUser, // Allow payment intent creation even with zero costs
      retry: 2,
      onError: (error) => {
        console.error("Payment intent creation failed:", error);
      }
    }
  );

  // Debug payment intent data
  useEffect(() => {
    if (paymentIntentData) {
      console.log("PaymentIntentData:", paymentIntentData);
      console.log("Message:", paymentIntentData.message);
      console.log("TotalCost:", paymentIntentData.totalCost);
      console.log("Is zero amount:", paymentIntentData.message === "No payment required - zero amount booking" || paymentIntentData.totalCost === 0);
    }
  }, [paymentIntentData]);

  // Update base price when hotel is loaded
  useEffect(() => {
    if (hotel && numberOfNights > 0) {
      // Update deposit percentage from hotel
      updateDepositPercentageFromHotel(hotel);
      
      // Calculate entrance fees instead of using day/night rates
      let entranceFeeTotal = 0;
      const rateType = selectedRateType === 'day' ? 'dayRate' : 'nightRate';
      
      // Check if any selected packages include entrance fees (making them free)
      const hasAdultEntranceFeeInPackage = selectedPackages.some(pkg => pkg.includedAdultEntranceFee);
      const hasChildEntranceFeeInPackage = selectedPackages.some(pkg => pkg.includedChildEntranceFee);

      // Adult entrance fees (only if not included in any package)
      if (!hasAdultEntranceFeeInPackage && hotel.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0) {
        if (hotel.adultEntranceFee.pricingModel === 'per_group') {
          const groupsNeeded = Math.ceil(search.adultCount / (hotel.adultEntranceFee.groupQuantity || 1));
          entranceFeeTotal += groupsNeeded * hotel.adultEntranceFee[rateType];
        } else {
          entranceFeeTotal += search.adultCount * hotel.adultEntranceFee[rateType];
        }
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
            if (!hasAdultEntranceFeeInPackage && hotel.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0) {
              if (hotel.adultEntranceFee.pricingModel === 'per_group') {
                const groupsNeeded = Math.ceil(1 / (hotel.adultEntranceFee.groupQuantity || 1));
                entranceFeeTotal += groupsNeeded * hotel.adultEntranceFee[rateType];
              } else {
                entranceFeeTotal += hotel.adultEntranceFee[rateType];
              }
            }
          }
        });
      } else if (!hasChildEntranceFeeInPackage && search.childCount > 0 && hotel.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0) {
        // No child age groups defined but there are children - charge all children adult rates
        if (hotel.adultEntranceFee.pricingModel === 'per_group') {
          const groupsNeeded = Math.ceil(search.childCount / (hotel.adultEntranceFee.groupQuantity || 1));
          entranceFeeTotal += groupsNeeded * hotel.adultEntranceFee[rateType];
        } else {
          entranceFeeTotal += search.childCount * hotel.adultEntranceFee[rateType];
        }
      }

      const basePrice = entranceFeeTotal;
      setBasePrice(basePrice);
      
      // Log debugging info
      if (hasAdultEntranceFeeInPackage || hasChildEntranceFeeInPackage) {
        console.log("Entrance fees included in package - making them free!");
        console.log("Adult entrance fee included:", hasAdultEntranceFeeInPackage);
        console.log("Child entrance fee included:", hasChildEntranceFeeInPackage);
      }
      console.log("Updated base price:", basePrice, "for hotel:", hotel.name, "using entrance fees");
    }
  }, [hotel, numberOfNights, setBasePrice, search.adultCount, search.childCount, search.childAges, selectedPackages, selectedRateType]);

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
  
  // Check if entrance fees are applicable - more comprehensive check
  const hasEntranceFees = useMemo(() => {
    // Check if totalCost includes entrance fees
    if (totalCost > 0) return true;
    
    // Check if hotel has entrance fees configured for the selected rate type
    const rateType = selectedRateType === 'day' ? 'dayRate' : 'nightRate';
    const hasAdultFees = hotel?.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0;
    const hasChildFees = hotel?.childEntranceFee && hotel.childEntranceFee.length > 0;
    const hasGuests = search.adultCount > 0 || search.childCount > 0;
    
    return (hasAdultFees || hasChildFees) && hasGuests;
  }, [totalCost, hotel, selectedRateType, search.adultCount, search.childCount]);

  // Debug logging for entrance fee check (moved outside useMemo)
  useEffect(() => {
    const rateType = selectedRateType === 'day' ? 'dayRate' : 'nightRate';
    const hasAdultFees = hotel?.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0;
    const hasChildFees = hotel?.childEntranceFee && hotel.childEntranceFee.length > 0;
    const hasGuests = search.adultCount > 0 || search.childCount > 0;
    
    console.log("Entrance fee check:", {
      rateType,
      hasAdultFees,
      hasChildFees,
      hasGuests,
      adultCount: search.adultCount,
      childCount: search.childCount,
      totalCost,
      hotelAdultEntranceFee: hotel?.adultEntranceFee,
      hasEntranceFees
    });
  }, [totalCost, hotel, selectedRateType, search.adultCount, search.childCount, hasEntranceFees]);

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
                      {selectedCottages.map(cottage => (
                        <div key={cottage.id} className="flex justify-between text-sm mb-1">
                          <span>{cottage.name} (Cottage)</span>
                          <span>₱{(cottage.pricePerNight * numberOfNights).toFixed(2)}</span>
                        </div>
                      ))}
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
                      ₱{hotel.hasNightRate ? hotel.nightRate : hotel.dayRate}/night
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
              // Check if this is a zero-amount booking - more comprehensive check
              (() => {
                const isZeroAmount = paymentIntentData.message === "No payment required - zero amount booking" || 
                                   paymentIntentData.totalCost === 0 || 
                                   paymentIntentData.paymentIntentId?.startsWith('pi_mock_');
                console.log("Is zero amount booking:", isZeroAmount);
                return isZeroAmount;
              })() ? (
                <Card className="shadow-lg border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Payment Required</h3>
                        <p className="text-gray-600 mb-4">
                          This booking requires no payment. You can proceed directly to confirmation.
                        </p>
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
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 bg-white">
                  <CardContent className="p-0">
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: paymentIntentData.clientSecret,
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
              )
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

