import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompetitionById, getUserSubmission } from "../../store/competitionSlice";
import {
  fetchRound1VotingAssignments,
  fetchRound2VotingSubmissions,
} from "../../store/votingSlice";
import CompetitionTimeline from "../../components/competitions/CompetitionTimeline";
import VotingRound1Card from "../../components/competitions/VotingRound1Card";
import VotingRound2Card from "../../components/competitions/VotingRound2Card";
import JudgingInterface from "../../components/competitions/JudgingInterface";
import MultitrackDownloadSection from "../../components/competitions/MultitrackDownloadSection";
import SubmissionUploadForm from "../../components/competitions/SubmissionUploadForm";
import UserSubmissionCard from "../../components/competitions/UserSubmissionCard";
import {
  FaMusic,
  FaUsers,
  FaTrophy,
} from "react-icons/fa";
import { formatGenre } from "../../utils/apiUtils";

// Numeric to string status map - unified status system
const STATUS_MAP = {
  0: "Upcoming",
  1: "OpenForSubmissions", 
  10: "VotingRound1Setup",
  11: "VotingRound1Open",
  12: "VotingRound1Tallying",
  20: "VotingRound2Setup",
  21: "VotingRound2Open",
  22: "VotingRound2Tallying",
  25: "RequiresManualWinnerSelection",
  30: "Completed",
  40: "Archived",
  50: "Disqualified",
  // Legacy status
  2: "InJudging",
  3: "Closed",
  4: "Cancelled"
};

// Custom hook to handle all competition status logic
const useCompetitionStatus = (competition) => {
  return useMemo(() => {
    if (!competition) {
      return {
        stringStatus: null,
        displayName: "Loading...",
        badgeColor: "secondary",
        phaseKey: "Upcoming",
        isOpenForSubmissions: false,
        isVotingRound1: false,
        isVotingRound2: false,
        isVotingTallying: false,
        isCompleted: false,
        showVotingComponents: false
      };
    }

    const stringStatus = typeof competition.status === 'number' 
      ? STATUS_MAP[competition.status] 
      : competition.status;

    // Display name mapping
    const displayNameMap = {
      Upcoming: "Upcoming / Registration",
      OpenForSubmissions: "Open for Submissions",
      VotingRound1Setup: "Preparing Round 1 Voting",
      VotingRound1Open: "Round 1 Voting in Progress",
      VotingRound1Tallying: "Processing Round 1 Results",
      VotingRound2Setup: "Preparing Round 2 Voting",
      VotingRound2Open: "Round 2 Voting in Progress",
      VotingRound2Tallying: "Processing Final Results",
      RequiresManualWinnerSelection: "Finalizing Results",
      Completed: "Competition Completed",
      Archived: "Competition Archived",
      InJudging: "In Judging Phase",
      Closed: "Competition Closed",
      Cancelled: "Competition Cancelled",
      Disqualified: "Competition Disqualified",
    };

    // Badge color mapping
    const badgeColorMap = {
      OpenForSubmissions: "success",
      Upcoming: "info",
      VotingRound1Setup: "info",
      VotingRound2Setup: "info",
      VotingRound1Open: "warning",
      VotingRound2Open: "warning",
      VotingRound1Tallying: "secondary",
      VotingRound2Tallying: "secondary",
      RequiresManualWinnerSelection: "danger",
      Completed: "primary",
      Archived: "dark",
      Cancelled: "dark",
      InJudging: "warning",
      Closed: "primary",
      Disqualified: "danger",
    };

    // Phase key mapping for timeline
    const phaseKeyMap = {
      Upcoming: "Upcoming",
      OpenForSubmissions: "OpenForSubmissions",
      VotingRound1Setup: "Round1Voting",
      VotingRound1Open: "Round1Voting",
      VotingRound1Tallying: "Round1Voting",
      VotingRound2Setup: "Round2Voting",
      VotingRound2Open: "Round2Voting",
      VotingRound2Tallying: "Round2Voting",
      RequiresManualWinnerSelection: "ResultsAnnounced",
      Completed: "Completed",
      Archived: "Completed",
      InJudging: "Round1Voting",
      Closed: "Completed",
      Cancelled: "Completed",
    };

    return {
      stringStatus,
      displayName: displayNameMap[stringStatus] || "Unknown Status",
      badgeColor: badgeColorMap[stringStatus] || "primary",
      phaseKey: phaseKeyMap[stringStatus] || "Upcoming",
      isOpenForSubmissions: stringStatus === "OpenForSubmissions",
      isVotingRound1: stringStatus === "VotingRound1Open",
      isVotingRound2: stringStatus === "VotingRound2Open",
      isVotingTallying: stringStatus === "VotingRound1Tallying" || stringStatus === "VotingRound2Tallying",
      isCompleted: stringStatus === "Completed" || stringStatus === "Archived",
      showVotingComponents: stringStatus === "VotingRound1Open" || stringStatus === "VotingRound2Open"
    };
  }, [competition]);
};

const CompetitionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Audio refs for proper cleanup
  const mixedTrackRef = useRef(null);
  const sourceTrackRef = useRef(null);

  // Local state for submission refresh
  const [refreshSubmission, setRefreshSubmission] = useState(0);
  
  // Ref to track if we've fetched user submission for this competition
  const fetchedSubmissionRef = useRef(new Set());

  // State for judging interface
  const [useJudgingInterface, setUseJudgingInterface] = useState(true); // Toggle between judging and voting interface
  const [selectedSubmissionForJudging, setSelectedSubmissionForJudging] = useState(null); // Track which submission to judge
  
  // Real handler for judgment submission (replaces mock implementation)
  const handleJudgmentSubmit = async (judgmentData) => {
    console.log("Submitting judgment:", judgmentData);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/competitions/${judgmentData.competitionId}/voting/judgments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId: judgmentData.submissionId,
          overallScore: judgmentData.overallScore,
          overallComments: judgmentData.overallComments,
          criteriaScores: judgmentData.criteriaScores,
          votingRound: 1 // Default to Round 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Judgment submitted successfully:", result);
      
      // Refresh voting assignments to update hasVotedRound1 status
      if (id) {
        console.log("Refreshing voting assignments after judgment submission");
        dispatch(fetchRound1VotingAssignments(id));
      }
      
      return { 
        success: true, 
        message: result.message,
        isUpdate: result.isUpdate 
      };
    } catch (error) {
      console.error("Error submitting judgment:", error);
      throw error;
    }
  };

  // Handle switching to judging interface with specific submission
  const handleSwitchToJudging = (submissionId) => {
    setSelectedSubmissionForJudging(submissionId); // null means start from beginning, specific ID means start with that submission
    setUseJudgingInterface(true);
  };

  // Get states from Redux store
  const { 
    competition, 
    loading, 
    error, 
    userSubmission, 
    loadingUserSubmission 
  } = useSelector((state) => state.competitions);
  const {
    round1Assignments,
    hasVotedRound1,
    round2Submissions,
    isEligibleForRound2Voting,
    hasVotedRound2,
    votingDeadline,
    scorecardScores = {}
  } = useSelector((state) => state.voting);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Use the custom hook to handle all competition status logic
  const { stringStatus, displayName, badgeColor, phaseKey, isOpenForSubmissions, isVotingRound1, isVotingRound2, isVotingTallying, isCompleted, showVotingComponents } = useCompetitionStatus(competition);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      // Capture current ref values for cleanup
      const mixedAudio = mixedTrackRef.current;
      const sourceAudio = sourceTrackRef.current;
      
      try {
        if (mixedAudio) {
          mixedAudio.pause();
          mixedAudio.removeAttribute('src');
          mixedAudio.load();
        }
      } catch (error) {
        console.warn('Error cleaning up mixed track audio:', error);
      }
      
      try {
        if (sourceAudio) {
          sourceAudio.pause();
          sourceAudio.removeAttribute('src');
          sourceAudio.load();
        }
      } catch (error) {
        console.warn('Error cleaning up source track audio:', error);
      }
    };
  }, []);

  // Cleanup audio when competition changes (only when fully loaded)
  useEffect(() => {
    // Only run cleanup if competition is loaded and not in loading state
    if (!loading && competition) {
      try {
        if (mixedTrackRef.current) {
          mixedTrackRef.current.pause();
          mixedTrackRef.current.currentTime = 0;
        }
      } catch (error) {
        console.warn('Error resetting mixed track audio:', error);
      }
      
      try {
        if (sourceTrackRef.current) {
          sourceTrackRef.current.pause();
          sourceTrackRef.current.currentTime = 0;
        }
      } catch (error) {
        console.warn('Error resetting source track audio:', error);
      }
    }
  }, [loading, competition?.id]);

  useEffect(() => {
    // Fetch competition details when the component mounts or id changes
    // Add guards to prevent repeated fetching
    if (id && !loading && (!competition || competition.competitionId !== parseInt(id))) {
      console.log(`Fetching competition ${id} - current competition:`, competition?.competitionId);
      // Clear the submission fetch tracking when competition changes
      fetchedSubmissionRef.current.clear();
      dispatch(fetchCompetitionById(id));
    }
  }, [dispatch, id, loading, competition?.competitionId]);

  // Fetch voting assignments or submissions based on competition status
  useEffect(() => {
    // Only fetch voting data if we have a fully loaded competition and user is authenticated
    if (competition?.competitionId && !loading && isAuthenticated && id) {
      const stringStatus = typeof competition.status === 'number' ? STATUS_MAP[competition.status] : competition.status;
      
      console.log(`Checking voting status for competition ${competition.competitionId}: ${stringStatus}`);
      
      if (stringStatus === "VotingRound1Open") {
        console.log("Fetching Round 1 voting assignments");
        dispatch(fetchRound1VotingAssignments(id));
      } else if (stringStatus === "VotingRound2Open") {
        console.log("Fetching Round 2 voting submissions");
        dispatch(fetchRound2VotingSubmissions(id));
      }
    }
  }, [dispatch, competition?.competitionId, competition?.status, loading, isAuthenticated, id]);

  // Fetch user submission when competition is loaded and user is authenticated
  useEffect(() => {
    if (competition?.competitionId && isAuthenticated && id && !loadingUserSubmission) {
      const competitionKey = `${id}-${refreshSubmission}`;
      
      // Only fetch if we haven't already fetched for this competition (and refresh state)
      if (!fetchedSubmissionRef.current.has(competitionKey)) {
        console.log('Fetching user submission for competition:', id);
        fetchedSubmissionRef.current.add(competitionKey);
        dispatch(getUserSubmission(id));
      }
    }
  }, [dispatch, competition?.competitionId, isAuthenticated, id, refreshSubmission]);

  // Check if user has already submitted to this competition
  const hasSubmittedToCompetition = () => {
    return userSubmission !== null;
  };

  // Handle submission deletion callback
  const handleSubmissionDeleted = () => {
    // Trigger a refresh of the submission data
    setRefreshSubmission(prev => prev + 1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Navigate to submission page or user's submission section
  const handleSubmit = () => {
    // If user has already submitted, scroll to their submission
    if (hasSubmittedToCompetition() && userSubmission) {
      const userSubmissionElement = document.getElementById('user-submission-section');
      if (userSubmissionElement) {
        userSubmissionElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
    }
    
    // If we have the submission form embedded in the page, scroll to it
    if (isOpenForSubmissions && !hasSubmittedToCompetition()) {
      const submissionFormElement = document.getElementById('submission-form');
      if (submissionFormElement) {
        submissionFormElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
    }
    
    // Otherwise navigate to the submission page as before
    navigate(`/competitions/${id}/submit`);
  };

  // Navigate to results page
  const viewResults = () => {
    navigate(`/competitions/${id}/results`);
  };

  // Show loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Loading competition details...</span>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Error loading competition: {error}</Alert>
      </Container>
    );
  }

  // Show not found state
  if (!competition) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Competition not found. The competition may have been removed or you
          may have entered an incorrect URL.
        </Alert>
        <Button variant="primary" onClick={() => navigate("/competitions")}>
          View All Competitions
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          {/* Competition Header */}
          <div className="mb-4">
            {" "}
            <div className="d-flex justify-content-between align-items-start mb-3">
              {" "}
              <div>
                {" "}
                <h1 className="mb-2" style={{ color: "var(--accent-primary)" }}>
                  {competition.title}
                </h1>{" "}
                <div className="d-flex align-items-center mb-3">
                  {" "}
                  <Badge
                    bg={badgeColor}
                    className="me-3 py-2 px-3"
                    style={{
                      fontWeight: "var(--font-weight-medium)",
                      border: "1px solid var(--accent-primary)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {" "}
                    {displayName}{" "}
                  </Badge>{" "}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {" "}
                    <FaUsers
                      className="me-1"
                      style={{ color: "var(--accent-primary)" }}
                    />{" "}
                    {competition?.submissionCount || 0} submissions{" "}
                  </span>{" "}
                </div>{" "}
              </div>
              {/* Action buttons based on status */}
              <div>
                {isOpenForSubmissions && isAuthenticated ? (
                  (() => {
                    const deadlinePassed = competition?.submissionDeadline && 
                      new Date(competition.submissionDeadline) < new Date();
                    const hasSubmitted = hasSubmittedToCompetition();
                    
                    return (
                      <Button 
                        variant={deadlinePassed && !hasSubmitted ? "secondary" : "primary"}
                        size="lg" 
                        onClick={deadlinePassed && !hasSubmitted ? undefined : handleSubmit}
                        disabled={deadlinePassed && !hasSubmitted}
                        className="px-4 py-2 submit-mix-btn"
                        style={deadlinePassed && !hasSubmitted ? { 
                          opacity: 0.6, 
                          cursor: "not-allowed" 
                        } : {}}
                      >
                        <FaMusic className="me-2" />
                        {deadlinePassed && !hasSubmitted 
                          ? "Submission Deadline Passed" 
                          : hasSubmitted 
                            ? "View Your Submission" 
                            : "Submit Your Mix"}
                      </Button>
                    );
                  })()
                ) : isCompleted ? (
                  <Button variant="primary" onClick={viewResults} className="px-4 py-2">
                    <FaTrophy className="me-2" />
                    View Results
                  </Button>
                ) : null}
              </div>
            </div>
            {/* Competition Timeline */}
            <CompetitionTimeline
              currentPhaseKey={phaseKey}
            />
          </div>

          {/* Competition details */}
          <Card
            className="mb-4 border-0 shadow-sm"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            {" "}
            <Card.Body>
              {" "}
              <h4 className="mb-3" style={{ color: "var(--accent-primary)" }}>
                About This Competition
              </h4>{" "}
              <Row className="mb-4">
                {" "}
                <Col md={6}>
                  {" "}
                  <p className="mb-2" style={{ color: "var(--text-primary)" }}>
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Genre:
                    </strong>{" "}
                    {formatGenre(competition.genre)}
                  </p>{" "}
                  <p className="mb-2" style={{ color: "var(--text-primary)" }}>
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Song Creator:
                    </strong>{" "}
                    {competition.songCreator || "Anonymous"}
                  </p>{" "}
                </Col>{" "}
                <Col md={6}>
                  {" "}
                  <p className="mb-2" style={{ color: "var(--text-primary)" }}>
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Submission Deadline:
                    </strong>{" "}
                    <span
                      style={{
                        color:
                          competition.submissionDeadline &&
                          new Date(competition.submissionDeadline) < new Date()
                            ? "var(--danger)"
                            : "var(--text-primary)",
                      }}
                    >
                      {competition.submissionDeadline
                        ? formatDate(competition.submissionDeadline)
                        : "N/A"}
                    </span>
                  </p>{" "}
                  <p className="mb-2" style={{ color: "var(--text-primary)" }}>
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Date Created:
                    </strong>{" "}
                    {competition.creationDate
                      ? formatDate(competition.creationDate)
                      : "N/A"}
                  </p>{" "}
                </Col>{" "}
              </Row>{" "}
              <div className="mt-3 mb-4">
                {" "}
                <h5 className="mb-3" style={{ color: "var(--accent-primary)" }}>
                  Description
                </h5>{" "}
                <div
                  className="p-3 rounded"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  {" "}
                  <p
                    className="mb-0"
                    style={{
                      whiteSpace: "pre-line",
                      color: "var(--text-primary)",
                    }}
                  >
                    {" "}
                    {competition.description ||
                      "No description provided for this competition."}{" "}
                  </p>{" "}
                </div>{" "}

                {/* Mixed Track Preview - if available */}
                {competition.mixedTrackUrl && (
                  <div className="mt-4 mb-4">
                    <h5 className="mb-3" style={{ color: "var(--accent-primary)" }}>
                      Mixed Track Preview
                    </h5>
                    <Card
                      className="border-0"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <FaMusic className="me-2" style={{ color: "var(--accent-primary)" }} />
                          <h6 className="mb-0" style={{ color: "var(--text-primary)" }}>
                            Listen to the Final Mixed Version
                          </h6>
                        </div>
                        <p className="mb-3 small" style={{ color: "var(--text-secondary)" }}>
                          This is the final mixed version of the track. Use this as a reference for your own mix.
                        </p>
                        
                        <audio
                          ref={mixedTrackRef}
                          controls
                          preload="metadata"
                          style={{ 
                            width: "100%", 
                            maxWidth: "500px",
                            height: "40px"
                          }}
                          className="rounded"
                        >
                          <source src={competition.mixedTrackUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </div>{" "}
              {competition.rules && (
                <div className="mt-3">
                  {" "}
                  <h5
                    className="mb-2"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Rules & Guidelines
                  </h5>{" "}
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {" "}
                    <p
                      className="mb-0"
                      style={{
                        whiteSpace: "pre-line",
                        color: "var(--text-primary)",
                      }}
                    >
                      {" "}
                      {competition.rules}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>
              )}
              {/* Source material (if available) */}
              {competition.sourceTrackUrl && (
                <div className="mt-4">
                  <h5
                    className="mb-3"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Source Material
                  </h5>
                  <Card
                    className="border-0"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <FaMusic className="me-2" style={{ color: "var(--accent-primary)" }} />
                        <h6 className="mb-0" style={{ color: "var(--text-primary)" }}>
                          Listen to the Source Track
                        </h6>
                      </div>
                      <p className="mb-3 small" style={{ color: "var(--text-secondary)" }}>
                        This is the source track for this competition. Listen to get familiar with the material you'll be working with.
                      </p>
                      
                      <audio
                        ref={sourceTrackRef}
                        controls
                        preload="metadata"
                        style={{ 
                          width: "100%", 
                          maxWidth: "500px",
                          height: "40px"
                        }}
                        className="rounded"
                      >
                        <source src={competition.sourceTrackUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Multitrack Download Section - only visible when competition is open for submissions */}
          {isOpenForSubmissions && (
            <MultitrackDownloadSection competitionId={id} />
          )}

          {/* Submission Form - only visible when competition is open, user is authenticated and hasn't submitted yet */}
          {isOpenForSubmissions &&
            isAuthenticated &&
            !hasSubmittedToCompetition() &&
            new Date(competition?.submissionDeadline) >= new Date() && (
              <SubmissionUploadForm competitionId={id} />
            )}

          {/* User Submission Card - show when user has submitted */}
          {isOpenForSubmissions &&
            isAuthenticated &&
            hasSubmittedToCompetition() &&
            userSubmission && (
              <div id="user-submission-section">
                <UserSubmissionCard
                  submission={userSubmission}
                  competitionId={id}
                  canDelete={new Date(competition?.submissionDeadline) >= new Date()}
                  onDeleted={handleSubmissionDeleted}
                />
              </div>
            )}

          {/* Loading user submission */}
          {isOpenForSubmissions &&
            isAuthenticated &&
            loadingUserSubmission && (
              <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: "var(--card-bg)" }}>
                <Card.Body className="text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Loading your submission...</span>
                </Card.Body>
              </Card>
            )}

          {/* No submission found but not loading - helpful message */}
          {isOpenForSubmissions &&
            isAuthenticated &&
            !loadingUserSubmission &&
            !hasSubmittedToCompetition() &&
            userSubmission === null &&
            new Date(competition?.submissionDeadline) >= new Date() && (
              <Alert 
                variant="info" 
                className="mb-4"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--accent-primary)",
                  color: "var(--text-primary)"
                }}
              >
                <Alert.Heading style={{ color: "var(--accent-primary)" }}>
                  Ready to Submit Your Mix?
                </Alert.Heading>
                <p style={{ color: "var(--text-primary)" }}>
                  You haven't submitted a mix to this competition yet. 
                  Download the source track above and create your mix, then use the submission form below.
                </p>
                <p className="mb-0" style={{ color: "var(--text-primary)" }}>
                  <strong>Deadline:</strong> {formatDate(competition?.submissionDeadline)}
                </p>
              </Alert>
            )}

          {/* User has not submitted and deadline passed */}
          {isOpenForSubmissions &&
            isAuthenticated &&
            !hasSubmittedToCompetition() &&
            new Date(competition?.submissionDeadline) < new Date() && (
              <Alert 
                variant="warning" 
                className="mb-4"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "#ffc107",
                  color: "var(--text-primary)"
                }}
              >
                <Alert.Heading style={{ color: "#ffc107" }}>
                  Submission Deadline Passed
                </Alert.Heading>
                <p style={{ color: "var(--text-primary)" }}>
                  The deadline for submissions to this competition has passed.
                  Unfortunately, new submissions are no longer being accepted.
                </p>
              </Alert>
            )}

          {/* Not authenticated message */}
          {!isAuthenticated && isOpenForSubmissions && (
            <Alert 
              variant="info" 
              className="mb-4"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--accent-primary)",
                color: "var(--text-primary)"
              }}
            >
              <Alert.Heading style={{ color: "var(--accent-primary)" }}>
                Want to participate?
              </Alert.Heading>
              <p style={{ color: "var(--text-primary)" }}>
                You need to sign in to submit your mix to this competition.
              </p>
              <div className="d-flex">
                <Button
                  variant="primary"
                  onClick={() => navigate("/login")}
                  className="me-2"
                >
                  Sign In
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </Button>
              </div>
            </Alert>
          )}

          {/* Voting components based on competition status */}
          {showVotingComponents && (
            <>
              {isVotingRound1 && (
                <>
                  {useJudgingInterface ? (
                    <JudgingInterface
                      competitionId={id}
                      submissions={round1Assignments}
                      onJudgmentSubmit={handleJudgmentSubmit}
                      votingDeadline={votingDeadline}
                      hasVoted={hasVotedRound1}
                      initialSubmissionId={selectedSubmissionForJudging}
                    />
                  ) : (
                    <VotingRound1Card
                      competitionId={id}
                      assignedSubmissions={round1Assignments}
                      hasVoted={hasVotedRound1}
                      votingDeadline={votingDeadline}
                      scorecardScores={scorecardScores}
                      onScoreSubmission={(submissionId) => {
                        // Switch to judging interface with specific submission
                        setSelectedSubmissionForJudging(submissionId);
                        setUseJudgingInterface(true);
                      }}
                    />
                  )}
                  
                  {/* Toggle button for demonstration */}
                  <Card className="mt-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ color: "var(--text-primary)" }}>
                          Interface Mode: {useJudgingInterface ? "Judging" : "Voting"}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmissionForJudging(null); // Clear specific submission selection
                            setUseJudgingInterface(!useJudgingInterface);
                          }}
                          style={{
                            borderColor: "var(--accent-primary)",
                            color: "var(--accent-primary)"
                          }}
                        >
                          Switch to {useJudgingInterface ? "Voting" : "Judging"} Interface
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </>
              )}

              {isVotingRound2 && (
                <div className="voting-round2-container" id="round2-voting">
                  <VotingRound2Card
                    competitionId={id}
                    advancedSubmissions={round2Submissions}
                    hasVoted={hasVotedRound2}
                    votingDeadline={votingDeadline}
                    isEligibleVoter={isEligibleForRound2Voting}
                  />
                </div>
              )}
            </>
          )}

          {/* Waiting for results message */}
          {isAuthenticated && isVotingTallying && (
            <Alert 
              variant="info" 
              className="mb-4"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--accent-primary)",
                color: "var(--text-primary)"
              }}
            >
              <Alert.Heading style={{ color: "var(--accent-primary)" }}>
                Votes are being tallied!
              </Alert.Heading>
              <p style={{ color: "var(--text-primary)" }}>
                The voting phase has ended, and we're now calculating the
                results. Please check back soon for the next phase of the
                competition.
              </p>
            </Alert>
          )}
        </Col>

        <Col lg={4}>
          {/* Judging/Voting Interface Button - Show during voting rounds */}
          {showVotingComponents && (
            <Card
              className="border-0 shadow-sm mb-4"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <Card.Body className="text-center py-4">
                {isVotingRound1 ? (
                  // Round 1 - Judging Interface
                  hasVotedRound1 ? (
                    <>
                      <h5 className="mb-3" style={{ color: "var(--accent-secondary)" }}>
                        ✅ Judging Complete
                      </h5>
                      <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                        Thank you for completing your judging! Your scores and feedback have been submitted.
                      </p>
                      <div 
                        className="px-4 py-2 rounded"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderLeft: "4px solid var(--accent-secondary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        <small>
                          <strong>What's Next:</strong> Wait for all judging to complete, then Round 2 voting will begin.
                        </small>
                      </div>
                    </>
                  ) : (
                    <>
                      <h5 className="mb-3" style={{ color: "var(--accent-primary)" }}>
                        🎯 Judge Submissions
                      </h5>
                      <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                        Listen to anonymous submissions and provide detailed scoring and feedback
                      </p>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          setSelectedSubmissionForJudging(null);
                          setUseJudgingInterface(true);
                          // Scroll to judging interface
                          setTimeout(() => {
                            const judgingElement = document.querySelector('.judging-interface-container');
                            if (judgingElement) {
                              judgingElement.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        className="px-4 py-2"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          borderColor: "var(--accent-primary)",
                          fontWeight: "600"
                        }}
                      >
                        Start Judging
                      </Button>
                    </>
                  )
                ) : isVotingRound2 ? (
                  // Round 2 - Voting Interface
                  hasVotedRound2 ? (
                    <>
                      <h5 className="mb-3" style={{ color: "var(--accent-secondary)" }}>
                        ✅ Voting Complete
                      </h5>
                      <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                        Thank you for voting! Your Round 2 votes have been submitted successfully.
                      </p>
                      <div 
                        className="px-4 py-2 rounded"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderLeft: "4px solid var(--accent-secondary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        <small>
                          <strong>What's Next:</strong> Results will be announced once voting closes.
                        </small>
                      </div>
                    </>
                  ) : (
                    <>
                      <h5 className="mb-3" style={{ color: "var(--accent-primary)" }}>
                        🗳️ Vote for Finalists
                      </h5>
                      <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                        Listen to the finalist submissions and rank your top 3 favorites
                      </p>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          // Scroll to Round 2 voting interface
                          setTimeout(() => {
                            const votingElement = document.querySelector('.voting-round2-container') || 
                                                 document.querySelector('[data-testid="voting-round2"]') ||
                                                 document.getElementById('round2-voting');
                            if (votingElement) {
                              votingElement.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              // Fallback: scroll to main voting section
                              const mainVotingElement = document.querySelector('.voting-interface-container');
                              if (mainVotingElement) {
                                mainVotingElement.scrollIntoView({ behavior: 'smooth' });
                              }
                            }
                          }, 100);
                        }}
                        className="px-4 py-2"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          borderColor: "var(--accent-primary)",
                          fontWeight: "600"
                        }}
                      >
                        Start Voting
                      </Button>
                    </>
                  )
                ) : null}
              </Card.Body>
            </Card>
          )}

          {/* How the competition works */}
          <Card
            className="border-0 shadow-sm mb-4"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            {" "}
            <Card.Header
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              {" "}
              <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
                How This Works
              </h5>{" "}
            </Card.Header>{" "}
            <Card.Body>
              {" "}
              <ol className="ps-3" style={{ color: "var(--text-primary)" }}>
                {" "}
                <li className="mb-3">
                  {" "}
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Submit Your Mix:
                  </strong>{" "}
                  Download the source track and create your mix{" "}
                </li>{" "}
                <li className="mb-3">
                  {" "}
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Round 1 Voting:
                  </strong>{" "}
                  Participants are assigned to voting groups and vote for their
                  favorite mixes{" "}
                </li>{" "}
                <li className="mb-3">
                  {" "}
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Advancement:
                  </strong>{" "}
                  Top-rated mixes from each group advance to Round 2{" "}
                </li>{" "}
                <li className="mb-3">
                  {" "}
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Round 2 Voting:
                  </strong>{" "}
                  All participants who didn't advance can vote on the finalists.
                  Participants must participate in Round 1 voting to advance to Round 2 Voting{" "}
                </li>{" "}
                <li>
                  {" "}
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Winner Selection:
                  </strong>{" "}
                  The mix with the most points wins!{" "}
                </li>{" "}
              </ol>{" "}
            </Card.Body>{" "}
          </Card>
        </Col>
      </Row>

      <style>
        {`
        /* Smooth scrolling behavior for the entire page */
        html {
          scroll-behavior: smooth;
        }
        
        /* Submit button styles */
        .submit-mix-btn {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .submit-mix-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .submit-mix-btn:disabled {
          background-color: var(--bg-tertiary) !important;
          border-color: var(--border-color) !important;
          color: var(--text-secondary) !important;
          transform: none !important;
          box-shadow: none !important;
          cursor: not-allowed !important;
        }
      `}
      </style>
    </Container>
  );
};

export default CompetitionDetailPage;
