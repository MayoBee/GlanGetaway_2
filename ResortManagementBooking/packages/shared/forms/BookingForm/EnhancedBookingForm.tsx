import { useForm } from "react-hook-form";
import { PaymentIntentResponse, UserType, HotelType } from "../../../../shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import useSearchContext from "../../hooks/useSearchContext";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import * as apiClient from "../../api-client";
import useAppContext from "../../hooks/useAppContext";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { User, Phone, MessageSquare, CreditCard, Shield, CheckCircle, Copy, Smartphone } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import GCashPaymentForm, { GCashPaymentData } from "../../components/GCashPaymentForm";
import { SelectedRoom, SelectedCottage, SelectedAmenity } from "../../contexts/BookingSelectionContext";
import GuestDiscountInputComponent from "../../components/GuestDiscountInput";
import type { DiscountCalculationResult } from "../../components/GuestDiscountInput";

type Props = {
  currentUser: UserType;
  paymentIntent: PaymentIntentResponse;
  calculatedTotal: number;
  downPaymentAmount: number;
  remainingAmount: number;
  selectedRooms: SelectedRoom[];
  selectedCottages: SelectedCottage[];
  selectedAmenities: SelectedAmenity[];
  hotel: HotelType;
};

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  hotelId: string;
  paymentIntentId: string;
  totalCost: number;
  basePrice: number;
  specialRequests?: string;
  paymentMethod: "card" | "gcash";
  selectedRooms?: SelectedRoom[];
  selectedCottages?: SelectedCottage[];
  selectedAmenities?: SelectedAmenity[];
};

