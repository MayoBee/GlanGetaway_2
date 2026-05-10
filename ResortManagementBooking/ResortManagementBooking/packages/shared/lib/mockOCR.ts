// Mock OCR Utility for ID Scanning Simulation
// This simulates reading ID text and validating for Senior/PWD discounts

export type IDType = "senior" | "pwd" | "national_id";
export type VerificationStatus = "verified" | "pending" | "requires_review" | "failed";

export interface ScannedIDResult {
  success: boolean;
  extractedText: string;
  detectedName: string | null;
  detectedDOB: string | null;
  detectedIDType: IDType | null;
  idNumber: string | null;
  age: number | null;
  isSenior: boolean;
  isPWD: boolean;
  requiresManualReview: boolean;
  confidenceScore: number; // 0-100 confidence score
  errorMessage?: string;
}

export interface GuestVerification {
  guestName: string;
  idType: IDType;
  idNumber: string;
  idVerified: boolean;
  discountApplied: number; // 0.20 for 20% discount
  verificationStatus: VerificationStatus;
  scannedAt?: Date;
}

// Simulate OCR text extraction from uploaded/scanned ID
export const mockOCRFunction = async (file: File | null): Promise<ScannedIDResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // If no file provided, return error
  if (!file) {
    return {
      success: false,
      extractedText: "",
      detectedName: null,
      detectedDOB: null,
      detectedIDType: null,
      idNumber: null,
      age: null,
      isSenior: false,
      isPWD: false,
      requiresManualReview: true,
      confidenceScore: 0,
      errorMessage: "No file provided. Please upload an image of your ID."
    };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      extractedText: "",
      detectedName: null,
      detectedDOB: null,
      detectedIDType: null,
      idNumber: null,
      age: null,
      isSenior: false,
      isPWD: false,
      requiresManualReview: true,
      confidenceScore: 0,
      errorMessage: "Invalid file type. Please upload a JPG, PNG, or PDF file."
    };
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      extractedText: "",
      detectedName: null,
      detectedDOB: null,
      detectedIDType: null,
      idNumber: null,
      age: null,
      isSenior: false,
      isPWD: false,
      requiresManualReview: true,
      confidenceScore: 0,
      errorMessage: "File too large. Please upload an image smaller than 10MB."
    };
  }

  // Generate mock ID data based on file name (for demo purposes)
  const fileName = file.name.toLowerCase();
  
  // "Cat test" - check for non-ID images
  const nonIDKeywords = ['cat', 'dog', 'selfie', 'landscape', 'food', 'random', 'test'];
  const hasNonIDKeyword = nonIDKeywords.some(keyword => fileName.includes(keyword));
  
  if (hasNonIDKeyword) {
    return {
      success: false,
      extractedText: "",
      detectedName: null,
      detectedDOB: null,
      detectedIDType: null,
      idNumber: null,
      age: null,
      isSenior: false,
      isPWD: false,
      requiresManualReview: true,
      confidenceScore: 15,
      errorMessage: "We couldn't verify your ID details. Please ensure the photo is clear and well-lit, or present your ID manually upon arrival for a rebate."
    };
  }
  
  // Simulate different ID scenarios
  const scenarios = [
    // Valid Senior Citizen ID
    {
      text: "SENIOR CITIZEN ID\nName: JUAN DELA CRUZ\nDate of Birth: 1960-05-15\nID Number: SC20240001\nValid Until: 2028-12-31",
      expected: {
        name: "JUAN DELA CRUZ",
        dob: "1960-05-15",
        type: "senior" as IDType,
        idNumber: "SC20240001",
        age: 65,
        isSenior: true,
        isPWD: false,
        requiresReview: false
      }
    },
    // Valid PWD ID
    {
      text: "PWD ID - PERSON WITH DISABILITY\nName: MARIA SANTOS\nDate of Birth: 1985-03-22\nID Number: PWD20240025\nClassification: Physical Disability",
      expected: {
        name: "MARIA SANTOS",
        dob: "1985-03-22",
        type: "pwd" as IDType,
        idNumber: "PWD20240025",
        age: 40,
        isSenior: false,
        isPWD: true,
        requiresReview: false
      }
    },
    // ID requiring manual review - unclear
    {
      text: "NATIONAL ID\nName: PEDRO REYES\nDate of Birth: UNKNOWN\nID Number: NID202400123",
      expected: {
        name: "PEDRO REYES",
        dob: null,
        type: "national_id" as IDType,
        idNumber: "NID202400123",
        age: null,
        isSenior: false,
        isPWD: false,
        requiresReview: true
      }
    },
    // Senior but too young (not eligible)
    {
      text: "SENIOR CITIZEN ID\nName: ANA LOPEZ\nDate of Birth: 1990-08-10\nID Number: SC20240050",
      expected: {
        name: "ANA LOPEZ",
        dob: "1990-08-10",
        type: "senior" as IDType,
        idNumber: "SC20240050",
        age: 35,
        isSenior: false, // Age < 60
        isPWD: false,
        requiresReview: true // ID says senior but age doesn't qualify
      }
    },
    // Valid Senior - another case
    {
      text: "SENIOR CITIZEN\nName: ROBERTO CARLOS\nDate of Birth: 1962-11-30\nID Number: SC20240089",
      expected: {
        name: "ROBERTO CARLOS",
        dob: "1962-11-30",
        type: "senior" as IDType,
        idNumber: "SC20240089",
        age: 63,
        isSenior: true,
        isPWD: false,
        requiresReview: false
      }
    }
  ];

  // Select scenario based on file name hash or random
  const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const scenarioIndex = hash % scenarios.length;
  const selectedScenario = scenarios[scenarioIndex];

  // Calculate age from DOB
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(selectedScenario.expected.dob || "");

  // Check if age qualifies for senior discount
  const ageEligible = age !== null && age >= 60;
  
  // Generate confidence score based on scenario quality
  let confidenceScore = 85; // Default good score
  if (selectedScenario.expected.requiresReview) {
    confidenceScore = 55; // Lower score for unclear IDs
  }
  if (ageEligible && !selectedScenario.expected.requiresReview) {
    confidenceScore = 95; // High score for clear valid senior ID
  }

  // Add specific error for age < 60 on senior ID
  let errorMessage: string | undefined;
  if (selectedScenario.expected.type === "senior" && age !== null && age < 60) {
    errorMessage = "Age on ID does not qualify for Senior Citizen discount. Must be 60 years or older.";
  }

  return {
    success: true,
    extractedText: selectedScenario.text,
    detectedName: selectedScenario.expected.name,
    detectedDOB: selectedScenario.expected.dob,
    detectedIDType: selectedScenario.expected.type,
    idNumber: selectedScenario.expected.idNumber,
    age: age,
    isSenior: selectedScenario.expected.isSenior && ageEligible,
    isPWD: selectedScenario.expected.isPWD,
    requiresManualReview: selectedScenario.expected.requiresReview || (age === null),
    confidenceScore,
    errorMessage
  };
};

