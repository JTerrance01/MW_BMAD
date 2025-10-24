import React, { useState, useCallback } from 'react';
import { Image } from 'react-bootstrap';
import { FaUser, FaExclamationTriangle } from 'react-icons/fa';

/**
 * SafeImage component that handles SSL certificate errors and other image loading issues
 * Falls back to a default icon when images fail to load
 */
const SafeImage = ({ 
  src, 
  alt, 
  fallbackIcon: FallbackIcon = FaUser, 
  fallbackSize = 64,
  fallbackColor = "text-secondary",
  onError,
  onLoad,
  className = "",
  style = {},
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback((event) => {
    console.warn(`Image failed to load: ${src}`, {
      error: event.type,
      target: event.target,
      message: 'This may be due to SSL certificate issues in development'
    });
    
    setHasError(true);
    setIsLoading(false);
    
    // Call custom error handler if provided
    if (onError) {
      onError(event);
    }
  }, [src, onError]);

  const handleLoad = useCallback((event) => {
    console.log(`Image loaded successfully: ${src}`);
    setIsLoading(false);
    
    // Call custom load handler if provided
    if (onLoad) {
      onLoad(event);
    }
  }, [src, onLoad]);

  // If there was an error or no src, show fallback
  if (hasError || !src) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center ${className}`}
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '50%',
          ...style
        }}
        title={hasError ? 'Image failed to load (SSL certificate issue)' : 'No image available'}
      >
        <FallbackIcon 
          size={fallbackSize} 
          className={fallbackColor}
        />
        {hasError && (
          <FaExclamationTriangle 
            size={12} 
            className="text-warning position-absolute" 
            style={{ top: '5px', right: '5px' }}
            title="SSL Certificate Error"
          />
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={className}
      style={style}
      {...props}
    />
  );
};

export default SafeImage;