const EnhancedBookingForm = ({ 
  currentUser, 
  paymentIntent, 
  calculatedTotal,
  downPaymentAmount,
  remainingAmount,
  selectedRooms,
  selectedCottages,
  selectedAmenities,
  hotel
}: Props) => {
  console.log("EnhancedBookingForm received:", {
    calculatedTotal,
    downPaymentAmount,
    remainingAmount,
    hotel,
    hotelGcashNumber: hotel?.gcashNumber
  });
  const stripe = useStripe();
  const elements = useElements();
  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  // Use local state for form fields to prevent losing data
  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  // Helper to get initial payment method from localStorage
  const getInitialPaymentMethod = (): "card" | "gcash" => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("booking_paymentMethod");
      if (saved === "gcash" || saved === "card") {
        console.log("[DEBUG] Restored payment method from localStorage:", saved);
        return saved;
      }
    }
    return "card";
  };

  const [isCopied, setIsCopied] = useState<boolean>(false);
  // Use a ref to track if component is mounted - prevents unwanted resets
  const isMounted = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gcash">(getInitialPaymentMethod);
  const [discountResult, setDiscountResult] = useState<DiscountCalculationResult | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [discountGuestCounts, setDiscountGuestCounts] = useState({ seniorCitizens: 0, pwdGuests: 0 });
  
  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    console.log("[DEBUG] EnhancedBookingForm mounted");
    return () => {
      isMounted.current = false;
      console.log("[DEBUG] EnhancedBookingForm unmounted");
    };
  }, []);

  // DEBUG: Log payment method changes with stack trace
  const handlePaymentMethodChange = (method: "card" | "gcash") => {
    if (!isMounted.current) {
      console.log("[DEBUG] handlePaymentMethodChange called but component not mounted");
      return;
    }
    console.log("[DEBUG] Payment method changing from:", paymentMethod, "to:", method);
    console.log("[DEBUG] Stack trace:", new Error().stack);
    // Persist to localStorage so it survives remounts
    if (typeof window !== 'undefined') {
      localStorage.setItem("booking_paymentMethod", method);
    }
    setPaymentMethod(method);
  };

  // DEBUG: Log when GCash submit is triggered
  const debugGCashSubmit = (paymentData: GCashPaymentData) => {
    console.log("[DEBUG] GCash submit triggered with data:", {
      gcashNumber: paymentData.gcashNumber,
      referenceNumber: paymentData.referenceNumber,
      amountPaid: paymentData.amountPaid,
      hasScreenshot: !!paymentData.screenshotFile
    });
    onGCashSubmit(paymentData);
  };

  const { mutate: bookRoom, isLoading: isCardLoading } = useMutation(
    apiClient.createRoomBooking,
    {
      onSuccess: (data) => {
        setBookingId(data._id || data.bookingId); // Set booking ID from response
        showToast({
          title: "Booking Successful",
          description: "Your hotel booking has been confirmed successfully!",
          type: "SUCCESS",
        });

        // Navigate to My Bookings page after a short delay
        setTimeout(() => {
          navigate("/my-bookings");
        }, 1500);
      },
      onError: () => {
        showToast({
          title: "Booking Failed",
          description:
            "There was an error processing your booking. Please try again.",
          type: "ERROR",
        });
      },
    }
  );

  const { mutate: bookWithGCash, isLoading: isGCashLoading } = useMutation(
    apiClient.createGCashBooking,
    {
      onSuccess: (data) => {
        setBookingId(data._id || data.bookingId); // Set booking ID from response
        showToast({
          title: "Payment Submitted",
          description: "Your GCash payment has been submitted for verification. The resort owner will review your payment screenshot.",
          type: "SUCCESS",
        });

        setTimeout(() => {
          navigate("/my-bookings");
        }, 1500);
      },
      onError: () => {
        showToast({
          title: "Payment Submission Failed",
          description: "There was an error submitting your payment. Please try again.",
          type: "ERROR",
        });
      },
    }
  );

  const { handleSubmit, register } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      checkInTime: "12:00 PM",
      checkOutTime: "11:00 AM",
      hotelId: hotelId,
      totalCost: calculatedTotal, // Use calculated total instead of paymentIntent total
      basePrice: paymentIntent.totalCost, // Use paymentIntent total as base price
      paymentIntentId: paymentIntent.paymentIntentId,
      paymentMethod: "card",
      selectedRooms,
      selectedCottages,
      selectedAmenities,
    },
    mode: paymentMethod === "card" ? "onChange" : "onSubmit", // Only validate in onChange mode for card
    shouldUnregister: false,
  });

  const handleCopyCredentials = async () => {
    const credentials = `Card: 4242 4242 4242 4242
MM/YY: 12/35 CVC: 123`;

    try {
      await navigator.clipboard.writeText(credentials);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy credentials:", err);
    }
  };

  // Calculate total with discount applied
  const getFinalPricing = () => {
    if (discountResult) {
      return {
        originalTotal: calculatedTotal,
        discountedTotal: discountResult.finalPayableAmount,
        discountAmount: discountResult.totalSavings,
        hasDiscount: discountResult.totalSavings > 0
      };
    }
    return {
      originalTotal: calculatedTotal,
      discountedTotal: calculatedTotal,
      discountAmount: 0,
      hasDiscount: false
    };
  };

  const finalPricing = getFinalPricing();
  const finalDownPayment = downPaymentAmount;
  const finalRemaining = remainingAmount;

  const handleDiscountChange = useCallback((result: DiscountCalculationResult) => {
    console.log("[DEBUG] handleDiscountChange called with result:", result);
    setDiscountResult(result);
    
    // Extract guest counts from discount breakdown
    const seniorCount = result.discountBreakdown.find(item => item.category === "Senior Citizens")?.count || 0;
    const pwdCount = result.discountBreakdown.find(item => item.category === "PWD Guests")?.count || 0;
    setDiscountGuestCounts({ seniorCitizens: seniorCount, pwdGuests: pwdCount });
  }, []);

  const onCardSubmit = async (formData: BookingFormData) => {
    // Prevent this from being called when GCash is selected
    if (paymentMethod === "gcash") {
      return;
    }
    if (!stripe || !elements) {
      showToast({
        title: "Payment System Error",
        description: "Stripe payment system is not loaded. Please refresh and try again.",
        type: "ERROR",
      });
      return;
    }

    const completeFormData = {
      ...formData,
      phone,
      specialRequests,
      paymentMethod: "card",
      totalCost: finalDownPayment, // Use final down payment amount
      basePrice: calculatedTotal, // Use calculated total as base
      checkInTime: "12:00 PM",
      checkOutTime: "11:00 AM",
      selectedRooms,
      selectedCottages,
      selectedAmenities,
    };

    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement) as StripeCardElement,
      },
    });

    if (result.error) {
      showToast({
        title: "Payment Failed",
        description: result.error.message || "An error occurred while processing your payment.",
        type: "ERROR",
      });
      return;
    }

    bookRoom(completeFormData);
  };

  const onGCashSubmit = (paymentData: GCashPaymentData) => {
    const formData = {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phone: paymentData.gcashNumber,
      adultCount: search.adultCount,
      childCount: search.childCount,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      checkInTime: "12:00 PM",
      checkOutTime: "11:00 AM",
      hotelId: hotelId || "",
      totalCost: finalDownPayment, // Use final down payment amount
      basePrice: calculatedTotal, // Use calculated total as base
      paymentIntentId: paymentIntent.paymentIntentId,
      specialRequests,
      paymentMethod: "gcash" as const,
      selectedRooms,
      selectedCottages,
      selectedAmenities,
      // Pass the screenshot file separately
      screenshotFile: paymentData.screenshotFile,
      gcashPayment: {
        gcashNumber: paymentData.gcashNumber,
        referenceNumber: paymentData.referenceNumber,
        amountPaid: paymentData.amountPaid,
        paymentTime: paymentData.paymentTime,
        status: "pending",
      },
    };

    bookWithGCash(formData);
  };

  const isLoading = isCardLoading || isGCashLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
      {/* Booking Form */}
      <form 
        onSubmit={(e) => {
          if (paymentMethod === "gcash") {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            return false;
          }
          return handleSubmit(onCardSubmit)(e);
        }} 
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("firstName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("lastName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  type="email"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone (Optional)
                </Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="focus:ring-2 focus:ring-blue-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Special Requests (Optional)
              </h3>

              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Any special requests, preferences, or additional information..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Let us know if you have any special requirements or preferences
                  for your stay.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discount Input */}
        <GuestDiscountInputComponent
          totalGuests={search.adultCount + search.childCount}
          pricePerNight={calculatedTotal / Math.max(1, Math.ceil((search.checkOut.getTime() - search.checkIn.getTime()) / (1000 * 60 * 60 * 24)))}
          numberOfNights={Math.max(1, Math.ceil((search.checkOut.getTime() - search.checkIn.getTime()) / (1000 * 60 * 60 * 24)))}
          discountConfig={{
            seniorCitizenEnabled: true,
            seniorCitizenPercentage: 20,
            pwdEnabled: true,
            pwdPercentage: 20,
            customDiscounts: []
          }}
          onDiscountChange={handleDiscountChange}
          bookingId={bookingId || undefined}
        />

        {/* Price Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Price Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              {finalPricing.hasDiscount && (
                <div className="mb-3 pb-3 border-b border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Original Cost</span>
                    <span className="line-through text-gray-400">
                      ₱{finalPricing.originalTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">Discount Applied</span>
                    <span className="text-green-600 font-bold">
                      -₱{finalPricing.discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium">
                  Total Estimated Cost
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ₱{calculatedTotal.toFixed(2)}
                </span>
              </div>
              
              <div className="border-t border-blue-200 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Down Payment (50%)</span>
                  <span className="text-xl font-bold text-green-600">
                    ₱{finalDownPayment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining Balance</span>
                  <span className="text-lg font-semibold text-orange-600">
                    ₱{finalRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Only 50% down payment required to book
              </div>
              {(selectedRooms.length > 0 || selectedCottages.length > 0 || selectedAmenities.length > 0) && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-gray-600">
                    {selectedRooms.length > 0 && `${selectedRooms.length} room(s)`}
                    {selectedCottages.length > 0 && `${selectedRooms.length > 0 ? ', ' : ''}${selectedCottages.length} cottage(s)`}
                    {selectedAmenities.length > 0 && `${(selectedRooms.length > 0 || selectedCottages.length > 0) ? ', ' : ''}${selectedAmenities.length} amenit(ies)`}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    handlePaymentMethodChange("card");
                  }}
                  className={`p-4 rounded-lg border-2 font-medium transition-all ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2" />
                  <div>Credit/Debit Card</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePaymentMethodChange("gcash");
                  }}
                  className={`p-4 rounded-lg border-2 font-medium transition-all ${
                    paymentMethod === "gcash"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Smartphone className="w-6 h-6 mx-auto mb-2" />
                  <div>GCash</div>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === "card" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <CardElement
                      id="payment-element"
                      className="text-sm"
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#424770",
                            "::placeholder": {
                              color: "#aab7c4",
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Test Credentials */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-yellow-800 mb-1">Test Credentials:</div>
                        <div className="text-yellow-700">Card: 4242 4242 4242 4242</div>
                        <div className="text-yellow-700">MM/YY: 12/35</div>
                        <div className="text-yellow-700">CVC: 123</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 inline mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GCash Payment Form */}
              {paymentMethod === "gcash" && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onSubmit={(e) => e.stopPropagation()}
                  onReset={(e) => e.stopPropagation()}
                  style={{ isolation: 'isolate' }}
                >
                  <GCashPaymentForm
                    totalCost={calculatedTotal}
                    downPaymentAmount={finalDownPayment}
                    remainingAmount={finalRemaining}
                    onPaymentSubmit={debugGCashSubmit}
                    isLoading={isGCashLoading}
                    hotel={hotel}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {paymentMethod === "card" && (
          <Button
            disabled={isLoading}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Confirm Booking
              </div>
            )}
          </Button>
        )}
      </form>

      {/* Trust Indicators */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-500" />
            Secure Payment
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Instant Confirmation
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-green-500" />
            24/7 Support
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookingForm;
