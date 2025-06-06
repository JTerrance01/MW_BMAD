import React, { useState, useRef, useEffect } from "react";
import { Card, Button, ProgressBar } from "react-bootstrap";
import { FaPlay, FaPause, FaVolumeUp, FaExpand } from "react-icons/fa";

const AudioPlayer = ({ 
  audioUrl, 
  entryId, 
  title = "Anonymous Entry",
  onPlayStateChange 
}) => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [waveformData, setWaveformData] = useState([]);

  // Generate mock waveform data (in a real implementation, this would be generated from the audio file)
  useEffect(() => {
    const generateWaveform = () => {
      const data = [];
      for (let i = 0; i < 200; i++) {
        data.push(Math.random() * 0.8 + 0.1); // Random values between 0.1 and 0.9
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = width * progress;

    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on progress
      if (x < progressX) {
        ctx.fillStyle = '#00c8ff'; // Played portion - accent primary
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Unplayed portion
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress line
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();
  }, [waveformData, currentTime, duration]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlayStateChange]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / canvas.width;
    const newTime = clickProgress * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="h-100"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        border: "1px solid var(--border-color)"
      }}
    >
      <Card.Header 
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0" style={{ color: "var(--accent-primary)" }}>
            {title}
          </h6>
          <span 
            className="badge"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "white"
            }}
          >
            Entry #{entryId}
          </span>
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {/* Waveform Display */}
        <div className="mb-3">
          <canvas
            ref={canvasRef}
            width={300}
            height={80}
            style={{
              width: '100%',
              height: '80px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={handleSeek}
          />
        </div>

        {/* Time Display */}
        <div className="d-flex justify-content-between mb-3">
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <ProgressBar 
          now={duration > 0 ? (currentTime / duration) * 100 : 0}
          className="mb-3"
          style={{ height: '4px' }}
        />

        {/* Controls */}
        <div className="d-flex justify-content-between align-items-center">
          <Button
            variant={isPlaying ? "secondary" : "primary"}
            size="lg"
            onClick={handlePlayPause}
            disabled={!audioUrl || isLoading}
            style={{
              backgroundColor: isPlaying ? "var(--bg-tertiary)" : "var(--accent-primary)",
              borderColor: "var(--accent-primary)",
              color: isPlaying ? "var(--text-primary)" : "white",
              width: "60px",
              height: "60px",
              borderRadius: "50%"
            }}
          >
            {isLoading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : isPlaying ? (
              <FaPause size={20} />
            ) : (
              <FaPlay size={20} />
            )}
          </Button>

          <div className="d-flex align-items-center flex-grow-1 ms-3">
            <FaVolumeUp 
              style={{ color: "var(--text-secondary)" }} 
              className="me-2" 
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="form-range flex-grow-1"
              style={{
                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            className="ms-2"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)"
            }}
          >
            <FaExpand />
          </Button>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      </Card.Body>
    </Card>
  );
};

export default AudioPlayer; 