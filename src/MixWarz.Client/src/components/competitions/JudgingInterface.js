import React, { useState, useEffect } from "react";
import { Row, Col, Alert, Button, Card } from "react-bootstrap";
import { FaArrowLeft, FaArrowRight, FaClock } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { updateScorecardScore } from "../../store/votingSlice";
import AudioPlayer from "./AudioPlayer";
import JudgingScorecard from "./JudgingScorecard";

const JudgingInterface = ({ 
  competitionId, 
  submissions = [], 
  onJudgmentSubmit,
  votingDeadline = null,
  hasVoted = false,
  initialSubmissionId = null
}) => {
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [judgments, setJudgments] = useState({});
  const [existingJudgments, setExistingJudgments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const dispatch = useDispatch();

  // Set initial submission index based on initialSubmissionId
  useEffect(() => {
    if (initialSubmissionId && submissions.length > 0) {
      const targetIndex = submissions.findIndex(sub => sub.id === initialSubmissionId);
      if (targetIndex !== -1) {
        setCurrentSubmissionIndex(targetIndex);
      }
    }
  }, [initialSubmissionId, submissions]);

  // Load existing judgments for all submissions
  useEffect(() => {
    const loadExistingJudgments = async () => {
      if (!submissions.length || !competitionId) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const judgmentPromises = submissions.map(async (submission) => {
        try {
          const response = await fetch(
            `/api/competitions/${competitionId}/voting/judgments/${submission.id}?votingRound=1`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.ok) {
            const result = await response.json();
            // Check if the request was successful and judgment exists
            if (result.success && result.judgment) {
              return { submissionId: submission.id, judgment: result.judgment };
            } else {
              // No judgment found - this is normal for new submissions
              console.log(`No existing judgment for submission ${submission.id}: ${result.message || 'Not found'}`);
              return { submissionId: submission.id, judgment: null };
            }
          } else {
            console.warn(`Failed to load judgment for submission ${submission.id}: ${response.status}`);
            return { submissionId: submission.id, judgment: null };
          }
        } catch (error) {
          console.log(`Error loading judgment for submission ${submission.id}:`, error.message);
          return { submissionId: submission.id, judgment: null };
        }
      });

      try {
        const results = await Promise.all(judgmentPromises);
        const judgmentsMap = {};
        results.forEach(({ submissionId, judgment }) => {
          if (judgment) {
            judgmentsMap[submissionId] = judgment;
            
            // Dispatch existing judgment to Redux state for voting rankings
            dispatch(updateScorecardScore({
              submissionId: submissionId,
              overallScore: judgment.overallScore,
              criteriaScores: judgment.criteriaScores || {}
            }));
          }
        });
        setExistingJudgments(judgmentsMap);
        console.log('📋 Loaded existing judgments and updated Redux state for', Object.keys(judgmentsMap).length, 'submissions');
      } catch (error) {
        console.error('Error loading existing judgments:', error);
      }
    };

    loadExistingJudgments();
  }, [submissions, competitionId, dispatch]);

  const currentSubmission = submissions[currentSubmissionIndex];

  // Process audio URL to handle relative paths
  const getAudioUrl = (submission) => {
    if (!submission?.audioUrl) {
      console.warn('📀 No audioUrl for submission:', submission?.id);
      return null;
    }

    // If it's a relative path, use it directly - the React proxy will handle it
    if (submission.audioUrl.startsWith('/')) {
      console.log('📀 Judging - Using relative URL via proxy:', submission.audioUrl);
      return submission.audioUrl;
    }

    // If it's already a full URL, use it as-is
    if (submission.audioUrl.startsWith('http://') || submission.audioUrl.startsWith('https://')) {
      console.log('📀 Judging - Using absolute URL:', submission.audioUrl);
      return submission.audioUrl;
    }

    // If it's a relative path without leading slash, add it and let proxy handle it
    const relativeUrl = `/${submission.audioUrl}`;
    console.log('📀 Judging - Using relative URL via proxy:', relativeUrl);
    return relativeUrl;
  };

  // Generate anonymous entry ID (simple number format)
  const generateEntryId = (index) => {
    return index + 1; // Return simple number: 1, 2, 3, etc.
  };

  // Calculate time remaining until voting deadline
  const getTimeRemaining = () => {
    if (!votingDeadline) return null;
    
    const now = new Date();
    const deadline = new Date(votingDeadline);
    const timeDiff = deadline - now;
    
    if (timeDiff <= 0) return "Voting has ended";
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const handleJudgmentSubmit = async (judgmentData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Add current submission info to judgment data
      const completeJudgmentData = {
        ...judgmentData,
        competitionId,
        submissionId: currentSubmission.id
      };

      await onJudgmentSubmit(completeJudgmentData);
      
      // Store judgment locally
      setJudgments(prev => ({
        ...prev,
        [currentSubmission.id]: judgmentData
      }));

      setSuccess("Judgment submitted successfully!");
      
      // Auto-advance to next submission after a brief delay
      setTimeout(() => {
        if (currentSubmissionIndex < submissions.length - 1) {
          setCurrentSubmissionIndex(prev => prev + 1);
          setSuccess(null);
        }
      }, 2000);

      // Update existing judgments state if this was an update
      if (completeJudgmentData.submissionId) {
        setExistingJudgments(prev => ({
          ...prev,
          [completeJudgmentData.submissionId]: {
            ...judgmentData,
            submissionId: completeJudgmentData.submissionId,
            isCompleted: true
          }
        }));
      }

      // Dispatch scorecard score update
      dispatch(updateScorecardScore({
        submissionId: completeJudgmentData.submissionId,
        overallScore: judgmentData.overallScore,
        criteriaScores: judgmentData.criteriaScores
      }));

    } catch (err) {
      setError(err.message || "Failed to submit judgment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(prev => prev - 1);
      setError(null);
      setSuccess(null);
    }
  };

  const handleNextSubmission = () => {
    if (currentSubmissionIndex < submissions.length - 1) {
      setCurrentSubmissionIndex(prev => prev + 1);
      setError(null);
      setSuccess(null);
    }
  };

  // Show message if no submissions available
  if (!submissions || submissions.length === 0) {
    return (
      <div className="mt-4">
        <Alert variant="info">
          <h5>No Submissions Available</h5>
          <p>There are currently no submissions assigned for judging in this competition.</p>
        </Alert>
      </div>
    );
  }

  // Show message if user has already voted
  if (hasVoted) {
    return (
      <div className="mt-4">
        <Alert variant="success">
          <h5>Judging Complete</h5>
          <p>You have already completed your judging for this competition. Thank you for your participation!</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-4 judging-interface-container">
      {/* Header with progress and time remaining - Full Width */}
      <Row className="mb-4">
        <Col>
          <Card 
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)"
            }}
          >
            <Card.Body className="py-3">
              <Row className="align-items-start">
                <Col md={10}>
                  <h4 style={{ color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
                    Judging Interface
                  </h4>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    Submission {currentSubmissionIndex + 1} of {submissions.length}
                  </p>
                  
                  {/* How Judging Works */}
                  <div style={{ color: "var(--text-primary)", fontSize: "0.95em" }}>
                    <div className="mb-2">
                      <h6 style={{ color: "var(--accent-primary)", fontSize: "1em", marginBottom: "0.4rem" }}>📋 How Judging Works:</h6>
                      <ul style={{ paddingLeft: "1rem", marginBottom: "0.8rem", fontSize: "0.9em" }}>
                        <li style={{ marginBottom: "0.3rem" }}>Rate each submission on 4 criteria using the scorecard</li>
                        <li style={{ marginBottom: "0.3rem" }}>Your overall score automatically updates based on criteria ratings</li>
                        <li style={{ marginBottom: "0.3rem" }}>Add comments to provide helpful feedback to participants</li>
                        <li style={{ marginBottom: "0.3rem" }}>Submit your judgment to save scores and advance to the next submission</li>
                      </ul>
                    </div>
                    
                    <div style={{ fontSize: "0.9em" }}>
                      <strong style={{ color: "var(--accent-primary)" }}>🏆 Rankings:</strong>
                      <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
                        Switch to <strong>"Voting"</strong> interface to view your current 1st, 2nd, 3rd place picks.
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={2} className="text-md-end">
                  {votingDeadline && (
                    <div className="d-flex align-items-center justify-content-md-center">
                      <FaClock className="me-2" style={{ color: "var(--accent-secondary)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {getTimeRemaining()}
                      </span>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error/Success Messages */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-3">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Main judging interface */}
      <Row className="g-4">
        {/* Left Column - Audio Player */}
        <Col md={6}>
          <div style={{ position: "sticky", top: "20px" }}>
            <AudioPlayer
              audioUrl={getAudioUrl(currentSubmission)}
              entryId={generateEntryId(currentSubmissionIndex)}
              title="Anonymous Entry"
            />
            
            {/* Navigation Controls */}
            <Card 
              className="mt-3"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)"
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handlePreviousSubmission}
                    disabled={currentSubmissionIndex === 0}
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                  >
                    <FaArrowLeft className="me-2" />
                    Previous
                  </Button>

                  <span style={{ color: "var(--text-secondary)" }}>
                    {currentSubmissionIndex + 1} / {submissions.length}
                  </span>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleNextSubmission}
                    disabled={currentSubmissionIndex === submissions.length - 1}
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                  >
                    Next
                    <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Right Column - Judging Scorecard */}
        <Col md={6}>
          <JudgingScorecard
            submissionId={currentSubmission?.id}
            onSubmitJudgment={handleJudgmentSubmit}
            isSubmitting={isSubmitting}
            existingJudgment={existingJudgments[currentSubmission?.id] || judgments[currentSubmission?.id]}
          />
        </Col>
      </Row>

      {/* Progress indicator */}
      <Row className="mt-4">
        <Col>
          <div className="d-flex justify-content-center">
            <div className="d-flex align-items-center">
              {submissions.map((_, index) => (
                <div
                  key={index}
                  className="me-2"
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: index === currentSubmissionIndex 
                      ? "var(--accent-primary)" 
                      : index < currentSubmissionIndex 
                        ? "var(--accent-secondary)" 
                        : "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => {
                    setCurrentSubmissionIndex(index);
                    setError(null);
                    setSuccess(null);
                  }}
                />
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default JudgingInterface; 