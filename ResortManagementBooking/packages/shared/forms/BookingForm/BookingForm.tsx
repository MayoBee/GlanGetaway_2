import { useForm } from "react-hook-form";
import { PaymentIntentResponse, UserType } from "../../../../shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElement } from "@stripe/stripe-js";
import useSearchContext from "../../hooks/useSearchContext";
import useAppContext from "../../hooks/useAppContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useBookingSelection } from "../../contexts/BookingSelectionContext";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useMutation, useQuery } from "react-query";
import * as apiClient from "../../api-client";
import { useState, useEffect } from "react";
import {
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

type Props = {
  currentUser: UserType;
  paymentIntent: PaymentIntentResponse;
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
  selectedRooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    units: number;
    description?: string;
  }>;
  selectedCottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    units: number;
    description?: string;
  }>;
  selectedAmenities?: Array<{
    id: string;
    name: string;
    price: number;
    units: number;
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
  }>;
  specialRequests?: string;
  isPwdBooking?: boolean;
  isSeniorCitizenBooking?: boolean;
  discountInfo?: {
    type: "pwd" | "senior_citizen" | null;
    percentage: number;
    amount: number;
  };
};

const BookingForm = ({ currentUser, paymentIntent }: Props) => {
  const stripe = useStripe();
  const elements = useElements();

  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { 
    selectedRooms, 
    selectedCottages, 
    selectedAmenities,
    selectedPackages,
    basePrice, 
    totalCost,
    discountInfo,
    hotelDiscounts,
    setDiscountInfo,
    setHotelDiscounts
  } = useBookingSelection();

  const { showToast } = useAppContext();

  // Load hotel data to get discount settings
  const { data: hotel } = useQuery(
    "fetchHotelByID",
    () => apiClient.fetchHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
      onSuccess: (data) => {
        if (data.discounts) {
          setHotelDiscounts(data.discounts);
        }
      }
    }
  );

  // Use local state for form fields to prevent losing data
  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPwdBooking, setIsPwdBooking] = useState<boolean>(false);
  const [isSeniorCitizenBooking, setIsSeniorCitizenBooking] = useState<boolean>(false);

  // Update discount info when checkboxes change
  const handlePwdChange = (checked: boolean) => {
    setIsPwdBooking(checked);
    if (checked) {
      setIsSeniorCitizenBooking(false);
      setDiscountInfo({
        type: "pwd",
        percentage: hotelDiscounts?.pwdPercentage || 20,
        amount: 0
      });
    } else {
      setDiscountInfo(null);
    }
  };

  const handleSeniorCitizenChange = (checked: boolean) => {
    setIsSeniorCitizenBooking(checked);
    if (checked) {
      setIsPwdBooking(false);
      setDiscountInfo({
        type: "senior_citizen",
        percentage: hotelDiscounts?.seniorCitizenPercentage || 20,
        amount: 0
      });
    } else {
      setDiscountInfo(null);
    }
  };

  const { mutate: bookRoom, isLoading } = useMutation(
    apiClient.createRoomBooking,
    {
      onSuccess: () => {
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

  const { register, handleSubmit } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      checkInTime: search.checkInTime,
      checkOutTime: search.checkOutTime,
      hotelId: hotelId,
      totalCost: totalCost,
      basePrice: basePrice,
      selectedRooms: selectedRooms,
      selectedCottages: selectedCottages,
      selectedAmenities: selectedAmenities,
      selectedPackages: selectedPackages,
      paymentIntentId: paymentIntent.paymentIntentId,
    },
    mode: "onChange",
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

  const onSubmit = async (formData: BookingFormData) => {
    if (!stripe || !elements) {
      showToast({
        title: "Payment System Error",
        description: "Stripe payment system is not loaded. Please refresh and try again.",
        type: "ERROR",
      });
      return;
    }

    // Add the local state values to the form data
    const completeFormData = {
      ...formData,
      phone,
      specialRequests,
      isPwdBooking,
      isSeniorCitizenBooking,
      discountInfo,
      totalCost: totalCost, // Use the calculated total cost with discounts
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

    if (result.paymentIntent?.status === "succeeded") {
      bookRoom({
        ...completeFormData,
        paymentIntentId: result.paymentIntent.id,
      });
    } else if (result.paymentIntent) {
      showToast({
        title: "Payment Status",
        description: `Payment status: ${result.paymentIntent.status}. Please contact support if the issue persists.`,
        type: "ERROR",
      });
    }
  };

  return (
    <div className="p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <User className="h-6 w-6 text-blue-600" />
          Confirm Your Details
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Please review and complete your booking information
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </h3>

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

              {/* Hidden fields for time data */}
              <input type="hidden" {...register("checkInTime")} />
              <input type="hidden" {...register("checkOutTime")} />
            </div>
          </div>

          {/* Discount Eligibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Discount Eligibility (Optional)
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                If you qualify for special discounts, please select the applicable option below. 
                This will affect your payment processing requirements.
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPwdBooking}
                    onChange={(e) => handlePwdChange(e.target.checked)}
                    disabled={!hotelDiscounts?.pwdEnabled}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    PWD (Person with Disability) Discount
                    {hotelDiscounts?.pwdEnabled && (
                      <span className="text-blue-600 ml-2">({hotelDiscounts.pwdPercentage}% off)</span>
                    )}
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSeniorCitizenBooking}
                    onChange={(e) => handleSeniorCitizenChange(e.target.checked)}
                    disabled={!hotelDiscounts?.seniorCitizenEnabled}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Senior Citizen Discount
                    {hotelDiscounts?.seniorCitizenEnabled && (
                      <span className="text-blue-600 ml-2">({hotelDiscounts.seniorCitizenPercentage}% off)</span>
                    )}
                  </span>
                </label>
              </div>

              {(isPwdBooking || isSeniorCitizenBooking) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Bookings with special discounts will require manual verification. 
                    Payment status will remain pending until resort staff verify your eligibility.
                  </p>
                </div>
              )}
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

          {/* Price Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Price Summary
            </h3>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              {discountInfo && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Discount Applied</span>
                    <span className="text-green-600 font-semibold">
                      -{discountInfo.percentage}% ({discountInfo.type === 'pwd' ? 'PWD' : 'Senior Citizen'})
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-medium">Total Cost</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₱{totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Includes taxes and charges
                {discountInfo && <span className="text-green-600">• Discount applied</span>}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Payment Details
            </h3>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3 text-green-500" />
              Your payment information is secure and encrypted
            </div>
          </div>

          {/* Test Credentials Note */}
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                    For Testing Purpose
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    You can use these dummy credentials to complete checkout and
                    see the booking status page, analytical page, or other pages
                    to see the interactive results:
                  </p>
                  <div className="bg-white border border-yellow-300 rounded-md p-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono text-gray-800">
                        <div>Card: 4242 4242 4242 4242</div>
                        <div>MM/YY: 12/35 CVC: 123 ZIP: 12345</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors duration-200"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
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
          </div>
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
      </CardContent>
    </div>
  );
};

export default BookingForm;
