/**
 * Discount Calculation Logic
 * Formula: Discount = (P/G) × N × D
 * Where:
 * - P = Number of discounted guests (senior citizens, PWD, or custom category)
 * - G = Total number of guests
 * - N = Number of nights
 * - D = Daily rate/price per person
 */

export interface DiscountConfig {
  seniorCitizenEnabled: boolean;
  seniorCitizenPercentage: number;
  pwdEnabled: boolean;
  pwdPercentage: number;
  customDiscounts: CustomDiscount[];
}

export interface CustomDiscount {
  id: string;
  name: string;
  percentage: number;
  promoCode: string;
  isEnabled: boolean;
}

export interface GuestDiscountInput {
  totalGuests: number;
  seniorCitizens: number;
  pwdGuests: number;
  promoCode: string;
  hasDiscount: boolean;
}

export interface DiscountCalculationResult {
  originalPrice: number;
  totalSavings: number;
  finalPayableAmount: number;
  discountBreakdown: DiscountBreakdownItem[];
  isValid: boolean;
  validationError?: string;
}

export interface DiscountBreakdownItem {
  category: string;
  count: number;
  percentage: number;
  discountAmount: number;
}

export interface PricingInput {
  pricePerNight: number;
  numberOfNights: number;
  totalGuests: number;
  guestDiscountInput: GuestDiscountInput;
  discountConfig: DiscountConfig;
}

/**
 * Validates discount inputs
 */
export function validateDiscountInput(
  input: GuestDiscountInput,
  totalGuests: number
): { isValid: boolean; error?: string } {
  if (!input.hasDiscount) {
    return { isValid: true };
  }

  if (input.totalGuests <= 0) {
    return { isValid: false, error: "Total guests must be greater than 0" };
  }

  const discountedGuests = input.seniorCitizens + input.pwdGuests;
  
  if (discountedGuests > totalGuests) {
    return { 
      isValid: false, 
      error: `Discounted guests (${discountedGuests}) cannot exceed total guests (${totalGuests})` 
    };
  }

  if (input.seniorCitizens < 0 || input.pwdGuests < 0) {
    return { isValid: false, error: "Guest counts cannot be negative" };
  }

  return { isValid: true };
}

/**
 * Calculate discount based on the formula: Discount = (P/G) × N × D
 * 
 * @param pricingInput - Contains price per night, nights, guests, and discount info
 * @returns Original price, total savings, and final payable amount
 */
export function calculateDiscount(pricingInput: PricingInput): DiscountCalculationResult {
  const { pricePerNight, numberOfNights, totalGuests, guestDiscountInput, discountConfig } = pricingInput;
  
  // Validate input
  const validation = validateDiscountInput(guestDiscountInput, totalGuests);
  if (!validation.isValid) {
    return {
      originalPrice: 0,
      totalSavings: 0,
      finalPayableAmount: 0,
      discountBreakdown: [],
      isValid: false,
      validationError: validation.error
    };
  }

  // If no discount, return full price
  if (!guestDiscountInput.hasDiscount) {
    const originalPrice = pricePerNight * numberOfNights * totalGuests;
    return {
      originalPrice,
      totalSavings: 0,
      finalPayableAmount: originalPrice,
      discountBreakdown: [],
      isValid: true
    };
  }

  // Calculate original total price (P/G × N × D for all guests = N × D × G)
  // But the formula is applied per discounted guest category
  const originalPrice = pricePerNight * numberOfNights * totalGuests;
  const discountBreakdown: DiscountBreakdownItem[] = [];
  let totalSavings = 0;

  // Calculate Senior Citizen Discount
  // Formula: (P/G) × N × D where P = seniorCitizens, G = totalGuests
  if (guestDiscountInput.seniorCitizens > 0 && discountConfig.seniorCitizenEnabled) {
    const proportion = guestDiscountInput.seniorCitizens / totalGuests;
    const nightlyDiscount = proportion * pricePerNight;
    const seniorCitizenDiscount = nightlyDiscount * numberOfNights * discountConfig.seniorCitizenPercentage / 100;
    
    discountBreakdown.push({
      category: "Senior Citizen",
      count: guestDiscountInput.seniorCitizens,
      percentage: discountConfig.seniorCitizenPercentage,
      discountAmount: seniorCitizenDiscount
    });
    
    totalSavings += seniorCitizenDiscount;
  }

  // Calculate PWD Discount
  if (guestDiscountInput.pwdGuests > 0 && discountConfig.pwdEnabled) {
    const proportion = guestDiscountInput.pwdGuests / totalGuests;
    const nightlyDiscount = proportion * pricePerNight;
    const pwdDiscount = nightlyDiscount * numberOfNights * discountConfig.pwdPercentage / 100;
    
    discountBreakdown.push({
      category: "PWD",
      count: guestDiscountInput.pwdGuests,
      percentage: discountConfig.pwdPercentage,
      discountAmount: pwdDiscount
    });
    
    totalSavings += pwdDiscount;
  }

  // Calculate Custom Discount (Promo Code)
  if (guestDiscountInput.promoCode && discountConfig.customDiscounts.length > 0) {
    const matchingPromo = discountConfig.customDiscounts.find(
      promo => promo.promoCode.toUpperCase() === guestDiscountInput.promoCode.toUpperCase() 
        && promo.isEnabled
    );

    if (matchingPromo) {
      // Apply custom discount to the entire booking
      const customDiscount = originalPrice * (matchingPromo.percentage / 100);
      
      discountBreakdown.push({
        category: matchingPromo.name,
        count: totalGuests,
        percentage: matchingPromo.percentage,
        discountAmount: customDiscount
      });
      
      totalSavings += customDiscount;
    }
  }

  const finalPayableAmount = Math.max(0, originalPrice - totalSavings);

  return {
    originalPrice,
    totalSavings,
    finalPayableAmount,
    discountBreakdown,
    isValid: true
  };
}

