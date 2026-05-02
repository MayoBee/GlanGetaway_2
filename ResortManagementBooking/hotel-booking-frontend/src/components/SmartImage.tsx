import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { axiosInstance } from "../api-client";

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:7002';
};

interface SmartImageProps {
  src?: string | string[];
  alt: string;
  className?: string;
  fallbackText?: string;
  showLoading?: boolean;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  maxRetries?: number;
  retryDelay?: number;
  fallbackImageUrl?: string;
}

const DEFAULT_FALLBACK_IMAGE = '/placeholder-resort.jpg';

// Enhanced fallback images for Unsplash failures
const UNSPLASH_FALLBACKS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de5d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop'
];

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'No Image Available',
  showLoading = true,
  onError,
  onLoad,
  maxRetries = 3,
  retryDelay = 1000,
  fallbackImageUrl = DEFAULT_FALLBACK_IMAGE
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced logging function
  const logImageEvent = useCallback((event: string, details: any) => {
    console.log(`🖼️ SmartImage [${event}]:`, {
      src: currentSrc,
      originalSrc: src,
      retryCount,
      timestamp: new Date().toISOString(),
      ...details
    });
  }, [currentSrc, src, retryCount]);

  // Process image sources with enhanced validation
  const processImageSources = useCallback((sources: string | string[] | undefined): string[] => {
    let sourcesArray: string[] = [];
    
    if (sources) {
      sourcesArray = Array.isArray(sources) ? sources : [sources];
    }
    
    // Add fallback image as last resort if provided
    if (fallbackImageUrl && !sourcesArray.includes(fallbackImageUrl)) {
      sourcesArray.push(fallbackImageUrl);
    }
    
    // Add Unsplash fallbacks if this looks like an Unsplash URL that might timeout
    const hasUnsplashUrl = sourcesArray.some(src => src.includes('unsplash.com'));
    if (hasUnsplashUrl) {
      UNSPLASH_FALLBACKS.forEach(fallback => {
        if (!sourcesArray.includes(fallback)) {
          sourcesArray.push(fallback);
        }
      });
    }
    
    const apiBaseUrl = getApiBaseUrl();
    
    const processedSources = sourcesArray.map((source, index) => {
      if (!source) {
        logImageEvent('EMPTY_SOURCE', { index, message: 'Empty source encountered' });
        return null; // Return null instead of empty string to filter it out
      }
      
      try {
        const url = new URL(source);
        
        // Fix port issues by using current API base URL
        if (url.hostname === 'localhost') {
          // Construct new URL with correct port from API base URL
          const apiUrl = new URL(apiBaseUrl);
          url.port = apiUrl.port;
          url.hostname = apiUrl.hostname;
          url.protocol = apiUrl.protocol;
          const fixedUrl = url.toString();
          logImageEvent('URL_FIXED', { 
            original: source, 
            fixed: fixedUrl,
            apiBaseUrl 
          });
          return fixedUrl;
        }
        
        return source;
      } catch (e) {
        logImageEvent('INVALID_URL', { 
          source, 
          index, 
          error: e instanceof Error ? e.message : 'Unknown error' 
        });
        return null; // Return null instead of empty string to filter it out
      }
    }).filter((source): source is string => source !== null);
    
    logImageEvent('SOURCES_PROCESSED', { 
      originalCount: sourcesArray.length,
      validCount: processedSources.length,
      sources: processedSources 
    });
    
    return processedSources;
  }, [logImageEvent, fallbackImageUrl]);

  useEffect(() => {
    // Early return if src is empty, undefined, or empty string
    if (!src || (typeof src === 'string' && src.trim() === '')) {
      logImageEvent('NO_SRC_PROVIDED', { message: 'No src prop provided or src is empty' });
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const sources = processImageSources(src);
    if (sources.length === 0) {
      logImageEvent('NO_VALID_SOURCES', { message: 'No valid image sources found' });
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Try each source until one works
    const tryNextSource = (sourceIndex: number = 0, attemptCount: number = 0) => {
      if (sourceIndex >= sources.length) {
        logImageEvent('ALL_SOURCES_FAILED', { 
          totalSources: sources.length,
          message: 'All image sources failed to load' 
        });
        setIsLoading(false);
        setHasError(true);
        onError?.(new Error(`Failed to load all image sources after ${attemptCount} attempts`));
        return;
      }

      const source = sources[sourceIndex];
      setCurrentSrc(source);
      setIsLoading(true);
      setHasError(false);

      logImageEvent('ATTEMPTING_LOAD', { 
        source, 
        sourceIndex, 
        attemptCount,
        totalSources: sources.length 
      });

      // Create test image to verify it loads
      const testImg = new Image();
      
      // Set timeout for image loading (especially for Unsplash URLs)
      const timeoutId = setTimeout(() => {
        logImageEvent('LOAD_TIMEOUT', { 
          source, 
          sourceIndex, 
          attemptCount,
          timeout: 10000
        });
        
        // For Unsplash URLs, move to next source immediately on timeout
        if (source.includes('unsplash.com')) {
          if (sourceIndex < sources.length - 1) {
            tryNextSource(sourceIndex + 1, 0);
          } else {
            setIsLoading(false);
            setHasError(true);
            onError?.(new Error(`Unsplash image timeout: ${source}`));
          }
        } else if (attemptCount < maxRetries) {
          // Retry non-Unsplash URLs
          setTimeout(() => {
            tryNextSource(sourceIndex, attemptCount + 1);
          }, retryDelay * (attemptCount + 1));
        } else {
          setIsLoading(false);
          setHasError(true);
          onError?.(new Error(`Image timeout after ${maxRetries} retries: ${source}`));
        }
      }, 10000); // 10 second timeout
      
      testImg.onload = () => {
        clearTimeout(timeoutId);
        logImageEvent('LOAD_SUCCESS', { 
          source, 
          sourceIndex, 
          attemptCount,
          loadTime: Date.now() 
        });
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
      };
      
      testImg.onerror = (error) => {
        clearTimeout(timeoutId);
        logImageEvent('LOAD_ERROR', { 
          source, 
          sourceIndex, 
          attemptCount,
          error: error || 'Unknown image loading error' 
        });
        
        // Retry logic for current source
        if (attemptCount < maxRetries) {
          setTimeout(() => {
            tryNextSource(sourceIndex, attemptCount + 1);
          }, retryDelay * (attemptCount + 1)); // Exponential backoff
        } else if (sourceIndex < sources.length - 1) {
          // Move to next source
          tryNextSource(sourceIndex + 1, 0);
        } else {
          // All sources failed after all retries
          logImageEvent('FINAL_FAILURE', { 
            totalSources: sources.length,
            maxRetries,
            message: 'All sources failed after maximum retries' 
          });
          setIsLoading(false);
          setHasError(true);
          onError?.(new Error(`Failed to load all image sources after ${maxRetries} retries each`));
        }
      };
      
      testImg.src = source;
    };

    tryNextSource();
  }, [src, retryCount, maxRetries, retryDelay, logImageEvent, processImageSources, onError, onLoad]);

  const handleRetry = () => {
    logImageEvent('MANUAL_RETRY', { 
      currentSrc, 
      retryCount: retryCount + 1 
    });
    setRetryCount(prev => prev + 1);
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">{fallbackText}</p>
          <button
            onClick={handleRetry}
            className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 underline mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && showLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={() => {
        setIsLoading(false);
        onLoad?.();
      }}
      onError={() => {
        setHasError(true);
        setIsLoading(false);
        onError?.(new Error(`Failed to load image: ${currentSrc}`));
      }}
      style={{ display: isLoading ? 'none' : 'block' }}
    />
  );
};

export default SmartImage;

