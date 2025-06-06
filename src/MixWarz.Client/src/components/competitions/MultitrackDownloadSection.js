import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import {
  downloadMultitrack,
  clearMultitrackData,
  fetchCompetitionById,
} from "../../store/competitionSlice";
import { FaDownload, FaMusic, FaPlay, FaPause } from "react-icons/fa";

const MultitrackDownloadSection = ({ competitionId }) => {
  const dispatch = useDispatch();
  const { downloadingMultitrack, multitrackUrl, multitrackError, competition } = useSelector(
    (state) => state.competitions
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  // Use useRef for audio element instead of state
  const audioRef = useRef(null);

  // Cleanup audio element on unmount and competition changes
  useEffect(() => {
    return () => {
      const currentAudio = audioRef.current;
      try {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.removeAttribute('src');
          currentAudio.load();
        }
      } catch (error) {
        console.warn('Error cleaning up multitrack audio:', error);
      }
    };
  }, []);

  // Reset audio when competition changes
  useEffect(() => {
    // Only reset if we have a valid competition and audio element
    if (competition && audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioPlaying(false);
      } catch (error) {
        console.warn('Error resetting multitrack audio:', error);
      }
    }
  }, [competition?.id, competition?.mixedTrackUrl]);

  // Fetch competition details if not already loaded
  useEffect(() => {
    if (competitionId && 
        !downloadingMultitrack && 
        (!competition || (competition.competitionId || competition.id) !== parseInt(competitionId))) {
      console.log(`MultitrackDownloadSection: Fetching competition ${competitionId} - current:`, competition?.competitionId || competition?.id);
      dispatch(fetchCompetitionById(competitionId));
    }
  }, [competitionId, competition?.competitionId, competition?.id, downloadingMultitrack, dispatch]);

  // If multitrackUrl is available, use it and reset state
  useEffect(() => {
    if (multitrackUrl) {
      window.open(multitrackUrl, "_blank");
      // Reset the URL after opening the download
      dispatch(clearMultitrackData());
    }
  }, [multitrackUrl, dispatch]);

  const handleDownload = () => {
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }

    // Validate competitionId before making the API call
    if (!competitionId || competitionId === 'undefined') {
      console.error('Cannot download multitrack: Competition ID is undefined');
      return;
    }

    dispatch(downloadMultitrack(competitionId));
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setAudioPlaying(false);
        });
        setAudioPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
  };

  const handleAudioError = () => {
    setAudioPlaying(false);
    console.error("Error playing mixed track audio");
  };

  // Early return if competitionId is not provided - AFTER all hooks
  if (!competitionId) {
    return (
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
          <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
            <FaMusic className="me-2" /> Source Material
          </h5>
        </Card.Header>
        <Card.Body>
          <p style={{ color: "var(--text-secondary)" }}>
            Loading competition details...
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
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
        <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
          <FaMusic className="me-2" /> Source Material
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Mixed Track Preview Section */}
          {competition?.mixedTrackUrl && (
            <Col md={6} className="mb-3">
              <h6 style={{ color: "var(--text-primary)" }}>
                Preview Mixed Track
              </h6>
              <p style={{ color: "var(--text-secondary)" }} className="small">
                Listen to the final mixed version to understand the target sound.
              </p>
              
              <div className="d-flex align-items-center mb-2">
                <Button
                  variant="outline-primary"
                  onClick={handleAudioToggle}
                  className="me-3"
                  style={{ minWidth: "120px" }}
                >
                  {audioPlaying ? (
                    <>
                      <FaPause className="me-2" /> Pause
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" /> Play
                    </>
                  )}
                </Button>
              </div>

              <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                preload="metadata"
                style={{ width: "100%", maxWidth: "300px" }}
                controls
              >
                <source src={competition.mixedTrackUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Col>
          )}

          {/* Multitrack Download Section */}
          <Col md={competition?.mixedTrackUrl ? 6 : 12}>
            <h6 style={{ color: "var(--text-primary)" }}>
              Download Multitrack Files
            </h6>
            <p style={{ color: "var(--text-secondary)" }} className="small">
              Download the multitrack files to create your competition mix. These
              files contain all the individual stems and tracks you'll need.
            </p>

            {/* Error message */}
            {multitrackError && (
              <Alert variant="danger" className="mb-3">
                Error: {multitrackError}
              </Alert>
            )}

            {/* Login required message */}
            {showLoginMessage && !isAuthenticated && (
              <Alert
                variant="info"
                className="mb-3"
                onClose={() => setShowLoginMessage(false)}
                dismissible
              >
                Please sign in to download the multitrack files.
              </Alert>
            )}

            <Button
              variant="primary"
              onClick={handleDownload}
              disabled={downloadingMultitrack}
              className="d-flex align-items-center justify-content-center"
              style={{ minWidth: "180px" }}
            >
              {downloadingMultitrack ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Getting Download...
                </>
              ) : (
                <>
                  <FaDownload className="me-2" /> Download Multitrack
                </>
              )}
            </Button>
          </Col>
        </Row>

        <div className="mt-3 small" style={{ color: "var(--text-secondary)" }}>
          <p className="mb-1">
            <strong>Note:</strong> These files are only available for registered
            users.
          </p>
          <p className="mb-0">
            By downloading these files, you agree to use them only for this
            competition.
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MultitrackDownloadSection;
