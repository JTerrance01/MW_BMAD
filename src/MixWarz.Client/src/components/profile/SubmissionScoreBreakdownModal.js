import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Alert,
  Spinner,
  ProgressBar,
  Badge,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { FaTimes, FaTrophy, FaUsers, FaInfoCircle } from "react-icons/fa";
import competitionService from "../../services/competitionService";

const SubmissionScoreBreakdownModal = ({
  show,
  onHide,
  competitionId,
  submissionId,
  submissionTitle,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);

  useEffect(() => {
    if (show && competitionId && submissionId) {
      fetchScoreBreakdown();
    }
  }, [show, competitionId, submissionId]);

  const fetchScoreBreakdown = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await competitionService.getSubmissionScoreBreakdown(
        competitionId,
        submissionId
      );
      setScoreBreakdown(data);
    } catch (err) {
      setError(err.message || "Failed to load score breakdown");
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarVariant = (average, min, max) => {
    const percentage = ((average - min) / (max - min)) * 100;
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  const calculatePercentage = (score, min, max) => {
    return ((score - min) / (max - min)) * 100;
  };

  const handleClose = () => {
    setScoreBreakdown(null);
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header className="bg-dark text-light border-secondary">
        <Modal.Title className="d-flex align-items-center">
          <FaTrophy className="me-2 text-warning" />
          Score Breakdown
        </Modal.Title>
        <Button
          variant="outline-light"
          size="sm"
          onClick={handleClose}
          className="ms-auto border-0"
        >
          <FaTimes />
        </Button>
      </Modal.Header>

      <Modal.Body className="bg-dark text-light">
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading score breakdown...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="bg-danger text-white border-danger">
            <Alert.Heading>Error Loading Score Breakdown</Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}

        {scoreBreakdown && (
          <>
            {/* Header Info */}
            <div className="mb-4 text-center">
              <h5 className="text-primary">
                {scoreBreakdown.competitionTitle}
              </h5>
              <h4 className="text-light">{scoreBreakdown.mixTitle}</h4>
              <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
                <div className="text-center">
                  <div className="h3 text-warning mb-0">
                    {scoreBreakdown.finalScore}
                  </div>
                  <small className="text-muted">Final Score</small>
                </div>
                <div className="text-center">
                  <div className="h3 text-info mb-0">
                    #{scoreBreakdown.ranking}
                  </div>
                  <small className="text-muted">Rank</small>
                </div>
                <div className="text-center">
                  <div className="h5 text-light mb-0 d-flex align-items-center">
                    <FaUsers className="me-1" />
                    {scoreBreakdown.totalJudges}
                  </div>
                  <small className="text-muted">Judges</small>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="criteria-breakdown">
              {scoreBreakdown.criteriaBreakdowns.map((criteria, index) => (
                <Card
                  key={criteria.criteriaId}
                  className="mb-3 bg-secondary border-0"
                >
                  <Card.Header className="bg-dark text-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <h6 className="mb-0 text-primary">
                        {criteria.criteriaName}
                      </h6>
                      {criteria.criteriaDescription && (
                        <FaInfoCircle
                          className="ms-2 text-muted"
                          title={criteria.criteriaDescription}
                        />
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="info" className="fs-6">
                        {criteria.averageScore.toFixed(1)} / {criteria.maxScore}
                      </Badge>
                      <Badge bg="warning" className="fs-6">
                        Weight: {(criteria.weight * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </Card.Header>

                  <Card.Body className="bg-dark text-light">
                    <Row className="align-items-center">
                      <Col xs={12} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small className="text-muted">
                            Average Score: {criteria.averageScore.toFixed(2)} /{" "}
                            {criteria.maxScore}
                          </small>
                          <small className="text-muted">
                            {calculatePercentage(
                              criteria.averageScore,
                              criteria.minScore,
                              criteria.maxScore
                            ).toFixed(1)}%
                          </small>
                        </div>
                        <ProgressBar
                          now={calculatePercentage(
                            criteria.averageScore,
                            criteria.minScore,
                            criteria.maxScore
                          )}
                          variant={getProgressBarVariant(
                            criteria.averageScore,
                            criteria.minScore,
                            criteria.maxScore
                          )}
                          style={{ height: "12px" }}
                        />
                      </Col>
                    </Row>

                    {/* Judges' Comments */}
                    {criteria.judgesComments.length > 0 && (
                      <div className="mt-3">
                        <h6 className="text-light mb-2">
                          <FaUsers className="me-2" />
                          Judges' Comments:
                        </h6>
                        <div className="judges-comments">
                          {criteria.judgesComments.map((comment, commentIndex) => (
                            <div
                              key={commentIndex}
                              className="bg-secondary p-2 rounded mb-2 border-start border-primary border-3"
                            >
                              <small className="text-light fst-italic">
                                "{comment}"
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-primary text-white border-0 mt-4">
              <Card.Body className="text-center">
                <h6>Final Weighted Score</h6>
                <div className="h4 mb-0">
                  {scoreBreakdown.finalScore} / {scoreBreakdown.criteriaBreakdowns.reduce((sum, c) => sum + (c.maxScore * c.weight), 0).toFixed(2)}
                </div>
                <small className="opacity-75">
                  Based on {scoreBreakdown.totalJudges} judge evaluations
                </small>
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-dark border-secondary">
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubmissionScoreBreakdownModal; 