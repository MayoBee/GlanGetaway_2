import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Smartphone } from "lucide-react";
import { HotelType } from "../../../shared/types";

type Props = {
  totalCost: number;
  downPaymentAmount: number;
  remainingAmount: number;
  onPaymentSubmit: (paymentData: GCashPaymentData) => void;
  isLoading?: boolean;
  hotel: HotelType;
};

export type GCashPaymentData = {
  gcashNumber: string;
  referenceNumber: string;
  amountPaid: number;
  screenshotFile: File;
  paymentTime: Date;
};

const GCashPaymentForm = ({ totalCost, downPaymentAmount, remainingAmount, onPaymentSubmit, isLoading, hotel }: Props) => {
  // State for resort GCash number
  const [resortGcashNumber, setResortGcashNumber] = useState<string>("09XXXXXXXXX");
  const [isLoadingGcash, setIsLoadingGcash] = useState<boolean>(false);
  
  // Fetch resort GCash number directly
  useEffect(() => {
    const fetchResortGcash = async () => {
      if (!hotel._id) return;
      
      setIsLoadingGcash(true);
      try {
        console.log("Fetching resort GCash for hotel ID:", hotel._id);
        
        // Direct API call to get hotel data with all fields
        const response = await fetch(`http://localhost:7002/api/hotels/${hotel._id}`);
        const hotelData = await response.json();
        
        console.log("Full hotel data received:", hotelData);
        console.log("GCash number from API:", hotelData.gcashNumber);
        
        if (hotelData.gcashNumber && hotelData.gcashNumber.trim() !== "") {
          setResortGcashNumber(hotelData.gcashNumber);
          console.log("Set resort GCash number to:", hotelData.gcashNumber);
        } else {
          console.log("No GCash number found, using fallback");
        }
      } catch (error) {
        console.error("Error fetching resort GCash:", error);
      } finally {
        setIsLoadingGcash(false);
      }
    };
    
    fetchResortGcash();
  }, [hotel._id]);
  
  console.log("Current resort GCash number:", resortGcashNumber);
  
  const [gcashNumber, setGcashNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState(downPaymentAmount);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Abort FileReader on component unmount
  useEffect(() => {
    return () => {
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
    };
  }, []);

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    const file = e.target.files?.[0];
    if (file) {
      console.log("[DEBUG] File selected:", file.name, file.size, file.type);
      console.log("[DEBUG] Stack trace for setScreenshotFile:", new Error().stack);
      setScreenshotFile(file);
      
      // Abort any existing FileReader
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
      
      const reader = new FileReader();
      fileReaderRef.current = reader;
      
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        fileReaderRef.current = null;
      };
      
      reader.onerror = () => {
        fileReaderRef.current = null;
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[DEBUG] GCashPaymentForm handleSubmit called");
    console.log("[DEBUG] screenshotFile:", screenshotFile);
    console.log("[DEBUG] amountPaid:", amountPaid, "downPaymentAmount:", downPaymentAmount);
    
    if (!gcashNumber || gcashNumber.trim() === '') {
      alert("Please enter your GCash number");
      return;
    }

    if (!referenceNumber || referenceNumber.trim() === '') {
      alert("Please enter your GCash reference number");
      return;
    }

    if (!screenshotFile) {
      alert("Please upload a payment screenshot");
      return;
    }

    if (amountPaid < downPaymentAmount) {
      alert(`Amount paid (₱${amountPaid}) is less than required down payment (₱${downPaymentAmount})`);
      return;
    }

    const paymentData: GCashPaymentData = {
      gcashNumber,
      referenceNumber,
      amountPaid,
      screenshotFile,
      paymentTime: new Date(),
    };

    console.log("[DEBUG] Calling onPaymentSubmit with paymentData:", {
      gcashNumber: paymentData.gcashNumber,
      referenceNumber: paymentData.referenceNumber,
      amountPaid: paymentData.amountPaid,
      hasFile: !!paymentData.screenshotFile
    });
    
    onPaymentSubmit(paymentData);
  };

  const clearFile = () => {
    setScreenshotFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" style={{ isolation: 'isolate' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-full">
          <Smartphone className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GCash Payment</h3>
          <p className="text-sm text-gray-600">Upload your payment screenshot to complete booking</p>
        </div>
      </div>

      <div 
        className="space-y-4"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        style={{ isolation: 'isolate' }}
      >
        {/* GCash Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GCash Number
          </label>
          <input
            type="tel"
            value={gcashNumber}
            onChange={(e) => {
              e.stopPropagation();
              setGcashNumber(e.target.value);
            }}
            onFocus={(e) => e.stopPropagation()}
            placeholder="09XXXXXXXXX"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Number
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => {
              e.stopPropagation();
              setReferenceNumber(e.target.value);
            }}
            onFocus={(e) => e.stopPropagation()}
            placeholder="Enter GCash reference number"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Amount Paid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Paid (₱)
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => {
              e.stopPropagation();
              setAmountPaid(Number(e.target.value));
            }}
            onFocus={(e) => e.stopPropagation()}
            min={downPaymentAmount}
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {amountPaid < downPaymentAmount && (
            <p className="text-red-500 text-sm mt-1">
              Amount must be at least ₱{downPaymentAmount} (50% down payment)
            </p>
          )}
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Screenshot
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Payment screenshot"
                  className="max-w-full h-48 mx-auto rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Upload Screenshot
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div className="bg-white p-3 rounded border border-blue-200">
              <div className="font-semibold mb-1">Amount to Send:</div>
              <div className="text-xl font-bold text-green-600">₱{downPaymentAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-500">This is 50% down payment of total cost (₱{totalCost.toFixed(2)})</div>
            </div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Send <strong>₱{downPaymentAmount.toFixed(2)}</strong> to the resort's GCash number <strong>{resortGcashNumber}</strong></li>
              <li>Take a screenshot of the successful transaction</li>
              <li>Upload the screenshot with your GCash details above</li>
              <li>Wait for the resort owner to verify your payment</li>
              <li>Remaining balance (₱{remainingAmount.toFixed(2)}) will be paid on-site</li>
            </ol>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !screenshotFile || amountPaid < downPaymentAmount}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </span>
          ) : (
            "Submit Payment Screenshot"
          )}
        </button>
      </div>
    </div>
  );
};

export default GCashPaymentForm;
