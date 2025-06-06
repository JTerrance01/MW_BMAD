import React, { useRef, useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { FaPlay, FaPause } from "react-icons/fa";

const SimpleAudioPlayer = ({ 
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

  // Set up event listeners - same pattern as AudioPlayer
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
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
      console.log('📀 [SimpleAudioPlayer] Loading audio for submission', submissionId, 'from URL:', audioUrl);
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('📀 [SimpleAudioPlayer] Audio ready for submission', submissionId, 'duration:', audio.duration);
      setIsLoading(false);
    };

    const handleError = (event) => {
      console.error('📀 [SimpleAudioPlayer] Audio error for submission', submissionId, ':', event.target?.error || event, 'URL:', audioUrl);
      setIsLoading(false);
      if (onError) onError(submissionId, event.target?.error || event);
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
  }, [submissionId, onPlayStateChange, onError, audioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    console.log(`📀 [SimpleAudioPlayer] Play/Pause clicked for submission ${submissionId}, audio element:`, audio, 'disabled:', disabled, 'audioUrl:', audioUrl);
    
    if (!audio || disabled) {
      console.log(`📀 [SimpleAudioPlayer] Cannot play - audio: ${!!audio}, disabled: ${disabled}`);
      return;
    }

    if (isPlaying) {
      console.log(`📀 [SimpleAudioPlayer] Pausing submission ${submissionId}`);
      audio.pause();
    } else {
      console.log(`📀 [SimpleAudioPlayer] Playing submission ${submissionId}`);
      audio.play().catch(error => {
        console.error('📀 [SimpleAudioPlayer] Error playing audio:', error);
        if (onError) onError(submissionId, error);
      });
    }
  };

  // Debug logging
  useEffect(() => {
    console.log(`📀 [SimpleAudioPlayer] Component mounted for submission ${submissionId}, audioUrl: ${audioUrl}, disabled: ${disabled}`);
    return () => {
      console.log(`📀 [SimpleAudioPlayer] Component unmounting for submission ${submissionId}`);
    };
  }, [submissionId, audioUrl, disabled]);

  return (
    <>
      <Button
        variant={isPlaying ? "secondary" : variant}
        size={size}
        onClick={handlePlayPause}
        disabled={disabled || !audioUrl || isLoading}
        style={{
          backgroundColor: isPlaying ? "var(--accent-primary)" : "transparent",
          color: isPlaying ? "white" : "var(--accent-primary)",
          borderColor: "var(--accent-primary)",
          opacity: disabled || !audioUrl ? 0.5 : 1,
          ...style
        }}
      >
        {isLoading ? (
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : isPlaying ? (
          <FaPause />
        ) : (
          <FaPlay />
        )}
      </Button>

      {/* Hidden audio element - always rendered like AudioPlayer */}
      <audio
        ref={audioRef}
        src={audioUrl || ''}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </>
  );
};

export default SimpleAudioPlayer; 