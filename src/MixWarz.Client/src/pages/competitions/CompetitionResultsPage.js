import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  Table,
  ProgressBar,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompetitionById } from "../../store/competitionSlice";
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaPlay,
  FaPause,
  FaVoteYea,
  FaVolumeUp,
} from "react-icons/fa";
import { fetchCompetitionResults } from "../../store/competitionSlice";
import { getStatusDisplayText } from "../../utils/competitionUtils";

const CompetitionResultsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Competition data from Redux
  const { competition, loading, error } = useSelector(
    (state) => state.competitions
  );

  // Local state for UI
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for audio elements
  const audioRefs = useRef(new Map());

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
        console.warn('Error cleaning up competition results audio:', error);
      }
    };
  }, []);

  // Cleanup audio when competition data changes
  useEffect(() => {
    // Only cleanup if competition is loaded and not in loading state
    if (!loading && competition) {
      try {
        // Pause all audio when competition changes
        audioRefs.current.forEach((audioElement, submissionId) => {
          if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        });
        setPlayingAudio(null);
        setIsPlaying(false);

        // Clean up audio refs for submissions that no longer exist
        const allSubmissionIds = new Set();
        
        // Collect all submission IDs from winners, picks, and results
        if (competition.winners) {
          competition.winners.forEach(w => allSubmissionIds.add(w.id));
        }
        if (competition.songCreatorPicks) {
          competition.songCreatorPicks.forEach(p => allSubmissionIds.add(p.id));
        }
        if (competition.results) {
          competition.results.forEach(r => allSubmissionIds.add(r.id));
        }

        // Remove audio refs for submissions that no longer exist
        for (const [submissionId, audioElement] of audioRefs.current.entries()) {
          if (!allSubmissionIds.has(submissionId)) {
            if (audioElement) {
              audioElement.pause();
              audioElement.removeAttribute('src');
              audioElement.load();
            }
            audioRefs.current.delete(submissionId);
          }
        }
      } catch (error) {
        console.warn('Error resetting competition results audio:', error);
      }
    }
  }, [loading, competition?.id, competition?.winners, competition?.songCreatorPicks, competition?.results]);

  // Fetch competition data
  useEffect(() => {
    if (id && !loading && (!competition || (competition.competitionId || competition.id) !== parseInt(id))) {
      console.log(`CompetitionResultsPage: Fetching competition ${id} - current:`, competition?.competitionId || competition?.id);
      dispatch(fetchCompetitionById(id));
    }
  }, [dispatch, id, loading, competition?.competitionId, competition?.id]);

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

  // Handle audio playback
  const handlePlayAudio = (submissionId, audioUrl) => {
    const audioElement = audioRefs.current.get(submissionId);
    if (!audioElement) return;

    // If we're already playing this track, pause it
    if (playingAudio === submissionId) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
        setIsPlaying(true);
      }
      return;
    }

    // If we're playing a different track, stop it
    if (playingAudio) {
      const previousAudio = audioRefs.current.get(playingAudio);
      if (previousAudio) {
        previousAudio.pause();
      }
    }

    // Play the new track
    audioElement.currentTime = 0;
    audioElement.play().catch(error => {
      console.error('Error playing audio:', error);
    });
    setPlayingAudio(submissionId);
    setIsPlaying(true);

    // Add event listener for when audio ends
    audioElement.onended = () => {
      setIsPlaying(false);
      setPlayingAudio(null);
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if competition has completed
  const isCompetitionCompleted = () => {
    return (
      competition &&
      (getStatusDisplayText(competition.status) === "Completed")
    );
  };

  // Get badge variant based on placement
  const getPlacementBadgeVariant = (placement) => {
    switch (placement) {
      case 1:
        return "warning"; // Gold
      case 2:
        return "secondary"; // Silver
      case 3:
        return "danger"; // Bronze
      default:
        return "primary";
    }
  };

  // Get icon based on placement
  const getPlacementIcon = (placement) => {
    switch (placement) {
      case 1:
        return <FaTrophy className="text-warning" />;
      case 2:
        return <FaMedal className="text-secondary" />;
      case 3:
        return <FaAward className="text-danger" />;
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading competition results...</p>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Error loading competition results: {error}
        </Alert>
        <Button as={Link} to="/competitions" variant="primary" className="mt-3">
          Back to Competitions
        </Button>
      </Container>
    );
  }

  // Competition not found
  if (!competition) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Competition not found or results are not available yet.
        </Alert>
        <Button as={Link} to="/competitions" variant="primary" className="mt-3">
          Back to Competitions
        </Button>
      </Container>
    );
  }

  // Results not available yet
  if (!isCompetitionCompleted()) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <Alert.Heading>Results not available yet</Alert.Heading>
          <p>
            This competition is still in progress. Results will be available
            once the competition is completed.
          </p>
          <p className="mb-0">
            Current status: <Badge bg="primary">{getStatusDisplayText(competition.status)}</Badge>
          </p>
        </Alert>
        <Button
          onClick={() => navigate(`/competitions/${id}`)}
          variant="primary"
          className="mt-3"
        >
          View Competition Details
        </Button>
      </Container>
    );
  }

  // Extract winners and results from competition object
  const { winners = [], songCreatorPicks = [], results = [] } = competition;

  return (
    <Container className="py-5">
      <div className="mb-4">
        <h1>{competition.title} - Results</h1>
        <p className="text-muted">
          Competition completed on{" "}
          {formatDate(competition.completedDate || competition.updatedAt)}
        </p>
      </div>

      {/* Winners section */}
      {winners && winners.length > 0 && (
        <Card className="mb-5 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h3 className="mb-0">Winners</h3>
          </Card.Header>
          <Card.Body>
            <Row>
              {winners.map((winner, index) => (
                <Col key={winner.id} md={4} className="text-center mb-4">
                  <div className="position-relative">
                    {index === 0 && (
                      <div
                        className="position-absolute"
                        style={{
                          top: "-15px",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }}
                      >
                        <FaTrophy size={40} className="text-warning" />
                      </div>
                    )}
                    <Card
                      className={`h-100 border-${getPlacementBadgeVariant(
                        index + 1
                      )} ${index === 0 ? "mt-4" : ""}`}
                    >
                      <Card.Header
                        className={`bg-${getPlacementBadgeVariant(
                          index + 1
                        )} text-white`}
                      >
                        <h5 className="mb-0">
                          {index === 0
                            ? "1st Place"
                            : index === 1
                            ? "2nd Place"
                            : "3rd Place"}
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <h4>{winner.title}</h4>
                        <p className="text-muted">by {winner.userName}</p>

                        {winner.audioUrl && (
                          <div className="mb-3">
                            <audio
                              ref={(el) => handleAudioRef(el, winner.id)}
                              src={winner.audioUrl}
                              preload="none"
                            />
                            <Button
                              variant={
                                index === 0
                                  ? "warning"
                                  : index === 1
                                  ? "secondary"
                                  : "danger"
                              }
                              className="w-100"
                              onClick={() =>
                                handlePlayAudio(winner.id, winner.audioUrl)
                              }
                            >
                              {playingAudio === winner.id && isPlaying ? (
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
                          </div>
                        )}

                        <div className="mb-2">
                          <Badge bg="primary">
                            Score: {winner.score || "N/A"}
                          </Badge>
                        </div>

                        {winner.feedback && (
                          <div className="mt-3">
                            <h6>Feedback:</h6>
                            <p className="small text-muted">
                              {winner.feedback}
                            </p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Song Creator Picks */}
      {songCreatorPicks && songCreatorPicks.length > 0 && (
        <Card className="mb-5 border-0 shadow-sm">
          <Card.Header className="bg-info text-white">
            <h3 className="mb-0">Song Creator's Picks</h3>
          </Card.Header>
          <Card.Body>
            <Row>
              {songCreatorPicks.map((pick) => (
                <Col key={pick.id} md={4} className="mb-4">
                  <Card className="h-100">
                    <Card.Header className="bg-info text-white">
                      <h5 className="mb-0">
                        {pick.rank === 1
                          ? "Creator's 1st Pick"
                          : pick.rank === 2
                          ? "Creator's 2nd Pick"
                          : "Creator's 3rd Pick"}
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <h4>{pick.title}</h4>
                      <p className="text-muted">by {pick.userName}</p>

                      {pick.audioUrl && (
                        <div className="mb-3">
                          <audio
                            ref={(el) => handleAudioRef(el, pick.id)}
                            src={pick.audioUrl}
                            preload="none"
                          />
                          <Button
                            variant="info"
                            className="w-100"
                            onClick={() =>
                              handlePlayAudio(pick.id, pick.audioUrl)
                            }
                          >
                            {playingAudio === pick.id && isPlaying ? (
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
                        </div>
                      )}

                      {pick.comment && (
                        <div className="mt-3">
                          <h6>Creator Comment:</h6>
                          <p className="small text-muted">{pick.comment}</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* All Results Table */}
      {results && results.length > 0 && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h3 className="mb-0">Full Results</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover striped className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Submission</th>
                  <th>User</th>
                  <th style={{ width: "100px" }}>Score</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id}>
                    <td className="text-center">
                      {index < 3 ? (
                        <div className="d-flex align-items-center justify-content-center">
                          {getPlacementIcon(index + 1)}
                          <span className="ms-1">{index + 1}</span>
                        </div>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td>
                      <div className="fw-bold">{result.title}</div>
                      {result.description && (
                        <small className="text-muted d-block mt-1">
                          {result.description}
                        </small>
                      )}
                    </td>
                    <td>{result.userName}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-2">{result.score || 0}</div>
                        {result.voteBreakdown && (
                          <FaVoteYea
                            className="text-muted"
                            title={`Votes: ${result.voteBreakdown}`}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      {result.audioUrl && (
                        <>
                          <audio
                            ref={(el) => handleAudioRef(el, result.id)}
                            src={result.audioUrl}
                            preload="none"
                          />
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              handlePlayAudio(result.id, result.audioUrl)
                            }
                          >
                            {playingAudio === result.id && isPlaying ? (
                              <FaPause />
                            ) : (
                              <FaPlay />
                            )}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="d-flex justify-content-between mt-4">
        <Button as={Link} to={`/competitions/${id}`} variant="outline-primary">
          Back to Competition
        </Button>
        <Button as={Link} to="/competitions" variant="outline-secondary">
          All Competitions
        </Button>
      </div>
    </Container>
  );
};

export default CompetitionResultsPage;
