export const filterValidImageUrls = (urls: (string | undefined | null)[]): string[] => {
  return (urls || [])
    .filter((url): url is string => {
      if (url === undefined || url === null) return false;
      const trimmed = url.trim();
      return trimmed.length > 0 && !['undefined', 'null'].includes(trimmed);
    })
    .map(url => url.trim());
};

export const isValidImageUrl = (url: unknown): url is string => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && !['undefined', 'null'].includes(trimmed);
};
