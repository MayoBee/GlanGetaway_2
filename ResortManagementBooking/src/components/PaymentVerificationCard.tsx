import { useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, Download, AlertCircle } from "lucide-react";
import { BookingType } from "../../../shared/types";

type Props = {
  booking: BookingType;
  onVerifyPayment?: (bookingId: string, status: "verified" | "rejected", reason?: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
};

const PaymentVerificationCard = ({ booking, onVerifyPayment, isLoading, showActions = true }: Props) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const gcashPayment = booking.gcashPayment;
  if (!gcashPayment || booking.paymentMethod !== "gcash") {
    return null;
  }

  const handleVerify = () => {
    if (onVerifyPayment) {
      onVerifyPayment(booking._id, "verified");
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    if (onVerifyPayment) {
      onVerifyPayment(booking._id, "rejected", rejectionReason);
    }
    setShowRejectionForm(false);
    setRejectionReason("");
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getStatusColor(gcashPayment.status)}`}>
              {getStatusIcon(gcashPayment.status)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">GCash Payment Verification</h3>
              <p className="text-sm text-gray-600">
                Booking ID: {booking._id.slice(-8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(gcashPayment.status)}`}>
              {gcashPayment.status?.toUpperCase() || "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">GCash Number</label>
            <p className="font-semibold text-gray-900">{gcashPayment.gcashNumber || "Not provided"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Reference Number</label>
            <p className="font-semibold text-gray-900">{gcashPayment.referenceNumber || "Not provided"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Amount Paid</label>
            <p className="font-semibold text-green-600">₱{gcashPayment.amountPaid || 0}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Payment Time</label>
            <p className="font-semibold text-gray-900">
              {gcashPayment.paymentTime 
                ? new Date(gcashPayment.paymentTime).toLocaleString()
                : "Not recorded"
              }
            </p>
          </div>
        </div>

        {/* Screenshot */}
        {gcashPayment.screenshotUrl && (
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Payment Screenshot</label>
            <div className="relative">
              <img
                src={gcashPayment.screenshotUrl}
                alt="Payment screenshot"
                className="w-full max-w-md rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowFullImage(true)}
              />
              <button
                onClick={() => setShowFullImage(true)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Verification Info */}
        {gcashPayment.status === "verified" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Payment Verified</h4>
            </div>
            <p className="text-sm text-green-800">
              Verified by: {gcashPayment.verifiedBy || "System"} on{" "}
              {gcashPayment.verifiedAt 
                ? new Date(gcashPayment.verifiedAt).toLocaleString()
                : "Unknown date"
              }
            </p>
          </div>
        )}

        {gcashPayment.status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-900">Payment Rejected</h4>
            </div>
            <p className="text-sm text-red-800">
              Reason: {gcashPayment.rejectionReason || "No reason provided"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {gcashPayment.status === "pending" && showActions && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Payment
                </span>
              )}
            </button>

            <button
              onClick={() => setShowRejectionForm(true)}
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span className="flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Reject Payment
              </span>
            </button>
          </div>
        )}

        {/* Rejection Form */}
        {showRejectionForm && showActions && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-900 mb-3">Rejection Reason</h4>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please explain why this payment is being rejected..."
              className="w-full border border-red-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isLoading}
                className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectionForm(false);
                  setRejectionReason("");
                }}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && gcashPayment.screenshotUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={gcashPayment.screenshotUrl}
              alt="Payment screenshot full size"
              className="max-w-full max-h-full rounded-lg"
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <a
              href={gcashPayment.screenshotUrl}
              download={`gcash-payment-${booking._id}.jpg`}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationCard;
