import React, { useState, useRef } from "react";
import { Card, Button, Alert, Spinner, Modal } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { deleteUserSubmission } from "../../store/competitionSlice";
import { FaMusic, FaPlay, FaPause, FaTrash, FaCalendarAlt, FaClock } from "react-icons/fa";

const UserSubmissionCard = ({ submission, competitionId, canDelete = false, onDeleted }) => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [audioError, setAudioError] = useState("");

  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Handle the promise returned by audio.play()
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio playback started successfully
            setIsPlaying(true);
            setAudioError(""); // Clear any previous errors
          })
          .catch(error => {
            // Handle play() failures
            console.warn("Audio play was interrupted or failed:", error);
            setIsPlaying(false);
            
            // Only show error message for non-AbortError cases
            if (error.name !== 'AbortError') {
              setAudioError("Unable to play audio. Please try again.");
            }
          });
      } else {
        // Fallback for older browsers
        setIsPlaying(true);
      }
    }
  };

  // Handle audio events
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = (e) => {
    console.error("Audio loading error:", e);
    const audio = audioRef.current;
    if (audio && audio.error) {
      let errorMessage = "Unable to load audio file";
      switch (audio.error.code) {
        case audio.error.MEDIA_ERR_ABORTED:
          errorMessage = "Audio loading was aborted";
          break;
        case audio.error.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading audio";
          break;
        case audio.error.MEDIA_ERR_DECODE:
          errorMessage = "Audio format not supported";
          break;
        case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Audio file not found or format not supported";
          break;
        default:
          errorMessage = "Unknown audio loading error";
      }
      setAudioError(errorMessage);
    }
    setIsPlaying(false);
  };

  const handleCanPlay = () => {
    setAudioError(""); // Clear any previous errors
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progressBar = e.currentTarget;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.warn("Error setting audio currentTime:", error);
      // Don't show user error for this minor issue
    }
  };

  // Handle delete submission
  const handleDeleteSubmission = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const result = await dispatch(
        deleteUserSubmission({
          competitionId,
          submissionId: submission.submissionId
        })
      ).unwrap();

      if (result.success) {
        setShowDeleteModal(false);
        if (onDeleted) {
          onDeleted();
        }
      }
    } catch (error) {
      setDeleteError(error.message || "Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <Card
        className="border-0 shadow-sm mb-4"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
              <FaMusic className="me-2" /> Your Submission
            </h5>
            {canDelete && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
              >
                <FaTrash className="me-1" />
                Delete
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <h6 style={{ color: "var(--text-primary)" }}>{submission.mixTitle}</h6>
            {submission.mixDescription && (
              <p style={{ color: "var(--text-secondary)" }}>
                {submission.mixDescription}
              </p>
            )}
          </div>

          <div className="mb-3 d-flex align-items-center text-sm">
            <FaCalendarAlt className="me-2" style={{ color: "var(--accent-primary)" }} />
            <span style={{ color: "var(--text-secondary)" }}>
              Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
            </span>
          </div>

          {/* Audio Player */}
          <div className="audio-player p-3 rounded"
               style={{ backgroundColor: "var(--bg-tertiary)" }}>
            
            {audioError && (
              <Alert variant="warning" className="mb-3">
                <small>{audioError}</small>
              </Alert>
            )}
            
            <div className="d-flex align-items-center mb-2">
              <Button
                variant="primary"
                size="sm"
                onClick={togglePlayPause}
                className="me-3"
                style={{ minWidth: "40px" }}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
              
              <div className="time-display">
                <small style={{ color: "var(--text-secondary)" }}>
                  <FaClock className="me-1" />
                  {formatTime(currentTime)} / {formatTime(duration)}
                </small>
              </div>
            </div>

            {/* Progress bar */}
            <div 
              className="progress-bar-container"
              style={{ 
                height: "6px", 
                backgroundColor: "var(--border-color)", 
                borderRadius: "3px",
                cursor: "pointer"
              }}
              onClick={handleProgressClick}
            >
              <div
                className="progress-bar"
                style={{
                  height: "100%",
                  width: `${progressPercentage}%`,
                  backgroundColor: "var(--accent-primary)",
                  borderRadius: "3px",
                  transition: "width 0.1s ease"
                }}
              />
            </div>

            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={submission.audioFileUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              onError={handleAudioError}
              onCanPlay={handleCanPlay}
              preload="metadata"
            />
          </div>

          {submission.feedback && (
            <div className="mt-3">
              <small style={{ color: "var(--text-secondary)" }}>
                <strong>Feedback:</strong> {submission.feedback}
              </small>
            </div>
          )}

          {submission.score && (
            <div className="mt-2">
              <small style={{ color: "var(--text-secondary)" }}>
                <strong>Score:</strong> {submission.score}/10
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header 
          closeButton 
          style={{ 
            backgroundColor: "var(--bg-secondary)", 
            borderColor: "var(--border-color)" 
          }}
        >
          <Modal.Title style={{ color: "var(--text-primary)" }}>
            Delete Submission
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "var(--card-bg)" }}>
          <p style={{ color: "var(--text-primary)" }}>
            Are you sure you want to delete your submission "{submission.mixTitle}"? 
            This action cannot be undone.
          </p>
          {canDelete && (
            <Alert variant="info" className="mb-0">
              <small>
                You can submit a new mix after deleting this one, as long as the 
                submission period is still open.
              </small>
            </Alert>
          )}
          {deleteError && (
            <Alert variant="danger" className="mt-3 mb-0">
              {deleteError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer 
          style={{ 
            backgroundColor: "var(--bg-secondary)", 
            borderColor: "var(--border-color)" 
          }}
        >
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteSubmission}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Submission"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserSubmissionCard; 