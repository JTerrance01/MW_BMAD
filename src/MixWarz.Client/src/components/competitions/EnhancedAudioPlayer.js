import React, { useRef, useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaPlay, FaPause, FaExclamationTriangle } from "react-icons/fa";

const EnhancedAudioPlayer = ({ 
  audioUrl, 
  submissionId, 
  onPlayStateChange,
  onError,
  disabled = false,
  size = "sm",
  variant = "outline-primary",
  style = {},
  fallbackUrls = [] // Array of fallback URLs to try
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  // Process and clean audio URLs
  const processAudioUrl = (url) => {
    if (!url) return null;
    
    console.log(`🎵 [EnhancedAudioPlayer] Processing URL: ${url}`);
    
    // Handle double uploads/ in path
    if (url.includes('/uploads/uploads/')) {
      const fixedUrl = url.replace(/\/uploads\/uploads\//g, '/uploads/');
      console.log(`🎵 [EnhancedAudioPlayer] Fixed double uploads: ${fixedUrl}`);
      return fixedUrl;
    }
    
    // Handle relative paths
    if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://localhost:7001';
      let cleanPath = url.startsWith('/') ? url.slice(1) : url;
      
      // Fix double uploads/ in relative path
      if (cleanPath.startsWith('uploads/uploads/')) {
        cleanPath = cleanPath.replace('uploads/uploads/', 'uploads/');
      }
      
      const fullUrl = `${baseUrl}/${cleanPath}`;
      console.log(`🎵 [EnhancedAudioPlayer] Built absolute URL: ${fullUrl}`);
      return fullUrl;
    }
    
    // Handle double-encoded URLs
    if (url.includes('%3A//localhost%3A')) {
      try {
        const decodedUrl = decodeURIComponent(url);
        const match = decodedUrl.match(/https?:\/\/localhost:\d+\/uploads\/.+$/);
        if (match) {
          const cleanUrl = match[0];
          console.log(`🎵 [EnhancedAudioPlayer] Cleaned double-encoded URL: ${cleanUrl}`);
          return cleanUrl;
        }
      } catch (e) {
        console.warn(`🎵 [EnhancedAudioPlayer] Error decoding URL: ${e.message}`);
      }
    }
    
    return url;
  };

  // Get all possible URLs to try (main + fallbacks)
  const getAllUrls = () => {
    const urls = [audioUrl, ...fallbackUrls].filter(Boolean);
    return urls.map(processAudioUrl).filter(Boolean);
  };

  // Get current URL to try
  const getCurrentUrl = () => {
    const urls = getAllUrls();
    return urls[currentUrlIndex] || null;
  };

  // Try next URL on error
  const tryNextUrl = () => {
    const urls = getAllUrls();
    const nextIndex = currentUrlIndex + 1;
    
    if (nextIndex < urls.length) {
      console.log(`🎵 [EnhancedAudioPlayer] Trying fallback URL ${nextIndex}: ${urls[nextIndex]}`);
      setCurrentUrlIndex(nextIndex);
      setHasError(false);
      setIsLoading(true);
      return true;
    }
    
    console.error(`🎵 [EnhancedAudioPlayer] All URLs failed for submission ${submissionId}`);
    setHasError(true);
    setIsLoading(false);
    return false;
  };

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setHasError(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleLoadStart = () => {
      console.log(`🎵 [EnhancedAudioPlayer] Loading audio for submission ${submissionId}`);
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log(`🎵 [EnhancedAudioPlayer] Audio ready for submission ${submissionId}`);
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = (event) => {
      const error = event.target?.error;
      console.error(`🎵 [EnhancedAudioPlayer] Audio error for submission ${submissionId}:`, error, 'URL:', getCurrentUrl());
      
      setIsPlaying(false);
      setIsLoading(false);
      
      // Try next URL if available
      if (!tryNextUrl()) {
        if (onError) onError(submissionId, error);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [submissionId, onPlayStateChange, onError, currentUrlIndex]);

  // Reset URL index when audioUrl changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(false);
    setIsPlaying(false);
  }, [audioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    const currentUrl = getCurrentUrl();
    
    if (!audio || disabled || !currentUrl || hasError) {
      console.log(`🎵 [EnhancedAudioPlayer] Cannot play - disabled: ${disabled}, hasError: ${hasError}, currentUrl: ${currentUrl}`);
      return;
    }

    if (isPlaying) {
      console.log(`🎵 [EnhancedAudioPlayer] Pausing submission ${submissionId}`);
      audio.pause();
    } else {
      console.log(`🎵 [EnhancedAudioPlayer] Playing submission ${submissionId} from: ${currentUrl}`);
      audio.play().catch(error => {
        console.error(`🎵 [EnhancedAudioPlayer] Error playing audio:`, error);
        if (!tryNextUrl() && onError) {
          onError(submissionId, error);
        }
      });
    }
  };

  const currentUrl = getCurrentUrl();
  const isDisabled = disabled || !currentUrl || hasError;

  return (
    <>
      <Button
        variant={isPlaying ? "secondary" : variant}
        size={size}
        onClick={handlePlayPause}
        disabled={isDisabled || isLoading}
        style={{
          backgroundColor: isPlaying ? "var(--accent-primary)" : "transparent",
          color: isPlaying ? "white" : hasError ? "#dc3545" : "var(--accent-primary)",
          borderColor: hasError ? "#dc3545" : "var(--accent-primary)",
          opacity: isDisabled ? 0.5 : 1,
          ...style
        }}
        title={hasError ? "Audio unavailable" : isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <Spinner size="sm" animation="border" />
        ) : hasError ? (
          <FaExclamationTriangle />
        ) : isPlaying ? (
          <FaPause />
        ) : (
          <FaPlay />
        )}
      </Button>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentUrl || ''}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </>
  );
};

export default EnhancedAudioPlayer; 