import { DiscountInfo } from "../contexts/BookingSelectionContext";

export interface HotelDiscounts {
  seniorCitizenEnabled: boolean;
  seniorCitizenPercentage: number;
  pwdEnabled: boolean;
  pwdPercentage: number;
}

export interface PricingCalculation {
  total: number;
  downPayment: number;
  remaining: number;
  discountAmount: number;
}

export interface PricingInputs {
  basePrice: number;
  accommodationTotal: number;
  amenitiesTotal: number;
  packagesTotal: number;
  numberOfNights: number;
  depositPercentage: number;
  discountInfo: DiscountInfo | null;
  hotelDiscounts: HotelDiscounts | null;
}

/**
 * Centralized pricing engine to ensure consistency across all components
 */
export class PricingEngine {
  /**
   * Calculate total pricing with discounts
   */
  static calculateTotal(inputs: PricingInputs): PricingCalculation {
    const {
      basePrice,
      accommodationTotal,
      amenitiesTotal,
      packagesTotal,
      numberOfNights,
      depositPercentage,
      discountInfo,
      hotelDiscounts
    } = inputs;

    let total = basePrice + accommodationTotal + amenitiesTotal + packagesTotal;
    let discountAmount = 0;
    
    // Apply discount if applicable
    if (discountInfo && hotelDiscounts) {
      const { type } = discountInfo;
      
      if (type === "pwd" && hotelDiscounts.pwdEnabled) {
        discountAmount = Math.round(total * (hotelDiscounts.pwdPercentage / 100));
      } else if (type === "senior_citizen" && hotelDiscounts.seniorCitizenEnabled) {
        discountAmount = Math.round(total * (hotelDiscounts.seniorCitizenPercentage / 100));
      }
      
      total = total - discountAmount;
    }
    
    const downPayment = Math.round(total * (depositPercentage / 100));
    const remaining = total - downPayment;
    
    return {
      total,
      downPayment,
      remaining,
      discountAmount
    };
  }

  /**
   * Calculate entrance fees based on hotel configuration
   */
  static calculateEntranceFees(
    adultCount: number,
    childCount: number,
    childAges: number[],
    hotel: any,
    rateType: 'day' | 'night'
  ): number {
    if (!hotel) return 0;

    let total = 0;
    const rate = rateType === 'day' ? 'dayRate' : 'nightRate';

    // Adult entrance fees - use default hotel day/night rates
    if (hotel[rate] && hotel[rate] > 0) {
      total += adultCount * hotel[rate];
    }

    // Child entrance fees
    if (hotel.childEntranceFee && hotel.childEntranceFee.length > 0) {
      childAges.forEach((age) => {
        // Find the appropriate age group for this child
        const ageGroup = hotel.childEntranceFee?.find(
          (group: any) => age >= group.minAge && age <= group.maxAge
        );
        
        if (ageGroup) {
          // Child falls within a defined age group
          if (ageGroup[rate] > 0) {
            if (ageGroup.pricingModel === 'per_group') {
              // Per group pricing - one charge covers groupQuantity people
              const groupsNeeded = Math.ceil(1 / (ageGroup.groupQuantity || 1));
              total += groupsNeeded * ageGroup[rate];
            } else {
              // Per head pricing
              total += ageGroup[rate];
            }
          }
          // If ageGroup[rate] is 0, it means free entrance for this age group
        } else {
          // Child does not fall within any defined age group - charge default hotel rate
          if (hotel[rate] && hotel[rate] > 0) {
            total += hotel[rate];
          }
        }
      });
    } else if (childCount > 0 && hotel[rate] && hotel[rate] > 0) {
      // No child age groups defined but there are children - charge all children default hotel rates
      total += childCount * hotel[rate];
    }

    return total;
  }

  /**
   * Validate discount configuration
   */
  static validateDiscountConfig(discounts: HotelDiscounts): boolean {
    return (
      discounts.seniorCitizenPercentage >= 0 && discounts.seniorCitizenPercentage <= 100 &&
      discounts.pwdPercentage >= 0 && discounts.pwdPercentage <= 100 &&
      typeof discounts.seniorCitizenEnabled === 'boolean' &&
      typeof discounts.pwdEnabled === 'boolean'
    );
  }

  /**
   * Get default discount configuration
   */
  static getDefaultDiscounts(): HotelDiscounts {
    return {
      seniorCitizenEnabled: true,
      seniorCitizenPercentage: 20,
      pwdEnabled: true,
      pwdPercentage: 20
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
