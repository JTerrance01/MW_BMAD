import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
  ProgressBar,
  Modal,
  ListGroup,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import {
  transitionCompetitionPhase,
  getCompetitionVotingProgress,
  resolveCompetitionTie,
  recordSongCreatorPicks,
} from "../../store/adminSlice";
import {
  FaCheck,
  FaTimes,
  FaVoteYea,
  FaTrophy,
  FaCrown,
  FaSync,
} from "react-icons/fa";

// Competition status constants
const COMPETITION_STATUSES = {
  OPEN_FOR_SUBMISSIONS: "OpenForSubmission",
  VOTING_ROUND1_SETUP: "VotingRound1Setup",
  VOTING_ROUND1_OPEN: "VotingRound1Open",
  VOTING_ROUND1_TALLYING: "VotingRound1Tallying",
  VOTING_ROUND2_SETUP: "VotingRound2Setup",
  VOTING_ROUND2_OPEN: "VotingRound2Open",
  VOTING_ROUND2_TALLYING: "VotingRound2Tallying",
  REQUIRES_MANUAL_WINNER: "RequiresManualWinnerSelection",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

// Get badge color for competition status
const getStatusBadgeColor = (status) => {
  switch (status) {
    case COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS:
      return "primary";
    case COMPETITION_STATUSES.VOTING_ROUND1_SETUP:
    case COMPETITION_STATUSES.VOTING_ROUND2_SETUP:
      return "info";
    case COMPETITION_STATUSES.VOTING_ROUND1_OPEN:
    case COMPETITION_STATUSES.VOTING_ROUND2_OPEN:
      return "warning";
    case COMPETITION_STATUSES.VOTING_ROUND1_TALLYING:
    case COMPETITION_STATUSES.VOTING_ROUND2_TALLYING:
      return "secondary";
    case COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER:
      return "danger";
    case COMPETITION_STATUSES.COMPLETED:
      return "success";
    case COMPETITION_STATUSES.ARCHIVED:
      return "dark";
    default:
      return "primary";
  }
};

// Get human-readable status
const getStatusDisplayName = (status) => {
  const displayMap = {
    [COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS]: "Open for Submissions",
    [COMPETITION_STATUSES.VOTING_ROUND1_SETUP]: "Round 1 Setup",
    [COMPETITION_STATUSES.VOTING_ROUND1_OPEN]: "Round 1 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND1_TALLYING]: "Round 1 Tallying",
    [COMPETITION_STATUSES.VOTING_ROUND2_SETUP]: "Round 2 Setup",
    [COMPETITION_STATUSES.VOTING_ROUND2_OPEN]: "Round 2 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND2_TALLYING]: "Round 2 Tallying",
    [COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER]: "Needs Tie Resolution",
    [COMPETITION_STATUSES.COMPLETED]: "Completed",
    [COMPETITION_STATUSES.ARCHIVED]: "Archived",
  };

  return displayMap[status] || "Unknown Status";
};

// Get next status for transition
const getNextStatus = (currentStatus) => {
  const statusTransitions = {
    [COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS]:
      COMPETITION_STATUSES.VOTING_ROUND1_SETUP,
    [COMPETITION_STATUSES.VOTING_ROUND1_SETUP]:
      COMPETITION_STATUSES.VOTING_ROUND1_OPEN,
    [COMPETITION_STATUSES.VOTING_ROUND1_OPEN]:
      COMPETITION_STATUSES.VOTING_ROUND1_TALLYING,
    [COMPETITION_STATUSES.VOTING_ROUND1_TALLYING]:
      COMPETITION_STATUSES.VOTING_ROUND2_SETUP,
    [COMPETITION_STATUSES.VOTING_ROUND2_SETUP]:
      COMPETITION_STATUSES.VOTING_ROUND2_OPEN,
    [COMPETITION_STATUSES.VOTING_ROUND2_OPEN]:
      COMPETITION_STATUSES.VOTING_ROUND2_TALLYING,
    [COMPETITION_STATUSES.VOTING_ROUND2_TALLYING]:
      COMPETITION_STATUSES.COMPLETED,
  };

  return statusTransitions[currentStatus] || null;
};

// Main Component
const CompetitionMonitoringPanel = ({ competition, onRefreshCompetition }) => {
  const dispatch = useDispatch();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [votingProgress, setVotingProgress] = useState(null);
  const [showTransitionConfirm, setShowTransitionConfirm] = useState(false);
  const [showTieResolutionModal, setShowTieResolutionModal] = useState(false);
  const [showSongCreatorPicksModal, setShowSongCreatorPicksModal] =
    useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);
  const [songCreatorPicks, setSongCreatorPicks] = useState({
    first: null,
    second: null,
    third: null,
  });

  // Get voting progress data for current competition
  useEffect(() => {
    if (
      competition &&
      (competition.status === COMPETITION_STATUSES.VOTING_ROUND1_OPEN ||
        competition.status === COMPETITION_STATUSES.VOTING_ROUND1_TALLYING ||
        competition.status === COMPETITION_STATUSES.VOTING_ROUND2_OPEN ||
        competition.status === COMPETITION_STATUSES.VOTING_ROUND2_TALLYING ||
        competition.status === COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER)
    ) {
      fetchVotingProgress();
    }
  }, [competition?.id, competition?.status]);

  // Fetch voting progress data
  const fetchVotingProgress = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await dispatch(
        getCompetitionVotingProgress(competition.id)
      ).unwrap();
      setVotingProgress(response);
    } catch (err) {
      setError(
        "Failed to fetch voting progress data. " +
          (err.message || "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle competition phase transition
  const handleTransitionPhase = async () => {
    setLoading(true);
    setError(null);

    const nextStatus = getNextStatus(competition.status);
    if (!nextStatus) {
      setError("No valid transition available for the current status.");
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        transitionCompetitionPhase({
          competitionId: competition.id,
          targetStatus: nextStatus,
        })
      ).unwrap();

      // Refresh competition data after transition
      onRefreshCompetition();
      setShowTransitionConfirm(false);
    } catch (err) {
      setError(
        "Failed to transition competition phase. " +
          (err.message || "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle tie resolution
  const handleResolveTie = async () => {
    if (!selectedWinnerId) {
      setError("Please select a winner to resolve the tie.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dispatch(
        resolveCompetitionTie({
          competitionId: competition.id,
          winningSubmissionId: selectedWinnerId,
        })
      ).unwrap();

      // Refresh competition data after tie resolution
      onRefreshCompetition();
      setShowTieResolutionModal(false);
    } catch (err) {
      setError(
        "Failed to resolve tie. " + (err.message || "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle song creator picks submission
  const handleSubmitSongCreatorPicks = async () => {
    // Validate if all picks are selected
    if (
      !songCreatorPicks.first ||
      !songCreatorPicks.second ||
      !songCreatorPicks.third
    ) {
      setError("Please select all three song creator picks.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dispatch(
        recordSongCreatorPicks({
          competitionId: competition.id,
          picks: [
            { submissionId: songCreatorPicks.first, rank: 1 },
            { submissionId: songCreatorPicks.second, rank: 2 },
            { submissionId: songCreatorPicks.third, rank: 3 },
          ],
        })
      ).unwrap();

      // Refresh competition data
      onRefreshCompetition();
      setShowSongCreatorPicksModal(false);
    } catch (err) {
      setError(
        "Failed to submit song creator picks. " +
          (err.message || "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Find a submission by ID in voting progress data
  const findSubmission = (submissionId) => {
    if (!votingProgress || !votingProgress.submissions) return null;

    return votingProgress.submissions.find((s) => s.id === submissionId);
  };

  // Check if a specific action is available
  const isActionAvailable = (action) => {
    if (!competition) return false;

    switch (action) {
      case "transition":
        return getNextStatus(competition.status) !== null;

      case "resolveTie":
        return (
          competition.status === COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER
        );

      case "songCreatorPicks":
        return (
          competition.status === COMPETITION_STATUSES.VOTING_ROUND2_OPEN ||
          competition.status === COMPETITION_STATUSES.VOTING_ROUND2_TALLYING ||
          competition.status === COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER ||
          competition.status === COMPETITION_STATUSES.COMPLETED
        );

      default:
        return false;
    }
  };

  // Return early for missing competition
  if (!competition) {
    return (
      <Alert variant="warning">
        No competition data available for monitoring.
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Competition Monitoring</h5>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Row className="mb-4">
          <Col md={6}>
            <h6>Competition Details</h6>
            <Table striped bordered hover size="sm">
              <tbody>
                <tr>
                  <th style={{ width: "30%" }}>Title</th>
                  <td>{competition.title}</td>
                </tr>
                <tr>
                  <th>Current Status</th>
                  <td>
                    <Badge bg={getStatusBadgeColor(competition.status)}>
                      {getStatusDisplayName(competition.status)}
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <th>Submission Count</th>
                  <td>{competition.submissionCount || "N/A"}</td>
                </tr>
                <tr>
                  <th>Deadline</th>
                  <td>{new Date(competition.deadline).toLocaleString()}</td>
                </tr>
              </tbody>
            </Table>

            <div className="d-flex gap-2 mt-3">
              {isActionAvailable("transition") && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowTransitionConfirm(true)}
                  disabled={loading}
                >
                  <FaSync className="me-1" />
                  Transition to Next Phase
                </Button>
              )}

              {isActionAvailable("resolveTie") && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowTieResolutionModal(true)}
                  disabled={loading}
                >
                  <FaTrophy className="me-1" />
                  Resolve Tie
                </Button>
              )}

              {isActionAvailable("songCreatorPicks") && (
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => setShowSongCreatorPicksModal(true)}
                  disabled={loading}
                >
                  <FaCrown className="me-1" />
                  Song Creator Picks
                </Button>
              )}
            </div>
          </Col>

          <Col md={6}>
            <h6 className="d-flex justify-content-between align-items-center">
              <span>Voting Progress</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={fetchVotingProgress}
                disabled={loading}
              >
                <FaSync className={loading ? "mr-1 spin" : "me-1"} />
                Refresh
              </Button>
            </h6>

            {loading && !votingProgress ? (
              <div className="text-center py-4">
                <Spinner
                  animation="border"
                  role="status"
                  size="sm"
                  className="me-2"
                />
                Loading voting data...
              </div>
            ) : votingProgress ? (
              <div>
                <Row className="mb-3">
                  <Col xs={6}>
                    <Card className="bg-light">
                      <Card.Body className="p-2 text-center">
                        <h3 className="text-primary mb-0">
                          {votingProgress.eligibleVotersCount}
                        </h3>
                        <small className="text-muted">Eligible Voters</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6}>
                    <Card className="bg-light">
                      <Card.Body className="p-2 text-center">
                        <h3 className="text-primary mb-0">
                          {votingProgress.votesSubmittedCount}
                        </h3>
                        <small className="text-muted">Votes Submitted</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <p className="mb-1">Voting Completion</p>
                <ProgressBar
                  now={votingProgress.votingCompletionPercentage}
                  label={`${votingProgress.votingCompletionPercentage}%`}
                  variant="success"
                  className="mb-3"
                />

                {/* If there are tied submissions, show alert */}
                {competition.status ===
                  COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER && (
                  <Alert variant="warning" className="mb-3">
                    <FaVoteYea className="me-2" />
                    Manual winner selection required! There is a true tie.
                  </Alert>
                )}

                {/* If in Round 2, show top submissions */}
                {(competition.status ===
                  COMPETITION_STATUSES.VOTING_ROUND2_OPEN ||
                  competition.status ===
                    COMPETITION_STATUSES.VOTING_ROUND2_TALLYING ||
                  competition.status ===
                    COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER ||
                  competition.status === COMPETITION_STATUSES.COMPLETED) && (
                  <div className="mt-2">
                    <small className="text-muted mb-1 d-block">
                      Top Submissions
                    </small>
                    <ListGroup variant="flush" className="small border rounded">
                      {votingProgress.submissions
                        ?.filter((s) => s.isFinalist || s.isWinner)
                        ?.sort((a, b) => b.score - a.score)
                        ?.map((sub, index) => (
                          <ListGroup.Item
                            key={sub.id}
                            className="py-2 d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-bold d-flex align-items-center">
                                {sub.isWinner && (
                                  <FaTrophy
                                    className="text-warning me-1"
                                    size={14}
                                  />
                                )}
                                {sub.title || `Submission #${sub.number}`}
                              </div>
                              <small className="text-muted">
                                Score: {sub.score} pts
                                {sub.hasOwnProperty("firstPlaceVotes") &&
                                  ` (${sub.firstPlaceVotes || 0} first, ${
                                    sub.secondPlaceVotes || 0
                                  } second)`}
                              </small>
                            </div>
                            {sub.groupName && (
                              <Badge bg="secondary">
                                Group {sub.groupName}
                              </Badge>
                            )}
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted">
                No voting progress data available for this competition phase.
              </p>
            )}
          </Col>
        </Row>

        {/* Display disqualified submissions if any */}
        {votingProgress?.disqualifiedSubmissions?.length > 0 && (
          <div className="mt-2">
            <h6 className="mb-2">Disqualified Submissions</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>User</th>
                  <th>Reason</th>
                  <th>Disqualified On</th>
                </tr>
              </thead>
              <tbody>
                {votingProgress.disqualifiedSubmissions.map((disq) => (
                  <tr key={disq.submissionId}>
                    <td>{disq.submissionTitle}</td>
                    <td>{disq.username}</td>
                    <td>{disq.reason || "No reason specified"}</td>
                    <td>{new Date(disq.disqualifiedOn).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Phase Transition Confirmation Modal */}
      <Modal
        show={showTransitionConfirm}
        onHide={() => setShowTransitionConfirm(false)}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Phase Transition</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to transition this competition from{" "}
            <Badge bg={getStatusBadgeColor(competition.status)}>
              {getStatusDisplayName(competition.status)}
            </Badge>{" "}
            to{" "}
            <Badge bg={getStatusBadgeColor(getNextStatus(competition.status))}>
              {getStatusDisplayName(getNextStatus(competition.status))}
            </Badge>
            ?
          </p>
          <Alert variant="warning">
            <strong>Warning:</strong> This action may trigger automated
            processes and cannot be easily reversed.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTransitionConfirm(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTransitionPhase}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              "Confirm Transition"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Tie Resolution Modal */}
      <Modal
        show={showTieResolutionModal}
        onHide={() => setShowTieResolutionModal(false)}
        backdrop="static"
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Resolve Tie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            There is a tie between multiple submissions. Please select the
            winner:
          </p>

          {votingProgress?.tiedSubmissions?.length > 0 ? (
            <ListGroup>
              {votingProgress.tiedSubmissions.map((sub) => (
                <ListGroup.Item
                  key={sub.id}
                  action
                  active={selectedWinnerId === sub.id}
                  onClick={() => setSelectedWinnerId(sub.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-bold">
                      {sub.title || `Submission #${sub.number}`}
                    </div>
                    <small>
                      Score: {sub.score} pts ({sub.firstPlaceVotes || 0} first,{" "}
                      {sub.secondPlaceVotes || 0} second)
                    </small>
                  </div>
                  {selectedWinnerId === sub.id && (
                    <FaCheck className="text-success" />
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="warning">
              No tied submissions found. Please refresh the voting progress
              data.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTieResolutionModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleResolveTie}
            disabled={loading || !selectedWinnerId}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              "Select as Winner"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Song Creator Picks Modal */}
      <Modal
        show={showSongCreatorPicksModal}
        onHide={() => setShowSongCreatorPicksModal(false)}
        backdrop="static"
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Song Creator Picks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select the Song Creator's top three picks from the finalists:</p>

          {votingProgress?.submissions?.filter((s) => s.isFinalist)?.length >
          0 ? (
            <>
              <div className="mb-4">
                <h6>1st Place Pick</h6>
                <ListGroup>
                  {votingProgress.submissions
                    .filter((s) => s.isFinalist)
                    .map((sub) => (
                      <ListGroup.Item
                        key={`first-${sub.id}`}
                        action
                        active={songCreatorPicks.first === sub.id}
                        onClick={() =>
                          setSongCreatorPicks({
                            ...songCreatorPicks,
                            first: sub.id,
                          })
                        }
                        disabled={
                          songCreatorPicks.second === sub.id ||
                          songCreatorPicks.third === sub.id
                        }
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>{sub.title || `Submission #${sub.number}`}</div>
                        {songCreatorPicks.first === sub.id && (
                          <FaCheck className="text-success" />
                        )}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </div>

              <div className="mb-4">
                <h6>2nd Place Pick</h6>
                <ListGroup>
                  {votingProgress.submissions
                    .filter((s) => s.isFinalist)
                    .map((sub) => (
                      <ListGroup.Item
                        key={`second-${sub.id}`}
                        action
                        active={songCreatorPicks.second === sub.id}
                        onClick={() =>
                          setSongCreatorPicks({
                            ...songCreatorPicks,
                            second: sub.id,
                          })
                        }
                        disabled={
                          songCreatorPicks.first === sub.id ||
                          songCreatorPicks.third === sub.id
                        }
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>{sub.title || `Submission #${sub.number}`}</div>
                        {songCreatorPicks.second === sub.id && (
                          <FaCheck className="text-success" />
                        )}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </div>

              <div className="mb-3">
                <h6>3rd Place Pick</h6>
                <ListGroup>
                  {votingProgress.submissions
                    .filter((s) => s.isFinalist)
                    .map((sub) => (
                      <ListGroup.Item
                        key={`third-${sub.id}`}
                        action
                        active={songCreatorPicks.third === sub.id}
                        onClick={() =>
                          setSongCreatorPicks({
                            ...songCreatorPicks,
                            third: sub.id,
                          })
                        }
                        disabled={
                          songCreatorPicks.first === sub.id ||
                          songCreatorPicks.second === sub.id
                        }
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>{sub.title || `Submission #${sub.number}`}</div>
                        {songCreatorPicks.third === sub.id && (
                          <FaCheck className="text-success" />
                        )}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </div>
            </>
          ) : (
            <Alert variant="warning">
              No finalist submissions found. Please refresh the voting progress
              data.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSongCreatorPicksModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitSongCreatorPicks}
            disabled={
              loading ||
              !songCreatorPicks.first ||
              !songCreatorPicks.second ||
              !songCreatorPicks.third
            }
          >
            {loading ? (
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
              "Submit Song Creator Picks"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default CompetitionMonitoringPanel;
