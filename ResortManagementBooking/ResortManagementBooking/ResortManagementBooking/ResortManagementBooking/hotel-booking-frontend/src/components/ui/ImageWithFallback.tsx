import React, { useState, useCallback } from 'react';
import { Skeleton } from './skeleton';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  retryCount?: number;
  placeholder?: string;
}

const DEFAULT_FALLBACKS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de5d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop'
];

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="system-ui" font-size="14" text-anchor="middle" x="200" y="150"%3EHotel Image%3C/text%3E%3C/svg%3E';

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  onLoad,
  onError,
  retryCount = 3,
  placeholder = DEFAULT_PLACEHOLDER
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn(`Image failed to load: ${currentSrc}`, error);
    
    if (currentRetry < retryCount) {
      // Retry the same image
      setCurrentRetry(prev => prev + 1);
      // Force reload by adding timestamp
      const reloadSrc = `${src}?retry=${Date.now()}`;
      setCurrentSrc(reloadSrc);
    } else if (fallbackSrc && !usePlaceholder) {
      // Try fallback image
      console.log('Trying fallback image:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setCurrentRetry(0);
    } else if (!usePlaceholder) {
      // Try default fallbacks
      const fallbackIndex = Math.floor(Math.random() * DEFAULT_FALLBACKS.length);
      const defaultFallback = DEFAULT_FALLBACKS[fallbackIndex];
      console.log('Trying default fallback:', defaultFallback);
      setCurrentSrc(defaultFallback);
      setCurrentRetry(0);
      setUsePlaceholder(true);
    } else {
      // Final fallback to placeholder
      console.log('Using placeholder image');
      setCurrentSrc(placeholder);
      setImageState('error');
      onError?.(error);
    }
  }, [src, fallbackSrc, currentRetry, retryCount, usePlaceholder, onError]);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  // Reset state when src changes
  React.useEffect(() => {
    if (src !== currentSrc && !usePlaceholder) {
      setImageState('loading');
      setCurrentSrc(src);
      setCurrentRetry(0);
      setUsePlaceholder(false);
    }
  }, [src, currentSrc, usePlaceholder]);

  if (imageState === 'loading') {
    return <Skeleton className={className} />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      style={{
        opacity: imageState === 'loaded' ? 1 : 0.7,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default ImageWithFallback;
