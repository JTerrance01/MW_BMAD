import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  ListGroup,
  Alert,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import { submitRound2Votes } from "../../store/votingSlice";
import {
  FaPlay,
  FaPause,
  FaCheck,
  FaInfoCircle,
  FaTrophy,
  FaExclamationTriangle,
} from "react-icons/fa";

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

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [success, setSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Refs for audio elements
  const audioRefs = useRef(new Map());

  // Use useRef to manage interval reference
  const intervalRef = useRef(null);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      // Stop all audio and cleanup
      const currentAudioRefs = audioRefs.current;
      try {
        currentAudioRefs.forEach((audioElement, submissionId) => {
          if (audioElement) {
            audioElement.pause();
            audioElement.removeAttribute('src');
            audioElement.load();
          }
        });
        currentAudioRefs.clear();
      } catch (error) {
        console.warn('Error cleaning up voting round 2 audio:', error);
      }
    };
  }, []);

  // Cleanup audio when submissions change
  useEffect(() => {
    // Only cleanup if we have valid submissions
    if (advancedSubmissions && advancedSubmissions.length >= 0) {
      try {
        // Pause all audio when submissions change
        audioRefs.current.forEach((audioElement, submissionId) => {
          if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        });
        setPlayingTrack(null);

        // Clean up audio refs for submissions that no longer exist
        const currentSubmissionIds = new Set(advancedSubmissions.map(s => s.id));
        for (const [submissionId, audioElement] of audioRefs.current.entries()) {
          if (!currentSubmissionIds.has(submissionId)) {
            if (audioElement) {
              audioElement.pause();
              audioElement.removeAttribute('src');
              audioElement.load();
            }
            audioRefs.current.delete(submissionId);
          }
        }
      } catch (error) {
        console.warn('Error resetting voting round 2 audio:', error);
      }
    }
  }, [advancedSubmissions]);

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

  // Handle audio playback
  const handlePlayPause = (submissionId) => {
    const audioElement = audioRefs.current.get(submissionId);
    if (!audioElement) return;

    if (playingTrack === submissionId) {
      // This track is currently playing, so toggle pause/play
      if (audioElement.paused) {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      } else {
        audioElement.pause();
      }
    } else {
      // Stop any currently playing track
      if (playingTrack) {
        const currentlyPlaying = audioRefs.current.get(playingTrack);
        if (currentlyPlaying) {
          currentlyPlaying.pause();
        }
      }

      // Play the new track
      audioElement.currentTime = 0;
      audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      setPlayingTrack(submissionId);
    }
  };

  // Handle audio events
  const handleAudioEnded = () => {
    setPlayingTrack(null);
  };

  // Safe audio ref handler
  const handleAudioRef = (el, submissionId) => {
    if (el) {
      audioRefs.current.set(submissionId, el);
    } else {
      // Remove ref when element is unmounted
      const existingAudio = audioRefs.current.get(submissionId);
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.removeAttribute('src');
        existingAudio.load();
      }
      audioRefs.current.delete(submissionId);
    }
  };

  // Handle vote selection
  const handleVoteChange = (submissionId, rank) => {
    // Don't allow changes if already voted or submitting
    if (hasVoted || submitting || !isEligibleVoter) return;

    // Check if this submission is already selected for another rank
    const existingRank = Object.entries(votes).find(
      ([_, value]) => value === submissionId
    );
    if (existingRank) {
      // Remove the existing selection
      setVotes((prev) => ({
        ...prev,
        [existingRank[0]]: null,
      }));
    }

    // Check if there's already a submission for this rank
    const currentSubmissionAtRank = votes[rank];

    setVotes((prev) => ({
      ...prev,
      [rank]: currentSubmissionAtRank === submissionId ? null : submissionId,
    }));
  };

  // Submit votes
  const handleSubmitVotes = async () => {
    // Validate that all votes are selected
    if (!votes.first || !votes.second || !votes.third) {
      setError("Please select your top three finalists before submitting");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await dispatch(
        submitRound2Votes({
          competitionId,
          votes: {
            firstPlace: votes.first,
            secondPlace: votes.second,
            thirdPlace: votes.third,
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

  // Check if audio is currently playing
  const isPlaying = (submissionId) => {
    if (playingTrack !== submissionId) return false;

    const audioElement = audioRefs.current.get(submissionId);
    return audioElement && !audioElement.paused;
  };

  // If there are no advanced submissions to vote on
  if (advancedSubmissions.length === 0) {
    return (
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-warning text-white">
          <h5 className="mb-0">Round 2 Voting</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h4>No finalists available yet</h4>
          <p className="text-muted">
            The finalists for Round 2 voting haven't been determined yet or
            there are no submissions to show. Please check back later.
          </p>
        </Card.Body>
      </Card>
    );
  }

  // If user is not eligible to vote in Round 2
  if (!isEligibleVoter && !hasVoted) {
    return (
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-warning text-white">
          <h5 className="mb-0">Round 2 Voting</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <Alert.Heading>Round 2 Voting</Alert.Heading>
            <p>
              You are not eligible to vote in Round 2 of this competition
              because your submission advanced to the finals. However, you can
              listen to all the finalist tracks below.
            </p>
            <p className="mb-0">
              The competition winner will be announced once voting has
              concluded.
            </p>
          </Alert>

          <h5 className="mt-4 mb-3">Finalist Submissions</h5>
          <ListGroup variant="flush">
            {advancedSubmissions.map((submission) => (
              <ListGroup.Item key={submission.id} className="py-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="mb-1">
                      {submission.title || `Submission #${submission.number}`}
                    </h6>
                    {submission.description && (
                      <div className="text-muted small">
                        {submission.description}
                      </div>
                    )}
                  </div>

                  <Badge bg="primary">Finalist</Badge>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={(el) => handleAudioRef(el, submission.id)}
                  src={submission.audioUrl}
                  onEnded={handleAudioEnded}
                  preload="none"
                />

                <Button
                  variant={
                    isPlaying(submission.id) ? "secondary" : "outline-primary"
                  }
                  onClick={() => handlePlayPause(submission.id)}
                >
                  {isPlaying(submission.id) ? (
                    <>
                      <FaPause className="me-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" />
                      Play Track
                    </>
                  )}
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-0 shadow-sm">
      <Card.Header className="bg-warning text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Round 2 Voting</h5>
        {timeRemaining && (
          <Badge bg="light" text="dark" className="px-2 py-1">
            {timeRemaining}
          </Badge>
        )}
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError(null)}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {success || hasVoted ? (
          <Alert variant="success" className="mb-0">
            <Alert.Heading>Thanks for voting!</Alert.Heading>
            <p>
              Your votes have been recorded successfully. Results will be
              announced once the competition voting period has ended.
            </p>
          </Alert>
        ) : (
          <>
            <div className="mb-4">
              <h5>Final Round Voting</h5>
              <p>
                <FaInfoCircle className="me-2 text-primary" />
                These finalists were selected from Round 1 voting. Please listen
                to all submissions and vote for your top three favorites.
              </p>
            </div>

            <div className="mb-4">
              <h6>Voting Instructions:</h6>
              <ol className="small text-muted">
                <li>Listen to all finalist submissions</li>
                <li>
                  Select your favorite as 1st Place, second favorite as 2nd
                  Place, and third favorite as 3rd Place
                </li>
                <li>Submit your votes before the voting deadline</li>
              </ol>
            </div>

            <h5 className="mb-3">Finalist Submissions</h5>
            <ListGroup variant="flush" className="mb-4">
              {advancedSubmissions.map((submission) => (
                <ListGroup.Item key={submission.id} className="py-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">
                        {submission.title || `Submission #${submission.number}`}
                      </h6>
                      {submission.description && (
                        <div className="text-muted small">
                          {submission.description}
                        </div>
                      )}
                    </div>

                    <div>
                      <Badge bg="primary" className="me-2">
                        Finalist
                      </Badge>
                      <Button
                        variant={
                          isPlaying(submission.id)
                            ? "secondary"
                            : "outline-primary"
                        }
                        size="sm"
                        onClick={() => handlePlayPause(submission.id)}
                      >
                        {isPlaying(submission.id) ? <FaPause /> : <FaPlay />}
                      </Button>
                    </div>
                  </div>

                  {/* Hidden audio element */}
                  <audio
                    ref={(el) => handleAudioRef(el, submission.id)}
                    src={submission.audioUrl}
                    onEnded={handleAudioEnded}
                    preload="none"
                  />

                  <div className="mt-2 d-flex">
                    <Button
                      variant={
                        votes.first === submission.id
                          ? "warning"
                          : "outline-warning"
                      }
                      size="sm"
                      className="me-2"
                      onClick={() => handleVoteChange(submission.id, "first")}
                      disabled={hasVoted || submitting}
                    >
                      1st Place
                      {votes.first === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                    <Button
                      variant={
                        votes.second === submission.id
                          ? "secondary"
                          : "outline-secondary"
                      }
                      size="sm"
                      className="me-2"
                      onClick={() => handleVoteChange(submission.id, "second")}
                      disabled={hasVoted || submitting}
                    >
                      2nd Place
                      {votes.second === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                    <Button
                      variant={
                        votes.third === submission.id
                          ? "danger"
                          : "outline-danger"
                      }
                      size="sm"
                      onClick={() => handleVoteChange(submission.id, "third")}
                      disabled={hasVoted || submitting}
                    >
                      3rd Place
                      {votes.third === submission.id && (
                        <FaCheck className="ms-1" />
                      )}
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <div className="mb-3">
              <h6>Your Selections</h6>
              <div className="bg-light p-3 rounded">
                <div className="mb-2">
                  <span className="text-warning fw-bold me-2">1st Place:</span>
                  {votes.first ? (
                    advancedSubmissions.find((s) => s.id === votes.first)
                      ?.title || "Unknown submission"
                  ) : (
                    <span className="text-muted">Not selected</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-secondary fw-bold me-2">
                    2nd Place:
                  </span>
                  {votes.second ? (
                    advancedSubmissions.find((s) => s.id === votes.second)
                      ?.title || "Unknown submission"
                  ) : (
                    <span className="text-muted">Not selected</span>
                  )}
                </div>
                <div>
                  <span className="text-danger fw-bold me-2">3rd Place:</span>
                  {votes.third ? (
                    advancedSubmissions.find((s) => s.id === votes.third)
                      ?.title || "Unknown submission"
                  ) : (
                    <span className="text-muted">Not selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-grid">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitVotes}
                disabled={
                  !votes.first || !votes.second || !votes.third || submitting
                }
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
        )}
      </Card.Body>
    </Card>
  );
};

export default VotingRound2Card;
