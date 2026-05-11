export const getHotelsSearchUrl = (params?: any) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
};
