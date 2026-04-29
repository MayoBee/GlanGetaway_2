export const calculateDiscountSimple = (originalPrice: number, discountPercentage: number) => {
  if (!originalPrice || !discountPercentage) return originalPrice;
  const discountAmount = (originalPrice * discountPercentage) / 100;
  return originalPrice - discountAmount;
};

export const calculateDiscountAmount = (originalPrice: number, discountPercentage: number) => {
  if (!originalPrice || !discountPercentage) return 0;
  return (originalPrice * discountPercentage) / 100;
};

export const applyDiscount = (price: number, discountConfig: any) => {
  if (!discountConfig || !discountConfig.enabled) return price;
  return calculateDiscountSimple(price, discountConfig.percentage);
};
