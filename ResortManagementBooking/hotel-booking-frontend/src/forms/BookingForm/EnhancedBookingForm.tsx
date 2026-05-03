import { useForm } from "react-hook-form";
import { PaymentIntentResponse, UserType, HotelType } from "../../../../shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import useSearchContext from "../../hooks/useSearchContext";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { axiosInstance } from "../../api-client";
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
import { createRoomBooking, createGCashBooking } from "../../api-client";

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
  skipPayment?: boolean;
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
  hotel,
  skipPayment = false
}: Props) => {
  console.log("EnhancedBookingForm received:", {
    calculatedTotal,
    downPaymentAmount,
    remainingAmount,
    hotel,
    hotelGcashNumber: hotel?.gcashNumber
  });
  const stripe = !skipPayment ? useStripe() : null;
  const elements = !skipPayment ? useElements() : null;
  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { showToast, ensureValidToken } = useAppContext();

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
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
    createRoomBooking,
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
      onError: (error: any) => {
        console.error("[DEBUG] Booking creation error:", error);

        let errorMessage = "There was an error processing your booking. Please try again.";
        let errorTitle = "Booking Failed";

        // Handle different types of backend errors
        if (error.response?.status === 400) {
          const errorData = error.response?.data;

          // Check for specific validation errors
          if (errorData?.message?.includes("firstName") || errorData?.message?.includes("first name")) {
            errorMessage = "First name is required. Please provide your first name.";
            errorTitle = "Missing Information";
          } else if (errorData?.message?.includes("lastName") || errorData?.message?.includes("last name")) {
            errorMessage = "Last name is required. Please provide your last name.";
            errorTitle = "Missing Information";
          } else if (errorData?.message?.includes("email")) {
            errorMessage = "Valid email address is required. Please check your email.";
            errorTitle = "Invalid Email";
          } else if (errorData?.message?.includes("payment") || errorData?.message?.includes("Payment")) {
            errorMessage = "Payment processing failed. Please try again or contact support.";
            errorTitle = "Payment Error";
          } else if (errorData?.message) {
            // Use backend message if available
            errorMessage = errorData.message;
          }
        } else if (error.response?.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          errorTitle = "Authentication Required";
          // Redirect to login after showing error
          setTimeout(() => {
            navigate("/sign-in");
          }, 2000);
        } else if (error.response?.status >= 500) {
          errorMessage = "Server error occurred. Please try again later or contact support.";
          errorTitle = "Server Error";
        } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED") {
          errorMessage = "Connection failed. Please check your internet connection and try again.";
          errorTitle = "Connection Error";
        }

        showToast({
          title: errorTitle,
          description: errorMessage,
          type: "ERROR",
        });
      },
    }
  );

  const { mutate: bookWithGCash, isLoading: isGCashLoading } = useMutation(
    createGCashBooking,
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
      onError: (error: any) => {
        console.error("[DEBUG] GCash booking creation error:", error);

        let errorMessage = "There was an error submitting your payment. Please try again.";
        let errorTitle = "Payment Submission Failed";

        // Handle different types of backend errors
        if (error.response?.status === 400) {
          const errorData = error.response?.data;

          // Check for specific validation errors
          if (errorData?.message?.includes("firstName") || errorData?.message?.includes("first name")) {
            errorMessage = "First name is required. Please provide your first name.";
            errorTitle = "Missing Information";
          } else if (errorData?.message?.includes("lastName") || errorData?.message?.includes("last name")) {
            errorMessage = "Last name is required. Please provide your last name.";
            errorTitle = "Missing Information";
          } else if (errorData?.message?.includes("email")) {
            errorMessage = "Valid email address is required. Please check your email.";
            errorTitle = "Invalid Email";
          } else if (errorData?.message?.includes("gcash") || errorData?.message?.includes("GCash")) {
            errorMessage = "GCash payment information is invalid. Please check your details.";
            errorTitle = "Payment Error";
          } else if (errorData?.message) {
            // Use backend message if available
            errorMessage = errorData.message;
          }
        } else if (error.response?.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          errorTitle = "Authentication Required";
          // Redirect to login after showing error
          setTimeout(() => {
            navigate("/sign-in");
          }, 2000);
        } else if (error.response?.status >= 500) {
          errorMessage = "Server error occurred. Please try again later or contact support.";
          errorTitle = "Server Error";
        } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED") {
          errorMessage = "Connection failed. Please check your internet connection and try again.";
          errorTitle = "Connection Error";
        }

        showToast({
          title: errorTitle,
          description: errorMessage,
          type: "ERROR",
        });
      },
    }
  );

  const { handleSubmit, register, setValue, watch, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || "",
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
    mode: "onChange", // Always validate on change for better UX
    shouldUnregister: false,
  });

  // Watch form values
  const firstNameValue = watch("firstName");
  const lastNameValue = watch("lastName");
  const emailValue = watch("email");

  // Helper function to validate if required user information is available
  const hasValidUserInfo = (formValues?: Partial<BookingFormData>) => {
    // Check form values if provided (for card submission)
    if (formValues) {
      return (formValues.firstName && formValues.firstName.trim()) &&
             (formValues.lastName && formValues.lastName.trim()) &&
             (formValues.email && formValues.email.trim());
    }

    // Check current form values (for GCash submission)
    const currentValues = watch();
    const hasFormData = (currentValues.firstName && currentValues.firstName.trim()) &&
                       (currentValues.lastName && currentValues.lastName.trim()) &&
                       (currentValues.email && currentValues.email.trim());

    // Check currentUser as fallback
    const hasUserData = currentUser?.firstName && currentUser.lastName && currentUser.email;

    return hasFormData || hasUserData;
  };

  // Ensure form values are set when currentUser is available, but don't overwrite manual input
  useEffect(() => {
    if (currentUser) {
      // Only set values if they haven't been manually entered (i.e., if they're still empty)
      const currentFirstName = watch("firstName");
      const currentLastName = watch("lastName");
      const currentEmail = watch("email");

      if (!currentFirstName || currentFirstName.trim() === "") {
        setValue("firstName", currentUser.firstName || "");
      }
      if (!currentLastName || currentLastName.trim() === "") {
        setValue("lastName", currentUser.lastName || "");
      }
      if (!currentEmail || currentEmail.trim() === "") {
        setValue("email", currentUser.email || "");
      }
    }
  }, [currentUser, setValue, watch]);

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

    // Prevent multiple submissions
    if (isProcessingPayment) {
      console.log("[DEBUG] Payment already in progress, ignoring submission");
      return;
    }

    // PHASE 1: User Authentication Validation
    // Check if user is logged in
    if (!currentUser) {
      showToast({
        title: "Authentication Required",
        description: "Please log in to complete your booking.",
        type: "ERROR",
      });
      // Redirect to login page
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);
      return;
    }

    // Check if required user information is available
    if (!hasValidUserInfo(formData)) {
      showToast({
        title: "Profile Information Missing",
        description: "Please complete the required information below to proceed with your booking.",
        type: "ERROR",
      });
      return;
    }

    // Check token validity before critical payment action
    const isTokenValid = await ensureValidToken();
    if (!isTokenValid) {
      return; // User will be redirected to login
    }
    
    if (!stripe || !elements) {
      showToast({
        title: "Payment System Error",
        description: "Stripe payment system is not loaded. Please refresh and try again.",
        type: "ERROR",
      });
      return;
    }

    // Set processing state to true
    setIsProcessingPayment(true);
    
    try {
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
        paymentIntentId: paymentIntent.paymentIntentId, // Ensure payment intent ID is included
        // Ensure dates are in ISO format for backend
        checkIn: search.checkIn.toISOString(),
        checkOut: search.checkOut.toISOString(),
      };

      console.log("[DEBUG] Starting Stripe payment confirmation");
      console.log("[DEBUG] Payment intent ID:", paymentIntent.paymentIntentId);
      console.log("[DEBUG] Client secret available:", !!paymentIntent.clientSecret);
      
      // Validate payment intent state before confirmation
      try {
        const paymentIntentResult = await stripe.retrievePaymentIntent(paymentIntent.clientSecret);
        console.log("[DEBUG] Retrieved payment intent state:", paymentIntentResult);
        
        if (paymentIntentResult.paymentIntent?.status !== 'requires_payment_method') {
          console.error("[DEBUG] Payment intent is in invalid state:", paymentIntentResult.paymentIntent?.status);
          
          // Check if we can refresh the payment intent
          if (paymentIntentResult.paymentIntent?.status === 'canceled' || 
              paymentIntentResult.paymentIntent?.status === 'succeeded') {
            showToast({
              title: "Payment Session Expired",
              description: "This payment session has expired or been used. Please refresh the page to start a new booking.",
              type: "ERROR",
            });
            // Optionally redirect to refresh the page
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            return;
          }
          
          showToast({
            title: "Payment Error",
            description: "This payment session is in an invalid state. Please refresh and try again.",
            type: "ERROR",
          });
          return;
        }
      } catch (retrieveError) {
        console.error("[DEBUG] Error retrieving payment intent:", retrieveError);
        showToast({
          title: "Payment Error",
          description: "Unable to validate payment session. Please refresh and try again.",
          type: "ERROR",
        });
        return;
      }
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement || !cardElement._complete) {
        showToast({
          title: "Incomplete Card Information",
          description: "Please complete all card details before proceeding.",
          type: "ERROR",
        });
        return;
      }
      
      const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as StripeCardElement,
        },
      });

      console.log("[DEBUG] Stripe payment result:", result);

      if (result.error) {
        console.error("[DEBUG] Stripe payment error:", result.error);
        
        let errorMessage = result.error.message || "An error occurred while processing your payment.";
        if (result.error.code === 'incomplete_number') {
          errorMessage = "Please complete your card number before proceeding.";
        } else if (result.error.code === 'incomplete_expiry') {
          errorMessage = "Please enter a valid expiration date for your card.";
        } else if (result.error.code === 'incomplete_cvc') {
          errorMessage = "Please enter your card's security code (CVC).";
        } else if (result.error.code === 'invalid_number') {
          errorMessage = "The card number you entered is invalid.";
        } else if (result.error.code === 'invalid_expiry_year_past') {
          errorMessage = "The expiration date you entered is in the past.";
        } else if (result.error.code === 'invalid_cvc') {
          errorMessage = "The security code you entered is invalid.";
        } else if (result.error.code === 'payment_intent_unexpected_state') {
          errorMessage = "This payment session has expired or been used. Please refresh the page and try again.";
        } else if (result.error.code === 'payment_intent_invalid') {
          errorMessage = "Invalid payment session. Please refresh the page and try again.";
        }
        
        showToast({
          title: "Payment Failed",
          description: errorMessage,
          type: "ERROR",
        });
        return;
      }

      console.log("[DEBUG] Payment successful, proceeding with booking");
      console.log("[DEBUG] Booking data being sent:", completeFormData);
      bookRoom(completeFormData);
    } catch (error) {
      console.error("[DEBUG] Unexpected error during payment:", error);
      showToast({
        title: "Payment Failed",
        description: "An unexpected error occurred while processing your payment. Please try again.",
        type: "ERROR",
      });
    } finally {
      // Always reset processing state
      setIsProcessingPayment(false);
    }
  };

  const onGCashSubmit = async (paymentData: GCashPaymentData) => {
    // PHASE 1: User Authentication Validation
    // Check if user is logged in
    if (!currentUser) {
      showToast({
        title: "Authentication Required",
        description: "Please log in to complete your booking.",
        type: "ERROR",
      });
      // Redirect to login page
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);
      return;
    }

    // Check if required user information is available
    if (!hasValidUserInfo()) {
      showToast({
        title: "Profile Information Missing",
        description: "Please complete the required information below to proceed with your booking.",
        type: "ERROR",
      });
      return;
    }

    // Check token validity before critical payment action
    const isTokenValid = await ensureValidToken();
    if (!isTokenValid) {
      return; // User will be redirected to login
    }
    
    // Get current form values, falling back to currentUser data
    const currentFormValues = watch();
    const formData = {
      firstName: currentFormValues.firstName || currentUser?.firstName || "",
      lastName: currentFormValues.lastName || currentUser?.lastName || "",
      email: currentFormValues.email || currentUser?.email || "",
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

    console.log("[DEBUG] GCash booking data being sent:", formData);
    bookWithGCash(formData);
  };

  const isLoading = isCardLoading || isGCashLoading || isProcessingPayment;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
      {/* Booking Form */}
      <form 
        onSubmit={(e) => {
          if (paymentMethod === "gcash" || isProcessingPayment) {
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
                  First Name {!currentUser?.firstName && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="text"
                  readOnly={!!currentUser?.firstName}
                  disabled={!!currentUser?.firstName}
                  className={`${currentUser?.firstName ? "bg-gray-50 text-gray-600" : "focus:ring-2 focus:ring-blue-500"} ${errors.firstName ? "border-red-500" : ""}`}
                  value={firstNameValue || ""}
                  {...register("firstName", {
                    required: !currentUser?.firstName ? "First name is required" : false,
                    validate: (value) => {
                      // If user data is loaded, use the loaded data
                      if (currentUser?.firstName) return true;
                      // If user data is not loaded, require manual input
                      return value && value.trim().length > 0 ? true : "First name is required";
                    }
                  })}
                />
                {!currentUser?.firstName && (
                  <p className="text-xs text-gray-500">Please provide your first name</p>
                )}
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Last Name {!currentUser?.lastName && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="text"
                  readOnly={!!currentUser?.lastName}
                  disabled={!!currentUser?.lastName}
                  className={`${currentUser?.lastName ? "bg-gray-50 text-gray-600" : "focus:ring-2 focus:ring-blue-500"} ${errors.lastName ? "border-red-500" : ""}`}
                  value={lastNameValue || ""}
                  {...register("lastName", {
                    required: !currentUser?.lastName ? "Last name is required" : false,
                    validate: (value) => {
                      // If user data is loaded, use the loaded data
                      if (currentUser?.lastName) return true;
                      // If user data is not loaded, require manual input
                      return value && value.trim().length > 0 ? true : "Last name is required";
                    }
                  })}
                />
                {!currentUser?.lastName && (
                  <p className="text-xs text-gray-500">Please provide your last name</p>
                )}
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Email {!currentUser?.email && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="email"
                  readOnly={!!currentUser?.email}
                  disabled={!!currentUser?.email}
                  className={`${currentUser?.email ? "bg-gray-50 text-gray-600" : "focus:ring-2 focus:ring-blue-500"} ${errors.email ? "border-red-500" : ""}`}
                  value={emailValue || ""}
                  {...register("email", {
                    required: !currentUser?.email ? "Email is required" : false,
                    validate: (value) => {
                      // If user data is loaded, use the loaded data
                      if (currentUser?.email) return true;
                      // If user data is not loaded, require manual input with validation
                      if (!value || !value.trim()) return "Email is required";
                      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                      return emailRegex.test(value) ? true : "Invalid email address";
                    }
                  })}
                />
                {!currentUser?.email && (
                  <p className="text-xs text-gray-500">Please provide your email address</p>
                )}
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
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

        {/* Payment Method Selection - Only show if payment is required */}
        {!skipPayment && (
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
                            invalid: {
                              color: "#9e2146",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* GCash Payment Form */}
                {paymentMethod === "gcash" && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
        )}

        {/* Submit Button */}
        {skipPayment ? (
          <Button
            disabled={isLoading}
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirm Booking (No Payment Required)
              </div>
            )}
          </Button>
        ) : paymentMethod === "card" && (
          <Button
            disabled={isLoading || isProcessingPayment || Object.keys(errors).length > 0}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isProcessingPayment ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isProcessingPayment ? "Processing Payment..." : "Processing..."}
              </div>
            ) : Object.keys(errors).length > 0 ? (
              <div className="flex items-center gap-2">
                <span>Please complete required fields</span>
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

