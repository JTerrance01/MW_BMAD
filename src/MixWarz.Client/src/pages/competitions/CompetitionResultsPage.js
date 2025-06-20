import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompetitionById } from "../../store/competitionSlice";
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaVoteYea,
} from "react-icons/fa";
import { fetchCompetitionResults } from "../../store/competitionSlice";
import { getStatusDisplayText } from "../../utils/competitionUtils";
import SimpleResultsAudioPlayer from "../../components/competitions/SimpleResultsAudioPlayer";

const CompetitionResultsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Competition data from Redux
  const { 
    competition, 
    results: competitionResults, 
    loading, 
    loadingResults, 
    error, 
    errorResults 
  } = useSelector((state) => state.competitions);

  // Local state for UI
  const [playingAudio, setPlayingAudio] = useState(null);

  // Handle audio playback state changes from EnhancedAudioPlayer
  const handlePlayStateChange = (submissionId, isPlaying) => {
    if (isPlaying) {
      // Stop any other audio that might be playing
      if (playingAudio && playingAudio !== submissionId) {
        setPlayingAudio(null);
      }
      setPlayingAudio(submissionId);
    } else {
      if (playingAudio === submissionId) {
        setPlayingAudio(null);
      }
    }
  };

  // Handle audio errors
  const handleAudioError = (submissionId, error) => {
    console.error(`Audio error for submission ${submissionId}:`, error);
    if (playingAudio === submissionId) {
      setPlayingAudio(null);
    }
  };

  // Fix malformed audio URLs that may be double-encoded
  const processAudioUrl = (url) => {
    if (!url) return null;
    
    console.log(`🔧 [CompetitionResults] Processing audio URL: ${url}`);
    
    // Handle double-encoded URLs like: http://localhost:3000/uploads/https%3A//localhost%3A7001/uploads/...
    if (url.includes('%3A//localhost%3A')) {
      // Extract the decoded inner URL
      const decodedUrl = decodeURIComponent(url);
      console.log(`🔧 [CompetitionResults] Decoded URL: ${decodedUrl}`);
      
      // Find the inner localhost URL
      const match = decodedUrl.match(/https?:\/\/localhost:\d+\/uploads\/.+$/);
      if (match) {
        const cleanUrl = match[0];
        console.log(`🔧 [CompetitionResults] Cleaned URL: ${cleanUrl}`);
        return cleanUrl;
      }
    }
    
    // Handle URLs that start with uploads/ (relative paths)
    if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://localhost:7001';
      let cleanPath = url.startsWith('/') ? url.slice(1) : url;
      
      // Fix double uploads/ in path (e.g., "uploads/uploads/submissions/..." -> "uploads/submissions/...")
      if (cleanPath.startsWith('uploads/uploads/')) {
        cleanPath = cleanPath.replace('uploads/uploads/', 'uploads/');
        console.log(`🔧 [CompetitionResults] Fixed double uploads path: ${cleanPath}`);
      }
      
      const cleanUrl = `${baseUrl}/${cleanPath}`;
      console.log(`🔧 [CompetitionResults] Built absolute URL: ${cleanUrl}`);
      return cleanUrl;
    }
    
    // Handle full URLs that have double uploads/ in the path
    if (url.includes('/uploads/uploads/')) {
      const fixedUrl = url.replace(/\/uploads\/uploads\//g, '/uploads/');
      console.log(`🔧 [CompetitionResults] Fixed double uploads in full URL: ${fixedUrl}`);
      return fixedUrl;
    }
    
    // Return as-is if it's already a valid URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log(`🔧 [CompetitionResults] URL appears valid: ${url}`);
      return url;
    }
    
    console.warn(`🔧 [CompetitionResults] Could not process URL: ${url}`);
    return url;
  };

  // Fetch competition data and results
  useEffect(() => {
    if (id) {
      // Fetch basic competition data
      if (!loading && (!competition || (competition.competitionId || competition.id) !== parseInt(id))) {
        console.log(`CompetitionResultsPage: Fetching competition ${id} - current:`, competition?.competitionId || competition?.id);
        dispatch(fetchCompetitionById(id));
      }
      
      // Fetch competition results
      if (!loadingResults && (!competitionResults || competitionResults.competitionId !== parseInt(id))) {
        console.log(`CompetitionResultsPage: Fetching results for competition ${id}`);
        dispatch(fetchCompetitionResults(id));
      }
    }
  }, [dispatch, id, loading, loadingResults, competition?.competitionId, competition?.id, competitionResults?.competitionId]);



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
  if (loading || loadingResults) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">
          {loading ? "Loading competition..." : "Loading competition results..."}
        </p>
      </Container>
    );
  }

  // Error state
  if (error || errorResults) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Error loading: {error || errorResults}
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

  // Extract winners and results from competition results object
  const winners = competitionResults?.winners || [];
  const results = competitionResults?.results || [];
  const songCreatorPicks = []; // Not implemented in backend yet
  
  // Debug log to see what data we're receiving
  console.log(`🏆 [CompetitionResults] Winners data:`, winners);
  console.log(`🏆 [CompetitionResults] First winner audioUrl:`, winners[0]?.audioUrl);

  return (
    <Container className="py-5">
      <div className="mb-4 text-center">
        <h1 className="display-4 fw-bold mb-3">{competition.title}</h1>
        <h2 className="text-primary mb-3">Competition Results</h2>
        <p className="text-muted fs-5">
          Competition completed on{" "}
          {formatDate(competitionResults?.completedDate || competition.completedDate || competition.updatedAt)}
        </p>
      </div>

      {/* Winners section */}
      {winners && winners.length > 0 && (
        <Card className="mb-5 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h3 className="mb-0">Winners</h3>
          </Card.Header>
          <Card.Body>
            <Row className="g-4">
              {winners.map((winner, index) => (
                <Col key={winner.id} lg={4} md={6} sm={12} className="d-flex">
                  <div className="position-relative w-100">
                    {index === 0 && (
                      <div
                        className="position-absolute"
                        style={{
                          top: "-15px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 10,
                        }}
                      >
                        <FaTrophy size={40} className="text-warning" />
                      </div>
                    )}
                    <Card
                      className={`h-100 border-${getPlacementBadgeVariant(
                        index + 1
                      )} ${index === 0 ? "mt-4" : ""} d-flex flex-column shadow-sm`}
                      style={{ minHeight: index === 0 ? "380px" : "280px" }}
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
                      <Card.Body className="d-flex flex-column text-center">
                        <div className="flex-grow-1">
                          <h4 className="mb-2">{winner.title}</h4>
                          <p className="text-muted mb-3">by {winner.userName}</p>
                          
                          <div className="mb-3">
                            <Badge 
                              bg={index === 0 ? "warning" : index === 1 ? "secondary" : "danger"}
                              className="fs-6 px-3 py-2"
                            >
                              Score: {winner.score || "N/A"}
                            </Badge>
                          </div>

                          {/* Profile Picture */}
                          {winner.profilePicture && (
                            <div className="mb-3">
                              <img
                                src={winner.profilePicture}
                                alt={`${winner.userName}'s profile`}
                                className="rounded-circle border border-3 shadow"
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  objectFit: "cover",
                                  borderColor: index === 0 ? "#ffc107" : index === 1 ? "#6c757d" : "#dc3545"
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Only show audio player for 1st place winner */}
                        {index === 0 && winner.audioUrl && (
                          <div className="mt-auto d-flex align-items-center gap-2">
                            <SimpleResultsAudioPlayer
                              audioUrl={processAudioUrl(winner.audioUrl)}
                              submissionId={winner.id}
                              onPlayStateChange={handlePlayStateChange}
                              onError={handleAudioError}
                              disabled={playingAudio && playingAudio !== winner.id}
                              variant="warning"
                              size="md"
                              style={{
                                backgroundColor: playingAudio === winner.id ? '#ffc107' : 'transparent',
                                color: playingAudio === winner.id ? '#000' : '#ffc107',
                                borderColor: '#ffc107',
                                fontWeight: 'bold',
                                minWidth: '45px',
                                height: '45px'
                              }}
                            />
                            <div className="text-center flex-grow-1">
                              <small className="text-warning fw-bold">
                                {playingAudio === winner.id ? "Playing Winning Mix" : "Play Winning Mix"}
                              </small>
                            </div>
                          </div>
                        )}

                        {winner.feedback && (
                          <div className="mt-3 text-start">
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
                        <div className="mb-3 d-flex align-items-center gap-2">
                          <SimpleResultsAudioPlayer
                            audioUrl={processAudioUrl(pick.audioUrl)}
                            submissionId={pick.id}
                            onPlayStateChange={handlePlayStateChange}
                            onError={handleAudioError}
                            disabled={playingAudio && playingAudio !== pick.id}
                            variant="info"
                            size="md"
                            style={{
                              backgroundColor: playingAudio === pick.id ? '#17a2b8' : 'transparent',
                              color: playingAudio === pick.id ? '#fff' : '#17a2b8',
                              borderColor: '#17a2b8',
                              fontWeight: 'bold',
                              minWidth: '45px',
                              height: '45px'
                            }}
                          />
                          <div className="text-center flex-grow-1">
                            <small className="text-info fw-bold">
                              {playingAudio === pick.id ? "Playing Creator's Pick" : "Play Creator's Pick"}
                            </small>
                          </div>
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
          <Card.Header className="bg-dark text-white">
            <h3 className="mb-0">Full Results</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "50px", color: '#fff' }}>#</th>
                  <th style={{ color: '#fff' }}>Submission</th>
                  <th style={{ color: '#fff' }}>User</th>
                  <th style={{ width: "100px", color: '#fff' }}>Score</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#f8f9fa' }}>
                {results.map((result, index) => (
                  <tr 
                    key={result.id}
                    style={{ 
                      backgroundColor: index < 3 ? 
                        (index === 0 ? '#fff3cd' : index === 1 ? '#e2e3e5' : '#f8d7da') : 
                        '#ffffff'
                    }}
                  >
                    <td className="text-center align-middle">
                      {index < 3 ? (
                        <div className="d-flex align-items-center justify-content-center">
                          {getPlacementIcon(index + 1)}
                          <span className="ms-1 fw-bold" style={{ color: '#212529' }}>{index + 1}</span>
                        </div>
                      ) : (
                        <span className="fw-bold" style={{ color: '#212529' }}>{index + 1}</span>
                      )}
                    </td>
                    <td className="align-middle">
                      <div className="fw-bold" style={{ color: '#212529' }}>{result.title}</div>
                      {result.description && (
                        <small className="d-block mt-1" style={{ color: '#6c757d' }}>
                          {result.description}
                        </small>
                      )}
                    </td>
                    <td className="align-middle">
                      <span className="fw-medium" style={{ color: '#212529' }}>{result.userName}</span>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <Badge 
                          bg={index < 3 ? (index === 0 ? "warning" : index === 1 ? "secondary" : "danger") : "primary"}
                          className="fs-6"
                        >
                          {result.score || 0}
                        </Badge>
                        {result.voteBreakdown && (
                          <FaVoteYea
                            className="ms-2"
                            style={{ color: '#6c757d' }}
                            title={`Votes: ${result.voteBreakdown}`}
                          />
                        )}
                      </div>
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
