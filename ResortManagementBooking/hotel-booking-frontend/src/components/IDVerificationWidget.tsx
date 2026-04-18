import React, { useState, useRef } from "react";
import axios from "axios";
import { axiosInstance } from '@glan-getaway/shared-auth';;

interface IDVerificationWidgetProps {
  bookingId: string;
  hotelId: string;
  guestName: string;
  guestEmail: string;
  onVerified?: (verification: any) => void;
}

type IDType = "passport" | "drivers_license" | "national_id" | "postal_id" | "other";

export const IDVerificationWidget: React.FC<IDVerificationWidgetProps> = ({
  bookingId,
  hotelId,
  guestName,
  guestEmail,
  onVerified,
}) => {
  const [idType, setIdType] = useState<IDType>("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [step, setStep] = useState<"form" | "uploading" | "result">("form");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idNumber || !idImage) {
      setError("Please provide ID number and upload ID image");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("uploading");

    try {
      const token = localStorage.getItem("session_id");

      // Submit verification
      const response = await axios.post(
        `${getApiBaseUrl()}/api/identity-verification/submit`,
        {
          bookingId,
          idType,
          idNumber,
          idImageUrl: idImage, // In production, upload to cloud first
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setVerificationResult(response.data.verification);
      setStep("result");
      onVerified?.(response.data.verification);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 border-green-400 text-green-800";
      case "high_risk":
        return "bg-red-100 border-red-400 text-red-800";
      case "manual_review":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-400 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return "✅";
      case "high_risk":
        return "⚠️";
      case "manual_review":
        return "⏳";
      default:
        return "❓";
    }
  };

  if (step === "result" && verificationResult) {
    return (
      <div
        className={`border-2 rounded-lg p-4 ${getStatusColor(
          verificationResult.status
        )}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">
            {getStatusIcon(verificationResult.status)}
          </span>
          <h3 className="font-bold text-lg">
            {verificationResult.status === "verified"
              ? "ID Verified"
              : verificationResult.status === "high_risk"
              ? "Verification Failed"
              : "Pending Review"}
          </h3>
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Name Match Score:</strong>{" "}
            {verificationResult.nameMatchScore}%
          </p>
          <p>
            <strong>Result:</strong> {verificationResult.nameMatchResult}
          </p>

          {verificationResult.riskFlags &&
            verificationResult.riskFlags.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Risk Flags:</p>
                <ul className="list-disc list-inside">
                  {verificationResult.riskFlags.map(
                    (flag: string, idx: number) => (
                      <li key={idx}>{flag}</li>
                    )
                  )}
                </ul>
              </div>
            )}

          {verificationResult.isFlaggedForFraud && (
            <p className="mt-2 font-bold text-red-600">
              ⚠️ This booking has been flagged for fraud review
            </p>
          )}
        </div>

        {verificationResult.status === "high_risk" && (
          <button
            onClick={() => {
              setStep("form");
              setVerificationResult(null);
            }}
            className="mt-3 w-full bg-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">
          Verifying ID... This may take a few seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-800 mb-3">
        🔐 ID Verification
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Verify your identity to prevent fraud and ensure smooth check-in.
      </p>

      <form onSubmit={submitVerification}>
        {/* ID Type Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Type
          </label>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as IDType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver's License</option>
            <option value="postal_id">Postal ID</option>
            <option value="other">Other Government ID</option>
          </select>
        </div>

        {/* ID Number */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Number
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter ID number"
            required
          />
        </div>

        {/* ID Image Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload ID Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          {idImage && (
            <img
              src={idImage}
              alt="ID preview"
              className="mt-2 max-h-32 rounded-lg mx-auto"
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify My ID"}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Your ID information is encrypted and securely processed.
      </p>
    </div>
  );
};

export default IDVerificationWidget;
