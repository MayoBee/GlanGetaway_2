import React, { useState, useEffect } from "react";
import axios from "axios";
import { axiosInstance } from '@glan-getaway/shared-auth';;
import StripePaymentForm from "./StripePaymentForm";

interface SmartPaymentWidgetProps {
  bookingId: string;
  hotelId: string;
  totalAmount: number;
  depositPercentage?: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentFailed?: (error: any) => void;
}

type PaymentMethod = "gcash" | "bank_transfer" | "stripe";

export const SmartPaymentWidget: React.FC<SmartPaymentWidgetProps> = ({
  bookingId,
  hotelId,
  totalAmount,
  depositPercentage = 50,
  guestName,
  guestEmail,
  guestPhone,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gcash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositSettings, setDepositSettings] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [stripeClientKey, setStripeClientKey] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const depositAmount = Math.round(totalAmount * (depositPercentage / 100));
  const remainingAmount = totalAmount - depositAmount;

  useEffect(() => {
    fetchDepositSettings();
  }, [hotelId]);

  useEffect(() => {
    // Create payment intent when Stripe is selected to get the client secret
    if (paymentMethod === "stripe" && !stripeClientKey) {
      createPaymentIntent();
    }
  }, [paymentMethod]);

  const fetchDepositSettings = async () => {
    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.get(
        `${getApiBaseUrl()}/api/payments/hotel/${hotelId}/deposit-settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDepositSettings(response.data);
    } catch (err) {
      console.error("Error fetching deposit settings:", err);
      // Set default deposit settings if API fails
      setDepositSettings({
        defaultDepositPercentage: 50,
        minimumDeposit: 0, // No minimum - use calculated down payment
        allowFullPayment: true,
        allowInstallment: false,
        paymentMethods: ["gcash", "bank_transfer", "stripe"],
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.post(
        `${getApiBaseUrl()}/api/payments/create-payment-intent`,
        {
          bookingId,
          amount: totalAmount,
          depositPercentage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Set the Stripe client secret from the payment intent response
      if (response.data.clientSecret) {
        setStripeClientKey(response.data.clientSecret);
      }

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create payment");
      onPaymentFailed?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");

      // First create the payment intent
      const paymentData = await createPaymentIntent();
      if (!paymentData) return;

      // Confirm the payment with the payment method
      const response = await axios.post(
        `${getApiBaseUrl()}/api/payments/confirm-stripe-payment`,
        {
          paymentId: paymentData.paymentId,
          paymentMethodId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentStatus("success");
      onPaymentSuccess?.(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment confirmation failed");
      onPaymentFailed?.(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyManualPayment = async () => {
    if (!referenceNumber) {
      setError("Please enter reference number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");

      // First create the payment intent
      const paymentData = await createPaymentIntent();
      if (!paymentData) return;

      // Then verify the manual payment
      const response = await axios.post(
        `${getApiBaseUrl()}/api/payments/verify-manual-payment`,
        {
          paymentId: paymentData.paymentId,
          referenceNumber,
          screenshotUrl: screenshot,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentStatus("success");
      onPaymentSuccess?.(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment verification failed");
      onPaymentFailed?.(err);
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          Payment Verified!
        </h3>
        <p className="text-green-700">
          Your booking has been confirmed. Check your email for confirmation.
        </p>
      </div>
    );
  }

  // Show loading state only while fetching initial data
  if (!depositSettings && initialLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment form...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Deposit Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h3 className="font-bold text-blue-800 mb-2">Deposit Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total Booking:</span>
            <span className="font-medium">PHP {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Deposit ({depositPercentage}%):</span>
            <span className="font-bold text-blue-600">
              PHP {depositAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Remaining (upon check-in):</span>
            <span>PHP {remainingAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPaymentMethod("gcash")}
            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
              paymentMethod === "gcash"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            💚 GCash
          </button>
          <button
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
              paymentMethod === "bank_transfer"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            🏦 Bank
          </button>
          <button
            onClick={() => setPaymentMethod("stripe")}
            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
              paymentMethod === "stripe"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            💳 Card (Stripe)
          </button>
        </div>
      </div>

      {/* Stripe Payment Form */}
      {paymentMethod === "stripe" && (
        <div className="mb-4">
          {loading ? (
            <div className="p-6 flex items-center justify-center py-12">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-circle h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                <p className="text-gray-700">Loading payment form...</p>
              </div>
            </div>
          ) : (
            <StripePaymentForm
              clientKey={stripeClientKey}
              amount={depositAmount}
              onSuccess={handleStripePayment}
              onError={(error) => setError(error)}
            />
          )}
        </div>
      )}

      {/* Manual Payment Fields (for GCash/Bank) */}
      {(paymentMethod === "gcash" || paymentMethod === "bank_transfer") && (
        <>
          {/* Payment Details */}
          {paymentMethod === "gcash" && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Send PHP {depositAmount.toLocaleString()} to:
              </p>
              <p className="font-bold text-gray-800">GCash: 0912 345 6789</p>
              <p className="text-xs text-gray-500">(Resort Name)</p>
            </div>
          )}

          {paymentMethod === "bank_transfer" && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Transfer PHP {depositAmount.toLocaleString()} to:
              </p>
              <p className="font-bold text-gray-800">Bank: BDO</p>
              <p className="font-bold text-gray-800">Account: 1234 5678 90</p>
              <p className="text-xs text-gray-500">(Resort Name)</p>
            </div>
          )}

          {/* Reference Number Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number / Transaction ID
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter reference number"
            />
          </div>

          {/* Screenshot Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Payment Screenshot (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {screenshot && (
              <img
                src={screenshot}
                alt="Payment screenshot"
                className="mt-2 max-h-32 rounded-lg"
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={verifyManualPayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying Payment..." : "Confirm Payment"}
          </button>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 text-center">
        Payment will be verified automatically. You'll receive a confirmation
        email once verified.
      </p>
    </div>
  );
};

export default SmartPaymentWidget;
