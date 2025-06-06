import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "react-bootstrap";
import { FaPlay, FaPause } from "react-icons/fa";

const AudioControls = forwardRef(({ 
  audioUrl, 
  submissionId, 
  onPlayStateChange,
  onError,
  disabled = false,
  size = "sm",
  variant = "outline-primary",
  style = {}
}, ref) => {
  const audioRef = useRef(null);
  const playPromiseRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => handlePlay(),
    pause: () => handlePause(),
    stop: () => handleStop(),
    getCurrentTime: () => audioRef.current?.currentTime || 0,
    getDuration: () => audioRef.current?.duration || 0,
    setCurrentTime: (time) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    },
    isPlaying: () => audioRef.current && !audioRef.current.paused,
    isReady: () => audioRef.current && audioRef.current.readyState >= 2,
    getAudioElement: () => audioRef.current
  }));

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log(`📀 Audio element not ready for submission ${submissionId}, will retry...`);
      return;
    }

    // Clear any existing src if no audioUrl
    if (!audioUrl) {
      audio.src = '';
      return;
    }

    console.log(`📀 Setting up audio event listeners for submission ${submissionId}, audioUrl: ${audioUrl}`);

    const handlePlay = () => {
      if (onPlayStateChange) onPlayStateChange(submissionId, true);
    };

    const handlePause = () => {
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleEnded = () => {
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleError = (event) => {
      console.error('📀 Audio error for submission', submissionId, ':', event.target?.error || event, 'URL:', audioUrl);
      if (onError) onError(submissionId, event.target?.error || event);
    };

    const handleLoadStart = () => {
      console.log('📀 Loading audio for submission', submissionId, 'from URL:', audioUrl);
    };

    const handleCanPlay = () => {
      console.log('📀 Audio ready for submission', submissionId, 'duration:', audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      if (audio) {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [submissionId, onPlayStateChange, onError, audioUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log(`📀 AudioControls mounted for submission ${submissionId}, audioUrl: ${audioUrl}, disabled: ${disabled}`);
    return () => {
      console.log(`📀 AudioControls unmounting for submission ${submissionId}`);
    };
  }, [submissionId, audioUrl, disabled]);

  // Ensure audio element is properly initialized when audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      // Small delay to ensure the element is fully ready
      const timeoutId = setTimeout(() => {
        if (audio.src !== audioUrl) {
          console.log(`📀 Updating audio src for submission ${submissionId}: ${audioUrl}`);
          audio.src = audioUrl;
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [audioUrl, submissionId]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;

    try {
      // Cancel any pending play promises to avoid interruption errors
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {
          // Ignore interruption errors
        });
      }

      // Reset to beginning if ended
      if (audio.ended) {
        audio.currentTime = 0;
      }

      // Store the play promise to handle interruptions
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (error) {
      playPromiseRef.current = null;
      console.error('Error playing audio for submission', submissionId, ':', error);
      if (onError) onError(submissionId, error);
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Cancel any pending play promises
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {
        // Ignore interruption errors
      });
      playPromiseRef.current = null;
    }

    audio.pause();
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Cancel any pending play promises
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {
        // Ignore interruption errors
      });
      playPromiseRef.current = null;
    }

    audio.pause();
    audio.currentTime = 0;
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    console.log(`📀 Play/Pause clicked for submission ${submissionId}, audio element:`, audio, 'disabled:', disabled, 'audioUrl:', audioUrl);
    
    if (!audio || disabled) {
      console.log(`📀 Cannot play - audio: ${!!audio}, disabled: ${disabled}`);
      return;
    }

    if (audio.paused) {
      console.log(`📀 Starting playback for submission ${submissionId}`);
      handlePlay();
    } else {
      console.log(`📀 Pausing playback for submission ${submissionId}`);
      handlePause();
    }
  };

  const isCurrentlyPlaying = () => {
    return audioRef.current && !audioRef.current.paused;
  };

  return (
    <>
      <Button
        variant={isCurrentlyPlaying() ? "secondary" : variant}
        size={size}
        onClick={handlePlayPause}
        disabled={disabled || !audioUrl}
        style={{
          backgroundColor: isCurrentlyPlaying() ? "var(--accent-primary)" : "transparent",
          color: isCurrentlyPlaying() ? "white" : "var(--accent-primary)",
          borderColor: "var(--accent-primary)",
          opacity: disabled || !audioUrl ? 0.5 : 1,
          ...style
        }}
      >
        {isCurrentlyPlaying() ? <FaPause /> : <FaPlay />}
      </Button>

      {/* Hidden audio element - always render like AudioPlayer */}
      <audio
        ref={audioRef}
        src={audioUrl || ''}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls; 