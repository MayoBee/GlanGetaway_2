/**
 * Utility function to parse hotel types from various formats
 * Handles arrays, JSON strings, and single strings
 */
export const parseHotelTypes = (hotelType: any): string[] => {
  if (!hotelType) return [];
  
  if (Array.isArray(hotelType)) {
    return hotelType;
  }
  
  if (typeof hotelType === 'string') {
    try {
      // Try to parse as JSON string like '["Beach Resort","Seaside Resort"]'
      const parsed = JSON.parse(hotelType);
      return Array.isArray(parsed) ? parsed : [hotelType];
    } catch {
      // If parsing fails, treat as single type
      return [hotelType];
    }
  }
  
  return [];
};
