import React from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  showLoading?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

export const SmartImage = ({ src, alt, className = '', fallbackText = 'No Image Available', showLoading = true, onError, onLoad }: SmartImageProps) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      {loading && showLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          {fallbackText}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default SmartImage;
