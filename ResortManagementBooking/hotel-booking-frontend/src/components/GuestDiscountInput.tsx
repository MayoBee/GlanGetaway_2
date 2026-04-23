import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { 
  Badge 
} from "../components/ui/badge";
import { 
  Users,
  Percent,
  AlertCircle,
  Calculator,
  Info,
  Upload,
  FileText
} from "lucide-react";
import { 
  calculateDiscountSimple, 
  DiscountConfig,
  DiscountCalculationResult,
  validateDiscountInput
} from "../lib/discountCalculation";
import { axiosInstance } from '@glan-getaway/shared-auth';

export type { DiscountCalculationResult };

interface GuestDiscountInputProps {
  totalGuests: number;
  pricePerNight: number;
  numberOfNights: number;
  discountConfig: DiscountConfig;
  onDiscountChange: (result: DiscountCalculationResult) => void;
  bookingId?: string; // Add booking ID for document upload
}

const defaultDiscountConfig: DiscountConfig = {
  seniorCitizenEnabled: true,
  seniorCitizenPercentage: 20,
  pwdEnabled: true,
  pwdPercentage: 20,
  customDiscounts: []
};

const GuestDiscountInputComponent = ({
  totalGuests,
  pricePerNight,
  numberOfNights,
  discountConfig = defaultDiscountConfig,
  onDiscountChange,
  bookingId
}: GuestDiscountInputProps) => {
  const [hasDiscount, setHasDiscount] = useState(false);
  const [seniorCitizens, setSeniorCitizens] = useState(0);
  const [pwdGuests, setPwdGuests] = useState(0);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [discountResult, setDiscountResult] = useState<DiscountCalculationResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Store discountConfig in ref to avoid triggering useEffect on every render
  const discountConfigRef = useRef(discountConfig);
  discountConfigRef.current = discountConfig;

  // Calculate discount whenever inputs change - WITHOUT discountConfig in deps
  useEffect(() => {
    const guestInput = {
      totalGuests,
      seniorCitizens,
      pwdGuests,
      promoCode: "",
      hasDiscount
    };

    const pricingInput = {
      pricePerNight,
      numberOfNights,
      totalGuests,
      guestDiscountInput: guestInput,
      discountConfig: discountConfigRef.current
    };

    const result = calculateDiscountSimple(pricingInput);
    
    if (!result.isValid) {
      setValidationError(result.validationError || "Invalid discount configuration");
      return;
    }

    setValidationError(null);
    setDiscountResult(result);
  }, [hasDiscount, seniorCitizens, pwdGuests, totalGuests, pricePerNight, numberOfNights]);

  // Use ref to store the callback - this won't cause re-renders or infinite loops
  const onDiscountChangeRef = useRef(onDiscountChange);
  onDiscountChangeRef.current = onDiscountChange;

  // Stable callback for parent component - avoids infinite loop
  // Using empty deps ensures this function is only created once
  const stableOnDiscountChange = useCallback((result: DiscountCalculationResult) => {
    onDiscountChangeRef.current(result);
  }, []);
  
  // Track if we've already notified parent to prevent multiple calls
  const hasNotifiedParent = useRef(false);

  // Call stable callback when result changes - only once per result
  useEffect(() => {
    if (discountResult && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;
      stableOnDiscountChange(discountResult);
    } else if (!discountResult) {
      // Reset the ref when discountResult becomes null
      hasNotifiedParent.current = false;
    }
  }, [discountResult, stableOnDiscountChange]);

  const handleSeniorCitizensChange = (value: string) => {
    const count = parseInt(value) || 0;
    setSeniorCitizens(Math.min(count, totalGuests));
  };

  const handlePwdGuestsChange = (value: string) => {
    const count = parseInt(value) || 0;
    setPwdGuests(Math.min(count, totalGuests));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // If we have a booking ID, upload documents immediately
    if (bookingId) {
      setUploading(true);
      try {
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('bookingId', bookingId);
          formData.append('documentType', seniorCitizens > 0 ? 'senior_citizen_id' : 'pwd_id');

          await axiosInstance.post('/api/verification-documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload documents');
      } finally {
        setUploading(false);
      }
    }
  };

  const discountedGuests = seniorCitizens + pwdGuests;
  const remainingGuests = totalGuests - discountedGuests;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-green-600" />
          Guest Discounts
        </CardTitle>
        <CardDescription>
          Apply eligible guest discounts to your booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Discount Toggle */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <Checkbox
            id="hasDiscount"
            checked={hasDiscount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHasDiscount(e.target.checked)}
          />
          <Label htmlFor="hasDiscount" className="font-medium cursor-pointer">
            I have eligible discounts (Senior Citizen / PWD)
          </Label>
        </div>

        {/* Discount Input Fields */}
        {hasDiscount && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Senior Citizens */}
              <div className="space-y-2">
                <Label htmlFor="seniorCitizens" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Senior Citizens
                  {discountConfig.seniorCitizenEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      {discountConfig.seniorCitizenPercentage}% off
                    </Badge>
                  )}
                </Label>
                <Input
                  id="seniorCitizens"
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={seniorCitizens}
                  onChange={(e) => handleSeniorCitizensChange(e.target.value)}
                  placeholder="Number of senior citizens"
                  disabled={!discountConfig.seniorCitizenEnabled}
                />
                {!discountConfig.seniorCitizenEnabled && (
                  <p className="text-xs text-gray-500">Senior citizen discount is not available</p>
                )}
              </div>

              {/* PWD Guests */}
              <div className="space-y-2">
                <Label htmlFor="pwdGuests" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  PWD (Persons with Disabilities)
                  {discountConfig.pwdEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      {discountConfig.pwdPercentage}% off
                    </Badge>
                  )}
                </Label>
                <Input
                  id="pwdGuests"
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={pwdGuests}
                  onChange={(e) => handlePwdGuestsChange(e.target.value)}
                  placeholder="Number of PWD guests"
                  disabled={!discountConfig.pwdEnabled}
                />
                {!discountConfig.pwdEnabled && (
                  <p className="text-xs text-gray-500">PWD discount is not available</p>
                )}
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{validationError}</span>
              </div>
            )}

            {/* Guest Summary */}
            {discountedGuests > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Discount Summary</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{seniorCitizens} Senior Citizen(s) × {discountConfig.seniorCitizenPercentage}% off</p>
                  <p>{pwdGuests} PWD Guest(s) × {discountConfig.pwdPercentage}% off</p>
                  <p>{remainingGuests} Regular Guest(s) at full price</p>
                </div>
              </div>
            )}
          </div>
        )}

        <hr className="my-4" />

        {/* File Upload Section */}
        {hasDiscount && (seniorCitizens > 0 || pwdGuests > 0) && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <Label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Guest Discount Verification
            </Label>
            <p className="text-xs text-gray-500">Select if any guest is a Senior Citizen or Person with Disability (PWD) to avail of discounts. Valid ID must be presented upon check-in.</p>
            
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input type="checkbox" id="hasSeniorGuest" className="h-4 w-4 text-amber-600" />
              <label htmlFor="hasSeniorGuest" className="flex-1 cursor-pointer">
                <span className="font-medium text-amber-800">Senior Citizen</span>
                <span className="text-xs text-amber-600 block">20% discount</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded hover:bg-amber-300">-</button>
                <span className="w-8 text-center font-medium">{seniorCitizens}</span>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded hover:bg-amber-300">+</button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input type="checkbox" id="hasPwdGuest" className="h-4 w-4 text-purple-600" />
              <label htmlFor="hasPwdGuest" className="flex-1 cursor-pointer">
                <span className="font-medium text-purple-800">Person with Disability (PWD)</span>
                <span className="text-xs text-purple-600 block">20% discount</span>
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Verification Instructions</h4>
                    <p className="text-sm text-amber-700 mb-3">Send a PDF or DOCX file containing following:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                      <li><strong>Full names</strong> of Senior Citizens/PWDs (organized by person based on quantity you specified above)</li>
                      <li><strong>Clear pictures</strong> of each person holding their National ID or PWD ID</li>
                    </ol>
                    <p className="text-sm text-amber-600 mt-3 font-medium">⚠️ Final downpayment confirmation will be pending until resort owner verifies the legitimacy of your submitted document.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2" htmlFor="verificationFiles">
                <Upload className="h-4 w-4" />
                Upload Verification Document
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input 
                  id="verificationFiles" 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  multiple 
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="verificationFiles" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload PDF or DOCX files</span>
                  <span className="text-xs text-gray-500">Maximum file size: 10MB per file</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <hr className="my-4" />

        {/* Discount Calculation Display */}
        {discountResult && discountResult.totalSavings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Discount Calculation</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Price:</span>
                <span className="line-through text-gray-400">₱{discountResult.originalPrice.toFixed(2)}</span>
              </div>
              
              {discountResult.discountBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-green-700">
                  <span>{item.category} ({item.count} × {item.percentage}%):</span>
                  <span>-₱{item.discountAmount.toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between font-bold text-green-800 pt-2 border-t border-green-200">
                <span>Total Savings:</span>
                <span>-₱{discountResult.totalSavings.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold text-green-800">
                <span>Final Payable:</span>
                <span>₱{discountResult.finalPayableAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="disclaimer"
              checked={agreedToDisclaimer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreedToDisclaimer(e.target.checked)}
            />
            <Label htmlFor="disclaimer" className="text-sm cursor-pointer">
              I confirm that all information provided is accurate. Senior citizens and PWD guests 
              must present valid ID upon check-in to avail of the discount. Failure to provide 
              valid documentation will result in the standard rate being charged.
            </Label>
          </div>
          {!agreedToDisclaimer && hasDiscount && (
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Please accept the disclaimer to proceed with discounts
            </p>
          )}
        </div>

        {/* Hidden Calculation Result for Form Submission */}
        {discountResult && (
          <input type="hidden" name="discountResult" value={JSON.stringify(discountResult)} />
        )}
      </CardContent>
    </Card>
  );
};

export default GuestDiscountInputComponent;
