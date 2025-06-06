import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  ListGroup,
  Alert,
  Badge,
  Button,
} from "react-bootstrap";
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaCrown,
  FaMedal,
  FaTrophy,
} from "react-icons/fa";
import SimpleAudioPlayer from "./SimpleAudioPlayer";

const VotingRound1Card = ({
  competitionId,
  assignedSubmissions = [],
  hasVoted = false,
  votingDeadline,
  scorecardScores = {},
  onScoreSubmission
}) => {
  // UI state
  const [error, setError] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Use useRef to manage interval reference
  const intervalRef = useRef(null);

  // Calculate positions based on scorecard scores
  const calculatePositions = () => {
    const submissionsWithScores = assignedSubmissions.map(submission => ({
      ...submission,
      overallScore: scorecardScores[submission.id]?.overallScore || 0
    }));

    // Sort by score (highest first)
    submissionsWithScores.sort((a, b) => b.overallScore - a.overallScore);

    // Create position mapping
    const positions = {};
    submissionsWithScores.forEach((submission, index) => {
      positions[submission.id] = index + 1; // 1st, 2nd, 3rd, etc.
    });

    return positions;
  };

  const positions = calculatePositions();

  // Get position display info
  const getPositionInfo = (submissionId) => {
    const position = positions[submissionId];
    const score = scorecardScores[submissionId]?.overallScore || 0;
    
    let badge = null;
    let label = `${position}${getOrdinalSuffix(position)} Place`;
    
    if (position === 1) {
      badge = { color: "#ffc107", bgColor: "rgba(255, 193, 7, 0.1)", icon: <FaCrown className="me-1" /> };
    } else if (position === 2) {
      badge = { color: "var(--accent-primary)", bgColor: "rgba(0, 200, 255, 0.1)", icon: <FaMedal className="me-1" /> };
    } else if (position === 3) {
      badge = { color: "#dc3545", bgColor: "rgba(220, 53, 69, 0.1)", icon: <FaTrophy className="me-1" /> };
    } else {
      badge = { color: "var(--text-secondary)", bgColor: "rgba(255, 255, 255, 0.1)", icon: <span className="me-1">#{position}</span> };
    }

    return { position, label, badge, score };
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // Handle audio play state changes
  const handleAudioPlayStateChange = (submissionId, isPlaying) => {
    if (isPlaying) {
      // Stop any other playing track
      setPlayingTrack(submissionId);
    } else {
      // Only clear playing track if this was the playing track
      if (playingTrack === submissionId) {
        setPlayingTrack(null);
      }
    }
  };

  // Handle audio errors
  const handleAudioError = (submissionId, error) => {
    console.error('📀 Audio error for submission', submissionId, ':', error);
    setError(`Failed to load audio for submission ${submissionId}. Please try refreshing the page.`);
    // Clear playing track if this was the one with error
    if (playingTrack === submissionId) {
      setPlayingTrack(null);
    }
  };

  // Calculate time remaining when component mounts or votingDeadline changes
  useEffect(() => {
    if (votingDeadline) {
      const deadline = new Date(votingDeadline);
      const updateTimeRemaining = () => {
        const now = new Date();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeRemaining("Voting period has ended");
          clearInterval(intervalRef.current);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`);
      };

      updateTimeRemaining();
      intervalRef.current = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(intervalRef.current);
    }
  }, [votingDeadline]);

  // Get audio URL with fallback construction
  const getAudioUrl = (submission) => {
    if (!submission.audioUrl) {
      console.warn('📀 No audioUrl for submission:', submission.id);
      return null;
    }

    // If it's a relative path, use it directly - the React proxy will handle it
    if (submission.audioUrl.startsWith('/')) {
      console.log('📀 Using relative URL via proxy:', submission.audioUrl);
      return submission.audioUrl;
    }

    // If it's already a full URL, use it as-is
    if (submission.audioUrl.startsWith('http://') || submission.audioUrl.startsWith('https://')) {
      console.log('📀 Using absolute URL:', submission.audioUrl);
      return submission.audioUrl;
    }

    // If it's a relative path without leading slash, add it and let proxy handle it
    const relativeUrl = `/${submission.audioUrl}`;
    console.log('📀 Using relative URL via proxy:', relativeUrl);
    return relativeUrl;
  };

  // If there are no assigned submissions or the user has not been assigned to vote
  if (assignedSubmissions.length === 0) {
    return (
      <Card 
        className="mb-4 border-0 shadow-sm"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <Card.Header 
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "white",
            borderColor: "var(--border-color)",
          }}
        >
          <h5 className="mb-0">Round 1 Voting - Current Rankings</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <FaExclamationTriangle size={48} className="mb-3" style={{ color: "var(--accent-primary)" }} />
          <h4 style={{ color: "var(--text-primary)" }}>No submissions available</h4>
          <p style={{ color: "var(--text-secondary)" }}>
            You have not been assigned any submissions to review for this
            round. This may be because assignments haven't been distributed yet.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card 
      className="mb-4 border-0 shadow-sm"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <Card.Header 
        className="d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "white",
          borderColor: "var(--border-color)",
        }}
      >
        <h5 className="mb-0">Round 1 Voting - Current Rankings</h5>
        {timeRemaining && (
          <Badge bg="light" text="dark" className="px-2 py-1">
            {timeRemaining}
          </Badge>
        )}
      </Card.Header>
      <Card.Body style={{ backgroundColor: "var(--bg-secondary)" }}>
        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError(null)}
            className="mb-4"
            style={{
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            {error}
          </Alert>
        )}

        <div className="mb-4">
          <h5 style={{ color: "var(--accent-primary)" }}>Your Assigned Submissions</h5>
          <p style={{ color: "var(--text-primary)" }}>
            <FaInfoCircle className="me-2" style={{ color: "var(--accent-primary)" }} />
            Listen to your assigned submissions and view their current rankings based on your judgments.
            Rankings update automatically when you submit scores via the Judging Interface.
          </p>
        </div>

        <h6 className="mb-3" style={{ color: "var(--accent-primary)" }}>Submissions & Current Rankings</h6>
        <ListGroup variant="flush" className="mb-4">
          {assignedSubmissions.map((submission, index) => {
            const audioUrl = getAudioUrl(submission);
            const positionInfo = getPositionInfo(submission.id);
            
            return (
              <ListGroup.Item 
                key={submission.id} 
                className="py-3"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 className="mb-1" style={{ color: "var(--text-primary)" }}>
                      Mix #{index + 1}
                    </h6>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Smaller Score This Mix Button */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onScoreSubmission && onScoreSubmission(submission.id)}
                      style={{
                        borderColor: "var(--accent-primary)",
                        color: "var(--accent-primary)",
                        fontSize: "0.75em",
                        padding: "4px 8px",
                        minWidth: "auto"
                      }}
                    >
                      Score This Mix
                    </Button>

                    <SimpleAudioPlayer
                      audioUrl={audioUrl}
                      submissionId={submission.id}
                      onPlayStateChange={handleAudioPlayStateChange}
                      onError={handleAudioError}
                      disabled={!audioUrl}
                      size="sm"
                      variant="outline-primary"
                    />
                  </div>
                </div>

                {/* Current Ranking Information */}
                <div className="mb-2">
                  {positionInfo.score > 0 ? (
                    <div className="d-flex align-items-center">
                      <span style={{ color: positionInfo.badge.color, fontSize: "0.9em" }}>
                        {positionInfo.badge.icon}
                      </span>
                      <span 
                        className="ms-2"
                        style={{ 
                          color: "var(--text-primary)",
                          fontSize: "0.9em",
                          fontWeight: "500"
                        }}
                      >
                        {positionInfo.label}
                      </span>
                      <span 
                        className="ms-2 badge"
                        style={{
                          backgroundColor: positionInfo.badge.bgColor,
                          color: positionInfo.badge.color,
                          fontSize: "0.75em",
                          border: `1px solid ${positionInfo.badge.color}`
                        }}
                      >
                        Score: {positionInfo.score.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85em", fontStyle: "italic" }}>
                      Not yet scored - click "Score" to rate this submission
                    </div>
                  )}
                  
                  {!audioUrl && (
                    <div style={{ color: "#dc3545", fontSize: "0.8em" }} className="mt-1">
                      ⚠️ Audio unavailable
                    </div>
                  )}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>

        {/* Overall Rankings Summary */}
        <div className="mb-3">
          <h6 style={{ color: "var(--accent-primary)" }}>Current Overall Rankings</h6>
          <div 
            className="p-3 rounded"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-color)",
              border: "1px solid var(--border-color)",
            }}
          >
            {assignedSubmissions
              .map(submission => ({
                ...submission,
                positionInfo: getPositionInfo(submission.id)
              }))
              .sort((a, b) => a.positionInfo.position - b.positionInfo.position)
              .map((submission, index) => (
                <div key={submission.id} className="mb-2 last:mb-0 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span style={{ color: submission.positionInfo.badge.color, fontSize: "1em" }}>
                      {submission.positionInfo.badge.icon}
                    </span>
                    <span className="ms-2" style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                      Mix #{assignedSubmissions.findIndex(s => s.id === submission.id) + 1}
                    </span>
                    <span 
                      className="ms-2"
                      style={{ 
                        color: submission.positionInfo.badge.color,
                        fontSize: "0.9em",
                        fontWeight: "500"
                      }}
                    >
                      {submission.positionInfo.label}
                    </span>
                  </div>
                  <div>
                    {submission.positionInfo.score > 0 ? (
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: submission.positionInfo.badge.bgColor,
                          color: submission.positionInfo.badge.color,
                          border: `1px solid ${submission.positionInfo.badge.color}`,
                          fontSize: "0.8em"
                        }}
                      >
                        {submission.positionInfo.score.toFixed(1)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8em", fontStyle: "italic" }}>
                        Not scored
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Instructions */}
        <Alert 
          variant="info"
          style={{
            backgroundColor: "rgba(0, 200, 255, 0.1)",
            borderColor: "var(--accent-primary)",
            color: "var(--text-primary)"
          }}
        >
          <Alert.Heading style={{ color: "var(--accent-primary)", fontSize: "1.1em" }}>
            How Rankings Work
          </Alert.Heading>
          <p style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Rankings are calculated based on your judgments from the Judging Interface:
          </p>
          <ul style={{ color: "var(--text-primary)", marginBottom: 0, paddingLeft: "1.2rem" }}>
            <li>Switch to "Judging" interface to score submissions using detailed criteria</li>
            <li>Rankings automatically update here based on your overall scores</li>
            <li>Higher scored submissions will rank higher in your final voting submission</li>
            <li>You can listen to submissions here while reviewing your current rankings</li>
          </ul>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default VotingRound1Card;
