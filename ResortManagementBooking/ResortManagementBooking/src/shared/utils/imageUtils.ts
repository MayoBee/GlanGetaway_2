/**
 * Image utility functions for SmartImage component
 */

export const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
