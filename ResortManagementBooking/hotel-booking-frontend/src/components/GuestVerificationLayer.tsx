import { useState, useRef, useEffect } from "react";
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
import { Badge } from "../components/ui/badge";
import { 
  Users,
  AlertCircle,
  Check,
  X,
  Camera,
  Upload,
  Shield,
  FileText,
  Clock,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  mockOCRFunction,
  ScannedIDResult,
  GuestVerification,
  validateGuestAgainstID,
  calculateVerificationDiscount,
  IDType
} from "../lib/mockOCR";

interface GuestInfo {
  id: string;
  fullName: string;
  idType: IDType;
  idNumber: string;
}

interface GuestVerificationLayerProps {
  totalGuests?: number;
  pricePerPerson: number;
  numberOfNights?: number;
  seniorCount: number;
  pwdCount: number;
  onVerificationComplete: (verifiedGuests: GuestVerification[], discountAmount: number) => void;
}

const GuestVerificationLayer = ({
  pricePerPerson,
  seniorCount,
  pwdCount,
  onVerificationComplete
}: GuestVerificationLayerProps) => {
  // State for discount application toggle
  const [hasDiscount, setHasDiscount] = useState(false);
  
  // State for guest information
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  
  // State for privacy consent
  const [privacyConsent, setPrivacyConsent] = useState(false);
  
  // State for scanning modal
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [currentScanningGuestId, setCurrentScanningGuestId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScannedIDResult | null>(null);
  
  // State for verifications
  const [verifications, setVerifications] = useState<Map<string, GuestVerification>>(new Map());
  
  // State for disclaimer acceptance
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to mask ID number for privacy
  const maskIDNumber = (idNumber: string | null): string => {
    if (!idNumber) return "N/A";
    if (idNumber.length <= 4) return "XXXX";
    // Show only last 4 characters
    return "XXXX-" + idNumber.slice(-4);
  };

  // Function to clear file from memory
  const clearFileFromMemory = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.name);
    }
    setSelectedFile(null);
  };

  // Calculate total discounted guests
  const totalDiscountedGuests = seniorCount + pwdCount;

  // Initialize guest slots when discount is enabled
  useEffect(() => {
    if (hasDiscount && totalDiscountedGuests > 0) {
      const newGuests: GuestInfo[] = [];
      
      // Add senior citizens
      for (let i = 0; i < seniorCount; i++) {
        newGuests.push({
          id: `senior-${i}`,
          fullName: "",
          idType: "senior",
          idNumber: ""
        });
      }
      
      // Add PWD guests
      for (let i = 0; i < pwdCount; i++) {
        newGuests.push({
          id: `pwd-${i}`,
          fullName: "",
          idType: "pwd",
          idNumber: ""
        });
      }
      
      setGuests(newGuests);
    } else {
      setGuests([]);
      setVerifications(new Map());
    }
  }, [hasDiscount, seniorCount, pwdCount]);

  // Update guest info
  const updateGuestInfo = (guestId: string, field: keyof GuestInfo, value: string) => {
    setGuests(prev => prev.map(g => 
      g.id === guestId ? { ...g, [field]: value } : g
    ));
  };

  // Handle scan button click
  const handleScanClick = (guestId: string) => {
    setCurrentScanningGuestId(guestId);
    setScanModalOpen(true);
    setSelectedFile(null);
    setScanResult(null);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle scan/verify button
  const handleVerifyID = async () => {
    if (!selectedFile || !currentScanningGuestId) return;
    
    setIsScanning(true);
    const guest = guests.find(g => g.id === currentScanningGuestId);
    
    if (!guest) {
      setIsScanning(false);
      return;
    }

    try {
      const result = await mockOCRFunction(selectedFile);
      setScanResult(result);
      
      // Auto-verify if successful
      if (result.success && guest.fullName) {
        const verification = validateGuestAgainstID(
          guest.fullName,
          guest.idType,
          result
        );
        
        setVerifications(prev => {
          const newMap = new Map(prev);
          newMap.set(currentScanningGuestId, verification);
          return newMap;
        });
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // Close modal and reset
  const closeScanModal = () => {
    setScanModalOpen(false);
    setCurrentScanningGuestId(null);
    setSelectedFile(null);
    setScanResult(null);
  };

  // Calculate total discount
  const calculateTotalDiscount = (): number => {
    const verifiedArray = Array.from(verifications.values());
    return calculateVerificationDiscount(verifiedArray, pricePerPerson);
  };

  // Get verification status badge
  const getVerificationBadge = (verification: GuestVerification | undefined) => {
    if (!verification) {
      return (
        <Badge variant="outline" className="text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          Not Verified
        </Badge>
      );
    }

    switch (verification.verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "requires_review":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get current guest being scanned
  const currentGuest = guests.find(g => g.id === currentScanningGuestId);

  // Summary of verified guests
  const verifiedGuests = Array.from(verifications.values()).filter(v => v.idVerified);
  const totalDiscount = calculateTotalDiscount();

  // Call onVerificationComplete when verifications change
  useEffect(() => {
    if (hasDiscount && verifications.size > 0) {
      const verifiedArray = Array.from(verifications.values());
      onVerificationComplete(verifiedArray, totalDiscount);
    }
  }, [verifications, hasDiscount, totalDiscount]);

  // Show warning if not all guests are verified
  const unverifiedGuests = guests.filter(g => !verifications.has(g.id) || !verifications.get(g.id)?.idVerified);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Guest Verification Layer
        </CardTitle>
        <CardDescription>
          Verify senior citizen and PWD IDs to avail of discounts
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
            Apply for Senior/PWD/Special Discounts
          </Label>
        </div>

        {/* Guest Information Slots */}
        {hasDiscount && guests.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Discounted Guest Information
              </h3>
              <Badge variant="secondary">
                {guests.length} Guest(s)
              </Badge>
            </div>

            {/* Guest Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guests.map((guest, index) => {
                const verification = verifications.get(guest.id);
                const isVerified = verification?.idVerified;
                
                return (
                  <div 
                    key={guest.id} 
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isVerified 
                        ? "border-green-300 bg-green-50" 
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Guest Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="font-medium">
                          {guest.idType === "senior" ? "Senior Citizen" : "PWD"} #{index + 1}
                        </span>
                      </div>
                      {getVerificationBadge(verification)}
                    </div>

                    {/* Guest Form Fields */}
                    <div className="space-y-3">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Full Name</Label>
                        <Input
                          value={guest.fullName}
                          onChange={(e) => updateGuestInfo(guest.id, "fullName", e.target.value)}
                          placeholder="Enter full name as shown on ID"
                          disabled={isVerified}
                        />
                      </div>

                      {/* ID Type */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">ID Type</Label>
                        <select
                          value={guest.idType}
                          onChange={(e) => updateGuestInfo(guest.id, "idType", e.target.value)}
                          disabled={isVerified}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="senior">Senior Citizen ID</option>
                          <option value="pwd">PWD ID</option>
                          <option value="national_id">National ID</option>
                        </select>
                      </div>

                      {/* ID Number */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">ID Number</Label>
                        <Input
                          value={guest.idNumber}
                          onChange={(e) => updateGuestInfo(guest.id, "idNumber", e.target.value)}
                          placeholder="Enter ID number"
                          disabled={isVerified}
                        />
                      </div>

                      {/* Scan Button */}
                      <Button
                        type="button"
                        variant={isVerified ? "outline" : "default"}
                        size="sm"
                        className={`w-full ${isVerified ? "text-green-600 border-green-300" : ""}`}
                        onClick={() => handleScanClick(guest.id)}
                      >
                        {isVerified ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-Scan ID
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Click to Scan or Upload ID
                          </>
                        )}
                      </Button>

                      {/* Verification Result */}
                      {verification && !isVerified && (
                        <div className={`p-2 rounded text-sm ${
                          verification.verificationStatus === "requires_review" 
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {verification.verificationStatus === "requires_review" 
                            ? "⚠️ ID requires manual review. Please contact staff."
                            : "❌ Verification failed. Please try again."
                          }
                        </div>
                      )}

                      {/* Discount Applied */}
                      {isVerified && verification && (
                        <div className="flex items-center justify-between bg-green-100 p-2 rounded">
                          <span className="text-sm text-green-700">Discount Applied:</span>
                          <span className="font-bold text-green-700">
                            {(verification.discountApplied * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy Consent */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacyConsent"
                  checked={privacyConsent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrivacyConsent(e.target.checked)}
                />
                <Label htmlFor="privacyConsent" className="text-sm cursor-pointer">
                  <span className="font-medium">Privacy Consent</span>
                  <p className="text-gray-600 mt-1">
                    I consent to the upload and processing of my identification documents for 
                    discount verification purposes. I understand that scanned IDs provide 
                    preliminary verification and physical ID must be presented to resort staff 
                    upon check-in for final validation.
                  </p>
                </Label>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-amber-800">Important Disclaimer</p>
                  <p className="text-sm text-amber-700">
                    <strong>Scanning provides preliminary discount verification only.</strong> Physical ID 
                    (Senior Citizen ID or PWD ID) must be presented to Resort Staff for final 
                    validation upon check-in. Failure to provide valid documentation will result 
                    in the standard rate being charged, and any preliminary discount may be revoked.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 ml-8">
                <Checkbox
                  id="acceptedDisclaimer"
                  checked={acceptedDisclaimer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcceptedDisclaimer(e.target.checked)}
                />
                <Label htmlFor="acceptedDisclaimer" className="text-sm cursor-pointer text-amber-800">
                  I understand and accept this disclaimer
                </Label>
              </div>
            </div>

            {/* Verification Summary */}
            {verifications.size > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Verification Summary
                </h4>
                
                <div className="space-y-2">
                  {guests.map((guest, index) => {
                    const verification = verifications.get(guest.id);
                    return (
                      <div 
                        key={guest.id} 
                        className="flex items-center justify-between text-sm bg-white p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          {verification?.idVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{guest.fullName || `${guest.idType === "senior" ? "Senior" : "PWD"} #${index + 1}`}</span>
                          <Badge variant="outline" className="text-xs">
                            {guest.idType === "senior" ? "Senior" : "PWD"}
                          </Badge>
                        </div>
                        <span className={verification?.idVerified ? "text-green-600 font-medium" : "text-gray-400"}>
                          {verification?.idVerified 
                            ? `-₱${(pricePerPerson * verification.discountApplied).toFixed(2)}`
                            : "Not verified"
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total Discount */}
                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="font-bold text-green-800">Total Discount:</span>
                  <span className="font-bold text-green-800 text-lg">
                    -₱{totalDiscount.toFixed(2)}
                  </span>
                </div>

                {/* Verified Count */}
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-4 w-4" />
                  {verifiedGuests.length} of {guests.length} guests verified
                </div>

                {/* Warning if not all verified */}
                {unverifiedGuests.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    {unverifiedGuests.length} guest(s) still need ID verification
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Discount Info */}
        {hasDiscount && totalDiscountedGuests === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-700">
              Please enter the number of senior citizens or PWD guests to proceed with discount verification.
            </p>
          </div>
        )}
      </CardContent>

      {/* ID Scanning Modal */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Smart ID Verification - {currentGuest?.idType === "senior" ? "Senior Citizen" : "PWD"}
            </DialogTitle>
            <DialogDescription>
              Upload your ID for automatic discount verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Loading State */}
            {isScanning && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-lg font-medium text-blue-700 animate-pulse">
                  Analyzing ID for verification...
                </p>
                <p className="text-sm text-gray-500">
                  Please wait while we scan your ID card
                </p>
              </div>
            )}

            {/* Upload Area - Only show when not scanning */}
            {!isScanning && !scanResult && (
              <>
                {/* Live Preview */}
                {selectedFile && (
                  <div className="relative">
                    <div className="border-2 border-blue-200 rounded-lg p-2 bg-gray-50">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="ID Preview"
                        className="w-full h-48 object-contain rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Live Preview - {selectedFile.name}
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                {!selectedFile && (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                      <p className="font-medium text-gray-700">
                        Click to Upload ID
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, PDF
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo Tips */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Tips for a Good ID Photo:
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>✓ Ensure good lighting - avoid glare</li>
                    <li>✓ Keep the ID flat and steady</li>
                    <li>✓ Make sure all text is readable</li>
                    <li>✗ Avoid blurry or dark photos</li>
                    <li>✗ Don't upload random images (cats, etc.)</li>
                  </ul>
                </div>

                {/* Privacy Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="privacyConsent"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="privacyConsent" className="text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Data Privacy Consent</span>
                    <p className="text-gray-500">
                      I consent to the processing of my ID data for discount verification purposes only. 
                      In compliance with the Data Privacy Act of 2012, my information will be encrypted and 
                      securely stored. I can request deletion at any time.
                    </p>
                  </label>
                </div>

                {/* Scan Button */}
                <Button
                  onClick={handleVerifyID}
                  disabled={!selectedFile || !privacyConsent}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {selectedFile ? 'Verify ID' : 'Select an ID first'}
                </Button>

                {/* Privacy Notice */}
                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <p>
                    Your ID data is processed securely and only used for discount verification. 
                    Physical ID required at check-in for verification.
                  </p>
                </div>
              </>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="space-y-4">
                {/* Result Status */}
                <div className={`p-4 rounded-lg ${
                  scanResult.success 
                    ? scanResult.requiresManualReview 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {scanResult.success ? (
                      scanResult.requiresManualReview ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      scanResult.success 
                        ? scanResult.requiresManualReview 
                          ? "text-yellow-700"
                          : "text-green-700"
                        : "text-red-700"
                    }`}>
                      {scanResult.success 
                        ? scanResult.requiresManualReview 
                          ? "Requires Manual Review"
                          : "ID Verified Successfully"
                        : "Scan Failed"
                      }
                    </span>
                  </div>
                </div>

                {/* Extracted Data */}
                {scanResult.success && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <h4 className="font-medium text-gray-700">Extracted Information:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{scanResult.detectedName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">DOB:</span>
                        <span className="ml-2 font-medium">{scanResult.detectedDOB || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <span className="ml-2 font-medium">{scanResult.age || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID Type:</span>
                        <span className="ml-2 font-medium capitalize">{scanResult.detectedIDType || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">ID Number:</span>
                        <span className="ml-2 font-medium font-mono">{maskIDNumber(scanResult.idNumber)}</span>
                        <span className="text-xs text-gray-400 ml-1">(masked for privacy)</span>
                      </div>
                    </div>

                    {/* Eligibility Status */}
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Senior Eligible (≥60):</span>
                        <span className={scanResult.isSenior ? "text-green-600 font-medium" : "text-red-500"}>
                          {scanResult.isSenior ? "✓ Yes" : "✗ No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>PWD Detected:</span>
                        <span className={scanResult.isPWD ? "text-green-600 font-medium" : "text-gray-500"}>
                          {scanResult.isPWD ? "✓ Yes" : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {scanResult.errorMessage && (
                  <div className="text-red-600 text-sm">
                    {scanResult.errorMessage}
                  </div>
                )}

                {/* Manual Review Notice */}
                {scanResult.requiresManualReview && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <strong>⚠️ Manual Review Required:</strong> The scanned ID could not be 
                    automatically verified. Please proceed to reception with your physical ID 
                    for verification.
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={closeScanModal}>
              {scanResult ? "Close" : "Cancel"}
            </Button>
            {!scanResult && (
              <Button 
                onClick={handleVerifyID} 
                disabled={!selectedFile || isScanning || !privacyConsent}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan ID
                  </>
                )}
              </Button>
            )}
            {scanResult && (
              <Button onClick={closeScanModal}>
                Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GuestVerificationLayer;
