import React, { useState, useEffect } from "react";
import { 
  Card, 
  Button, 
  Badge, 
  Row, 
  Col, 
  Spinner, 
  Alert,
  Form,
  Pagination,
  Image,
  Modal
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  FaPlay, 
  FaPause, 
  FaMusic, 
  FaTrophy, 
  FaCalendar, 
  FaTrash,
  FaEye,
  FaFilter,
  FaSort
} from "react-icons/fa";
import { getUserSubmissions, deleteUserSubmission } from "../../store/competitionSlice";
import SimpleAudioPlayer from "../competitions/SimpleAudioPlayer";

const UserSubmissionsList = ({ isCurrentUser = true }) => {
  const dispatch = useDispatch();
  const { 
    userSubmissions, 
    userSubmissionsTotalCount, 
    userSubmissionsPage, 
    userSubmissionsPageSize,
    loadingUserSubmissions, 
    userSubmissionsError,
    deletingSubmission 
  } = useSelector((state) => state.competitions);

  // Local state for filters and UI
  const [statusFilter, setStatusFilter] = useState("");
  const [competitionStatusFilter, setCompetitionStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("submissionDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  // Load submissions on component mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = (page = 1) => {
    const filters = {
      page,
      pageSize: userSubmissionsPageSize,
      statusFilter: statusFilter || null,
      competitionStatusFilter: competitionStatusFilter || null
    };
    
    dispatch(getUserSubmissions(filters));
  };

  const handlePageChange = (page) => {
    loadSubmissions(page);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadSubmissions(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCompetitionStatusFilter("");
    // Reload without filters
    dispatch(getUserSubmissions({ page: 1, pageSize: userSubmissionsPageSize }));
  };

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (submissionToDelete) {
      try {
        await dispatch(deleteUserSubmission({
          competitionId: submissionToDelete.competitionId,
          submissionId: submissionToDelete.submissionId
        })).unwrap();
        
        // Reload submissions to reflect the change
        loadSubmissions(userSubmissionsPage);
        setShowDeleteModal(false);
        setSubmissionToDelete(null);
      } catch (error) {
        console.error("Error deleting submission:", error);
      }
    }
  };

  const getSubmissionStatusBadge = (status) => {
    const statusConfig = {
      Submitted: { variant: "info", text: "Submitted" },
      UnderReview: { variant: "warning", text: "Under Review" },
      Judged: { variant: "success", text: "Judged" },
      Disqualified: { variant: "danger", text: "Disqualified" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getCompetitionStatusBadge = (status) => {
    const statusConfig = {
      OpenForSubmissions: { variant: "primary", text: "Open" },
      VotingRound1Open: { variant: "info", text: "Voting R1" },
      VotingRound2Open: { variant: "info", text: "Voting R2" },
      Completed: { variant: "success", text: "Completed" },
      Cancelled: { variant: "danger", text: "Cancelled" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    return <Badge bg={config.variant} className="ms-1">{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loadingUserSubmissions && userSubmissions.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading your submissions...</p>
      </div>
    );
  }

  if (userSubmissionsError) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Submissions</Alert.Heading>
        <p>{userSubmissionsError}</p>
        <Button variant="outline-danger" onClick={() => loadSubmissions()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (userSubmissions.length === 0) {
    return (
      <div className="text-center py-5">
        <FaMusic size={48} className="text-muted mb-3" />
        <h5 className="text-muted">No Submissions Found</h5>
        <p className="text-muted">
          {isCurrentUser 
            ? "You haven't submitted to any competitions yet. Check out our active competitions to get started!"
            : "This user hasn't submitted to any competitions yet."
          }
        </p>
        {isCurrentUser && (
          <Link to="/competitions">
            <Button variant="primary">Browse Competitions</Button>
          </Link>
        )}
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(userSubmissionsTotalCount / userSubmissionsPageSize);
  const startItem = (userSubmissionsPage - 1) * userSubmissionsPageSize + 1;
  const endItem = Math.min(userSubmissionsPage * userSubmissionsPageSize, userSubmissionsTotalCount);

  return (
    <div>
      {/* Header with filters and stats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">
            {isCurrentUser ? "My Submissions" : "User Submissions"}
          </h5>
          <small className="text-muted">
            Showing {startItem}-{endItem} of {userSubmissionsTotalCount} submissions
          </small>
        </div>
        <div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="me-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-3">
          <Card.Body>
            <Form onSubmit={handleFilterSubmit}>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Submission Status</Form.Label>
                    <Form.Select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="UnderReview">Under Review</option>
                      <option value="Judged">Judged</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Competition Status</Form.Label>
                    <Form.Select 
                      value={competitionStatusFilter} 
                      onChange={(e) => setCompetitionStatusFilter(e.target.value)}
                    >
                      <option value="">All Competitions</option>
                      <option value="OpenForSubmissions">Open</option>
                      <option value="VotingRound1Open">Voting Round 1</option>
                      <option value="VotingRound2Open">Voting Round 2</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button type="submit" variant="primary" className="me-2">
                    Apply Filters
                  </Button>
                  <Button variant="outline-secondary" onClick={handleClearFilters}>
                    Clear
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Submissions List */}
      <div className="submissions-list">
        {userSubmissions.map((submission) => (
          <Card key={submission.submissionId} className="mb-3 submission-card">
            <Card.Body>
              <Row>
                {/* Competition Image */}
                <Col md={2} className="d-flex align-items-center">
                  {submission.competitionImageUrl ? (
                    <Image 
                      src={submission.competitionImageUrl}
                      alt={submission.competitionTitle}
                      rounded
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    />
                  ) : (
                    <div 
                      className="bg-secondary rounded d-flex align-items-center justify-content-center"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <FaMusic size={24} className="text-white" />
                    </div>
                  )}
                </Col>

                {/* Submission Details */}
                <Col md={6}>
                  <div className="mb-2">
                    <h6 className="mb-1">
                      <Link 
                        to={`/competitions/${submission.competitionId}`}
                        className="text-decoration-none"
                      >
                        {submission.competitionTitle}
                      </Link>
                      {getCompetitionStatusBadge(submission.competitionStatus)}
                    </h6>
                    <h5 className="text-primary mb-1">{submission.mixTitle}</h5>
                    {submission.mixDescription && (
                      <p className="text-muted small mb-2">{submission.mixDescription}</p>
                    )}
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {getSubmissionStatusBadge(submission.status)}
                    
                    {submission.score && (
                      <Badge bg="info">
                        <FaTrophy className="me-1" />
                        Score: {submission.score}
                      </Badge>
                    )}
                    
                    {submission.ranking && (
                      <Badge bg="warning">
                        Rank: #{submission.ranking}
                      </Badge>
                    )}
                  </div>

                  <small className="text-muted">
                    <FaCalendar className="me-1" />
                    Submitted: {formatDate(submission.submissionDate)}
                  </small>
                </Col>

                {/* Audio Player and Actions */}
                <Col md={4} className="d-flex flex-column justify-content-between">
                  {/* Audio Player */}
                  {submission.audioFilePath && (
                    <div className="mb-2">
                      <SimpleAudioPlayer 
                        audioUrl={submission.audioFilePath}
                        submissionId={submission.submissionId}
                        title={submission.mixTitle}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <Link to={`/competitions/${submission.competitionId}`}>
                      <Button variant="outline-primary" size="sm">
                        <FaEye className="me-1" />
                        View Competition
                      </Button>
                    </Link>
                    
                    {isCurrentUser && submission.canDelete && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteClick(submission)}
                        disabled={deletingSubmission}
                      >
                        <FaTrash className="me-1" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Feedback (if available) */}
                  {submission.feedback && isCurrentUser && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <strong>Feedback:</strong> {submission.feedback}
                      </small>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev 
              disabled={userSubmissionsPage === 1}
              onClick={() => handlePageChange(userSubmissionsPage - 1)}
            />
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = userSubmissionsPage <= 3 
                ? i + 1 
                : userSubmissionsPage + i - 2;
              
              if (pageNum > totalPages) return null;
              
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === userSubmissionsPage}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next 
              disabled={userSubmissionsPage === totalPages}
              onClick={() => handlePageChange(userSubmissionsPage + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submissionToDelete && (
            <div>
              <p>Are you sure you want to delete this submission?</p>
              <div className="border-start border-warning ps-3">
                <h6>{submissionToDelete.mixTitle}</h6>
                <small className="text-muted">
                  From: {submissionToDelete.competitionTitle}
                </small>
              </div>
              <Alert variant="warning" className="mt-3">
                <strong>Warning:</strong> This action cannot be undone. The audio file and all associated data will be permanently removed.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deletingSubmission}
          >
            {deletingSubmission ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              "Delete Submission"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Loading overlay for additional actions */}
      {loadingUserSubmissions && userSubmissions.length > 0 && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className="bg-primary text-white p-2 rounded d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            Refreshing...
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubmissionsList; 