// Validate guest against scanned ID
export const validateGuestAgainstID = (
  guestName: string,
  idType: IDType,
  scannedResult: ScannedIDResult
): GuestVerification => {
  const nameMatch = scannedResult.detectedName?.toLowerCase().includes(guestName.toLowerCase()) || 
                    guestName.toLowerCase().includes(scannedResult.detectedName?.toLowerCase() || "");
  
  let verificationStatus: VerificationStatus = "pending";
  let idVerified = false;
  let discountApplied = 0;

  // Check if verification is possible
  if (!scannedResult.success) {
    verificationStatus = "failed";
  } else if (scannedResult.requiresManualReview) {
    verificationStatus = "requires_review";
  } else if (!nameMatch) {
    verificationStatus = "requires_review"; // Name doesn't match, needs review
  } else {
    // All checks passed
    verificationStatus = "verified";
    idVerified = true;
    
    // Apply discount based on ID type
    if (idType === "senior" && scannedResult.isSenior) {
      discountApplied = 0.20;
    } else if (idType === "pwd" && scannedResult.isPWD) {
      discountApplied = 0.20;
    }
  }

  return {
    guestName,
    idType,
    idNumber: scannedResult.idNumber || "",
    idVerified,
    discountApplied,
    verificationStatus,
    scannedAt: new Date()
  };
};

// Calculate discount amount
export const calculateVerificationDiscount = (
  verifiedGuests: GuestVerification[],
  pricePerPerson: number
): number => {
  return verifiedGuests
    .filter(g => g.idVerified && g.discountApplied > 0)
    .reduce((total, guest) => {
      return total + (pricePerPerson * guest.discountApplied);
    }, 0);
};
