import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import { submitRound2Votes } from "../../store/votingSlice";
import {
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import SourceMaterialAudioPlayer from "./SourceMaterialAudioPlayer";

const VotingRound2Card = ({
  competitionId,
  advancedSubmissions = [],
  hasVoted = false,
  votingDeadline,
  isEligibleVoter = false,
}) => {
  const dispatch = useDispatch();

  // State for votes
  const [votes, setVotes] = useState({
    first: null,
    second: null,
    third: null,
  });

  // State for UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Refs for cleanup
  const intervalRef = useRef(null);

  const getAnonymousMixLabel = (index) => `Mix ${index + 1}`;

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate time remaining
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

  // SIMPLIFIED: Audio play state change handler for SourceMaterialAudioPlayer
  const handleAudioPlayStateChange = (submissionId, isPlaying) => {
    console.log(`🎵 [Round2] Audio state changed - Submission ${submissionId}: ${isPlaying ? 'Playing' : 'Stopped'}`);
    // SourceMaterialAudioPlayer handles its own state internally
  };

  // SIMPLIFIED: Audio error handler for SourceMaterialAudioPlayer
  const handleAudioError = (submissionId, error) => {
    console.error(`❌ [Round2] Audio error for submission ${submissionId}:`, error);
    // SourceMaterialAudioPlayer handles error state internally
  };

  const handleVoteChange = (submissionId, rank) => {
    setError("");

    // Check if this submission is already voted for a different rank
    const currentRank = Object.keys(votes).find(
      (key) => votes[key] === submissionId
    );
    if (currentRank) {
      // Remove the existing vote
      setVotes((prev) => ({ ...prev, [currentRank]: null }));
    }

    // Check if the target rank already has a vote and clear it
    if (votes[rank]) {
      setVotes((prev) => ({ ...prev, [rank]: null }));
    }

    // Set the new vote
    setVotes((prev) => ({ ...prev, [rank]: submissionId }));
  };

  const handleSubmitVotes = async () => {
    if (!votes.first || !votes.second || !votes.third) {
      setError("Please select all three rankings before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await dispatch(
        submitRound2Votes({
          competitionId,
          votes: {
            first: votes.first,
            second: votes.second,
            third: votes.third,
          },
        })
      ).unwrap();

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="h-100 bg-dark text-light border-secondary">
      <Card.Header style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: 'var(--accent-primary)' }}>
            Round 2 Voting
          </h5>
          {timeRemaining && (
            <small style={{ color: 'var(--text-secondary)' }}>
              {timeRemaining}
            </small>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {!isEligibleVoter && !hasVoted && !success ? (
          <Alert variant="warning" className="mb-0 bg-warning bg-opacity-25 border-warning text-light">
            <Alert.Heading style={{ color: 'var(--accent-primary)' }}>Not Eligible to Vote</Alert.Heading>
            <p style={{ color: 'var(--text-primary)' }}>
              <FaExclamationTriangle className="me-2" style={{ color: 'var(--accent-primary)' }} />
              Only participants who submitted entries in Round 1 are eligible
              to vote in Round 2. Thank you for your interest!
            </p>
          </Alert>
        ) : advancedSubmissions.length === 0 ? (
          <Alert variant="info" className="mb-0 bg-info bg-opacity-25 border-info text-light">
            <Alert.Heading style={{ color: 'var(--accent-primary)' }}>No Finalists Available</Alert.Heading>
            <p style={{ color: 'var(--text-primary)' }}>
              <FaInfoCircle className="me-2" style={{ color: 'var(--accent-primary)' }} />
              Round 2 voting has not been set up yet. Please check back later
              when the finalists have been determined.
            </p>
          </Alert>
        ) : error ? (
          <Alert
            variant="danger"
            className="mb-3 bg-danger bg-opacity-25 border-danger text-light"
            onClose={() => setError("")}
            dismissible
          >
            {error}
          </Alert>
        ) : null}

        {error && (
          <Alert
            variant="danger"
            className="mb-3 bg-danger bg-opacity-25 border-danger text-light"
            onClose={() => setError("")}
            dismissible
          >
            {error}
          </Alert>
        )}

        {success || hasVoted ? (
          <Alert variant="success" className="mb-0 bg-success bg-opacity-25 border-success text-light">
            <Alert.Heading style={{ color: 'var(--accent-secondary)' }}>Thanks for voting!</Alert.Heading>
            <p style={{ color: 'var(--text-primary)' }}>
              Your votes have been recorded successfully. Results will be
              announced once the competition voting period has ended.
            </p>
          </Alert>
        ) : (isEligibleVoter || hasVoted) && advancedSubmissions.length > 0 ? (
          <>
            <div className="mb-4">
              <h5 style={{ color: 'var(--accent-primary)' }}>Final Round Voting</h5>
              <p style={{ color: 'var(--text-primary)' }}>
                <FaInfoCircle className="me-2" style={{ color: 'var(--accent-primary)' }} />
                These finalists were selected from Round 1 voting. Please listen
                to all submissions and vote for your top three favorites. All submissions
                are anonymous to ensure fair voting.
              </p>
            </div>

            <div className="mb-4">
              <h6 style={{ color: 'var(--accent-primary)' }}>Voting Instructions:</h6>
              <ol className="small" style={{ color: 'var(--text-secondary)' }}>
                <li>Listen to all finalist submissions (displayed anonymously)</li>
                <li>
                  Select your favorite as 1st Place, second favorite as 2nd
                  Place, and third favorite as 3rd Place
                </li>
                <li>Submit your votes before the voting deadline</li>
              </ol>
            </div>

            <h5 className="mb-3" style={{ color: 'var(--accent-primary)' }}>Finalist Submissions</h5>
            <div className="mb-4">
              {advancedSubmissions.map((submission, index) => (
                <div key={submission.id} className="mb-4">
                  {/* Submission Header */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                        {getAnonymousMixLabel(index)}
                      </h6>
                      <div className="small" style={{ color: 'var(--text-secondary)' }}>
                        Anonymous Finalist Entry
                      </div>
                    </div>
                    <Badge style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}>
                      Finalist
                    </Badge>
                  </div>

                  {/* ENHANCED: Source Material-style audio player with time display for mix engineers */}
                  <SourceMaterialAudioPlayer
                    audioUrl={submission.audioUrl}
                    submissionId={submission.id}
                    title={getAnonymousMixLabel(index)}
                    subtitle="Finalist Submission"
                    onPlayStateChange={handleAudioPlayStateChange}
                    onError={handleAudioError}
                    disabled={hasVoted || submitting}
                    style={{
                      marginBottom: "16px",
                      backgroundColor: "var(--bg-secondary)"
                    }}
                  />

                  {/* Voting Buttons */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Button
                      size="sm"
                      onClick={() => handleVoteChange(submission.id, "first")}
                      disabled={hasVoted || submitting}
                      style={{
                        backgroundColor: votes.first === submission.id ? '#FFD700' : 'transparent',
                        borderColor: '#FFD700',
                        color: votes.first === submission.id ? '#000' : '#FFD700'
                      }}
                    >
                      1st Place
                      {votes.first === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVoteChange(submission.id, "second")}
                      disabled={hasVoted || submitting}
                      style={{
                        backgroundColor: votes.second === submission.id ? '#C0C0C0' : 'transparent',
                        borderColor: '#C0C0C0',
                        color: votes.second === submission.id ? '#000' : '#C0C0C0'
                      }}
                    >
                      2nd Place
                      {votes.second === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVoteChange(submission.id, "third")}
                      disabled={hasVoted || submitting}
                      style={{
                        backgroundColor: votes.third === submission.id ? '#CD7F32' : 'transparent',
                        borderColor: '#CD7F32',
                        color: votes.third === submission.id ? '#000' : '#CD7F32'
                      }}
                    >
                      3rd Place
                      {votes.third === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                  </div>

                  {/* Divider between submissions (except last one) */}
                  {index < advancedSubmissions.length - 1 && (
                    <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
                  )}
                </div>
              ))}
            </div>

            <div className="mb-3">
              <h6 style={{ color: 'var(--accent-primary)' }}>Your Selections</h6>
              <div className="p-3 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="mb-2">
                  <span className="fw-bold me-2" style={{ color: '#FFD700' }}>1st Place:</span>
                  {votes.first ? (
                    <span style={{ color: 'var(--text-primary)' }}>
                      {getAnonymousMixLabel(advancedSubmissions.findIndex(s => s.id === votes.first))}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Not selected</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2" style={{ color: '#C0C0C0' }}>2nd Place:</span>
                  {votes.second ? (
                    <span style={{ color: 'var(--text-primary)' }}>
                      {getAnonymousMixLabel(advancedSubmissions.findIndex(s => s.id === votes.second))}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Not selected</span>
                  )}
                </div>
                <div>
                  <span className="fw-bold me-2" style={{ color: '#CD7F32' }}>3rd Place:</span>
                  {votes.third ? (
                    <span style={{ color: 'var(--text-primary)' }}>
                      {getAnonymousMixLabel(advancedSubmissions.findIndex(s => s.id === votes.third))}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Not selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-grid">
              <Button
                size="lg"
                onClick={handleSubmitVotes}
                disabled={!votes.first || !votes.second || !votes.third || submitting}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: '#000'
                }}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Submitting...
                  </>
                ) : (
                  "Submit My Final Votes"
                )}
              </Button>
            </div>
          </>
        ) : null}
      </Card.Body>
    </Card>
  );
};

export default VotingRound2Card;
