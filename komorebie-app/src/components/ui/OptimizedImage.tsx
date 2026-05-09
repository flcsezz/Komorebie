import React, { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  onLoadComplete?: () => void;
}

/**
 * A performance-focused image component that implements:
 * - Lazy loading by default
 * - Async decoding to prevent main-thread jank
 * - Graceful fade-in transition
 * - Blur-up or themed placeholder
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '',
  loading = 'lazy',
  decoding = 'async',
  aspectRatio = 'auto',
  onLoadComplete,
  style,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoadComplete) onLoadComplete();
  };

  const handleError = () => {
    if (!error && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(true);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden bg-white/5 ${className}`}
      style={{ aspectRatio, ...style }}
    >
      {/* Skeleton/Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      )}

      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
