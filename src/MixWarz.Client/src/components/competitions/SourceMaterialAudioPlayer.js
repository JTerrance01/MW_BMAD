import React, { useRef, useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { FaMusic } from "react-icons/fa";

const SourceMaterialAudioPlayer = ({
  audioUrl,
  submissionId,
  title = "Anonymous Entry",
  subtitle = "Finalist Submission",
  onPlayStateChange,
  onError,
  disabled = false,
  style = {}
}) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Set up comprehensive event listeners like Source Material player
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log(`🎵 [SourceMaterialPlayer] Play event for submission ${submissionId}`);
      if (onPlayStateChange) onPlayStateChange(submissionId, true);
    };

    const handlePause = () => {
      console.log(`⏸️ [SourceMaterialPlayer] Pause event for submission ${submissionId}`);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleEnded = () => {
      console.log(`🔚 [SourceMaterialPlayer] Ended event for submission ${submissionId}`);
      if (onPlayStateChange) onPlayStateChange(submissionId, false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      console.log(`📀 [SourceMaterialPlayer] Metadata loaded for submission ${submissionId}, duration: ${audio.duration}`);
      setDuration(audio.duration);
    };

    const handleLoadStart = () => {
      console.log(`⏳ [SourceMaterialPlayer] Loading audio for submission ${submissionId}`);
    };

    const handleCanPlay = () => {
      console.log(`✅ [SourceMaterialPlayer] Audio ready for submission ${submissionId}`);
    };

    const handleError = (event) => {
      console.error(`❌ [SourceMaterialPlayer] Audio error for submission ${submissionId}:`, event.target?.error || event);
      if (onError) onError(submissionId, event.target?.error || event);
    };

    // Add all event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      // Clean up all event listeners
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [submissionId, onPlayStateChange, onError]);

  // Format time for display (mm:ss)
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Debug logging
  useEffect(() => {
    console.log(`🎵 [SourceMaterialPlayer] Component mounted for submission ${submissionId}, audioUrl: ${audioUrl}`);
    return () => {
      console.log(`🧹 [SourceMaterialPlayer] Component unmounting for submission ${submissionId}`);
    };
  }, [submissionId, audioUrl]);

  return (
    <Card
      className="border-0 mb-3"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-color)",
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
    >
      <Card.Body className="p-3">
        {/* Header with track info */}
        <div className="d-flex align-items-center mb-3">
          <FaMusic className="me-2" style={{ color: "var(--accent-primary)" }} />
          <div>
            <h6 className="mb-0" style={{ color: "var(--text-primary)" }}>
              {title}
            </h6>
            <small style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </small>
          </div>
        </div>

        {/* Time display for mix engineers */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small style={{ color: "var(--text-secondary)" }}>
            Time: {formatTime(currentTime)} / {formatTime(duration)}
          </small>
          <small style={{ color: "var(--text-secondary)" }}>
            {duration ? `${Math.round((currentTime / duration) * 100)}%` : '0%'}
          </small>
        </div>

        {/* Full-featured HTML5 audio controls - same as Source Material */}
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          disabled={disabled}
          style={{
            width: "100%",
            maxWidth: "100%",
            height: "40px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "4px",
            filter: disabled ? "grayscale(100%)" : "none"
          }}
          className="rounded"
        >
          <source src={audioUrl || ''} type="audio/mpeg" />
          <source src={audioUrl || ''} type="audio/wav" />
          <source src={audioUrl || ''} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>

        {/* Additional info for mix engineers */}
        <div className="mt-2">
          <small style={{ color: "var(--text-secondary)" }}>
            💡 Use the timeline to navigate and the volume control to adjust playback level
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SourceMaterialAudioPlayer; 