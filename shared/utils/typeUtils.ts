export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatCurrency = (amount: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const isObject = (value: any): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
};

export const parseHotelTypes = (types: string[] | string): string[] => {
  if (Array.isArray(types)) {
    return types;
  }
  if (typeof types === 'string') {
    return types.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
};
