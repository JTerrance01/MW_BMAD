import React, { useRef, useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaPlay, FaPause, FaExclamationTriangle } from "react-icons/fa";

const SimpleResultsAudioPlayer = ({ 
  audioUrl, 
  submissionId, 
  onPlayStateChange,
  onError,
  disabled = false,
  size = "sm",
  variant = "outline-primary",
  style = {}
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Reset state when audioUrl changes
  useEffect(() => {
    console.log(`🎵 [SimpleResultsAudioPlayer] Audio URL changed:`, audioUrl);
    setHasError(false);
    setIsLoading(false);
    setIsPlaying(false);
    
    // Reset audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log(`🎵 [SimpleResultsAudioPlayer] Playing submission ${submissionId}`);
      setIsPlaying(true);
      setHasError(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, true);
    };

    const handlePause = () => {
      console.log(`🎵 [SimpleResultsAudioPlayer] Paused submission ${submissionId}`);
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleEnded = () => {
      console.log(`🎵 [SimpleResultsAudioPlayer] Ended submission ${submissionId}`);
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleLoadStart = () => {
      console.log(`🎵 [SimpleResultsAudioPlayer] Loading audio for submission ${submissionId}`);
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log(`🎵 [SimpleResultsAudioPlayer] Audio ready for submission ${submissionId}`);
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = (event) => {
      const error = event.target?.error;
      console.error(`🎵 [SimpleResultsAudioPlayer] Audio error for submission ${submissionId}:`, {
        error,
        code: error?.code,
        message: error?.message,
        url: audioUrl,
        mediaError: audio.error
      });
      
      setIsPlaying(false);
      setIsLoading(false);
      setHasError(true);
      
      if (onError) onError(submissionId, error);
    };

    // Add event listeners
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
  }, [submissionId, onPlayStateChange, onError, audioUrl]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    
    if (!audio || disabled || !audioUrl || hasError) {
      console.log(`🎵 [SimpleResultsAudioPlayer] Cannot play - disabled: ${disabled}, hasError: ${hasError}, audioUrl: ${audioUrl}`);
      return;
    }

    try {
      if (isPlaying) {
        console.log(`🎵 [SimpleResultsAudioPlayer] Pausing submission ${submissionId}`);
        audio.pause();
      } else {
        console.log(`🎵 [SimpleResultsAudioPlayer] Playing submission ${submissionId} from: ${audioUrl}`);
        await audio.play();
      }
    } catch (error) {
      console.error(`🎵 [SimpleResultsAudioPlayer] Error playing audio:`, error);
      setHasError(true);
      setIsPlaying(false);
      if (onError) onError(submissionId, error);
    }
  };

  const isDisabled = disabled || !audioUrl || hasError;

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

      {/* Hidden audio element - URL is already processed by backend */}
      <audio
        ref={audioRef}
        src={audioUrl || ''}
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && hasError && (
        <div style={{ fontSize: '10px', color: '#dc3545', marginTop: '4px' }}>
          Failed to load audio
        </div>
      )}
    </>
  );
};

export default SimpleResultsAudioPlayer; 