/**
 * Alternative calculation using simplified per-person approach
 * This is more commonly used in hospitality industry
 */
export function calculateDiscountSimple(pricingInput: PricingInput): DiscountCalculationResult {
  const { pricePerNight, numberOfNights, totalGuests, guestDiscountInput, discountConfig } = pricingInput;
  
  // Validate input
  const validation = validateDiscountInput(guestDiscountInput, totalGuests);
  if (!validation.isValid) {
    return {
      originalPrice: 0,
      totalSavings: 0,
      finalPayableAmount: 0,
      discountBreakdown: [],
      isValid: false,
      validationError: validation.error
    };
  }

  // If no discount, return full price
  if (!guestDiscountInput.hasDiscount && !guestDiscountInput.promoCode) {
    const originalPrice = pricePerNight * numberOfNights * totalGuests;
    return {
      originalPrice,
      totalSavings: 0,
      finalPayableAmount: originalPrice,
      discountBreakdown: [],
      isValid: true
    };
  }

  const basePricePerPerson = pricePerNight * numberOfNights;
  const originalPrice = basePricePerPerson * totalGuests;
  const discountBreakdown: DiscountBreakdownItem[] = [];
  let totalSavings = 0;

  // Senior Citizen Discount
  if (guestDiscountInput.seniorCitizens > 0 && discountConfig.seniorCitizenEnabled) {
    const seniorDiscount = basePricePerPerson * guestDiscountInput.seniorCitizens * (discountConfig.seniorCitizenPercentage / 100);
    discountBreakdown.push({
      category: "Senior Citizen",
      count: guestDiscountInput.seniorCitizens,
      percentage: discountConfig.seniorCitizenPercentage,
      discountAmount: seniorDiscount
    });
    totalSavings += seniorDiscount;
  }

  // PWD Discount
  if (guestDiscountInput.pwdGuests > 0 && discountConfig.pwdEnabled) {
    const pwdDiscount = basePricePerPerson * guestDiscountInput.pwdGuests * (discountConfig.pwdPercentage / 100);
    discountBreakdown.push({
      category: "PWD",
      count: guestDiscountInput.pwdGuests,
      percentage: discountConfig.pwdPercentage,
      discountAmount: pwdDiscount
    });
    totalSavings += pwdDiscount;
  }

  // Custom Promo Code Discount (applied to remaining total)
  if (guestDiscountInput.promoCode && discountConfig.customDiscounts.length > 0) {
    const matchingPromo = discountConfig.customDiscounts.find(
      promo => promo.promoCode.toUpperCase() === guestDiscountInput.promoCode.toUpperCase() 
        && promo.isEnabled
    );

    if (matchingPromo) {
      // Apply promo to the post-standard-discount total
      const afterStandardDiscounts = originalPrice - totalSavings;
      const promoDiscount = afterStandardDiscounts * (matchingPromo.percentage / 100);
      
      discountBreakdown.push({
        category: matchingPromo.name,
        count: totalGuests,
        percentage: matchingPromo.percentage,
        discountAmount: promoDiscount
      });
      
      totalSavings += promoDiscount;
    }
  }

  const finalPayableAmount = Math.max(0, originalPrice - totalSavings);

  return {
    originalPrice,
    totalSavings,
    finalPayableAmount,
    discountBreakdown,
    isValid: true
  };
}

/**
 * Generate a unique promo code
 */
export function generatePromoCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PROMO-';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate a promo code
 */
export function validatePromoCode(
  promoCode: string,
  discountConfig: DiscountConfig
): { isValid: boolean; discount?: CustomDiscount; error?: string } {
  if (!promoCode) {
    return { isValid: false, error: "Promo code is required" };
  }

  const matchingPromo = discountConfig.customDiscounts.find(
    promo => promo.promoCode.toUpperCase() === promoCode.toUpperCase()
  );

  if (!matchingPromo) {
    return { isValid: false, error: "Invalid promo code" };
  }

  if (!matchingPromo.isEnabled) {
    return { isValid: false, error: "This promo code is no longer active" };
  }

  return { isValid: true, discount: matchingPromo };
}
