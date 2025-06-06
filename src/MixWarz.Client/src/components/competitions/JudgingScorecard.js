import React, { useState, useEffect } from "react";
import { Card, Button, Form, Alert } from "react-bootstrap";
import { FaStar, FaRegStar } from "react-icons/fa";

// Predefined criteria for judging (moved outside component to avoid dependency issues)
const DEFAULT_CRITERIA = [
  {
    id: 1,
    name: "Technical Clarity",
    description: "Overall mix clarity, frequency balance, technical execution",
    scoringType: "Slider",
    minScore: 1,
    maxScore: 10,
    weight: 0.3,
    displayOrder: 1,
    isCommentRequired: false
  },
  {
    id: 2,
    name: "Creative Balance",
    description: "Creative use of effects, spatial placement, artistic vision",
    scoringType: "Slider",
    minScore: 1,
    maxScore: 10,
    weight: 0.25,
    displayOrder: 2,
    isCommentRequired: false
  },
  {
    id: 3,
    name: "Dynamic Range",
    description: "Use of dynamics, compression, overall punch",
    scoringType: "Stars",
    minScore: 1,
    maxScore: 5,
    weight: 0.2,
    displayOrder: 3,
    isCommentRequired: false
  },
  {
    id: 4,
    name: "Stereo Imaging",
    description: "Width, depth, stereo field utilization",
    scoringType: "RadioButtons",
    minScore: 1,
    maxScore: 4,
    weight: 0.25,
    displayOrder: 4,
    isCommentRequired: false,
    scoringOptions: ["Poor", "Fair", "Good", "Excellent"]
  }
];

const JudgingScorecard = ({ 
  submissionId, 
  onSubmitJudgment, 
  isSubmitting = false,
  existingJudgment = null 
}) => {
  // Predefined criteria for judging
  const defaultCriteria = DEFAULT_CRITERIA;

  const [criteriaScores, setCriteriaScores] = useState({});
  const [overallComments, setOverallComments] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize scores from existing judgment or defaults
  useEffect(() => {
    if (existingJudgment) {
      const scores = {};
      existingJudgment.criteriaScores?.forEach(score => {
        scores[score.judgingCriteriaId] = {
          score: score.score,
          comments: score.comments || ""
        };
      });
      setCriteriaScores(scores);
      setOverallComments(existingJudgment.overallComments || "");
    } else {
      // Initialize with default values - this ensures ALL fields reset when changing submissions
      const initialScores = {};
      defaultCriteria.forEach(criteria => {
        initialScores[criteria.id] = {
          score: criteria.minScore,
          comments: ""
        };
      });
      setCriteriaScores(initialScores);
      setOverallComments(""); // Explicitly reset overall comments
    }
    
    // Clear any validation errors when switching submissions
    setValidationErrors({});
  }, [existingJudgment, submissionId]); // Added submissionId as dependency

  const handleScoreChange = (criteriaId, score) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        score: score
      }
    }));
    
    // Clear validation error for this criteria
    if (validationErrors[criteriaId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[criteriaId];
        return newErrors;
      });
    }
  };

  const handleCommentsChange = (criteriaId, comments) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        comments: comments
      }
    }));
  };

  const calculateOverallScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    defaultCriteria.forEach(criteria => {
      const score = criteriaScores[criteria.id]?.score || criteria.minScore;
      // Normalize score to 0-10 scale
      const normalizedScore = ((score - criteria.minScore) / (criteria.maxScore - criteria.minScore)) * 10;
      totalWeightedScore += normalizedScore * criteria.weight;
      totalWeight += criteria.weight;
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;
  };

  const validateForm = () => {
    const errors = {};

    defaultCriteria.forEach(criteria => {
      const score = criteriaScores[criteria.id];
      if (!score || score.score < criteria.minScore || score.score > criteria.maxScore) {
        errors[criteria.id] = `Please provide a valid score for ${criteria.name}`;
      }
      if (criteria.isCommentRequired && (!score?.comments || score.comments.trim() === "")) {
        errors[criteria.id] = `Comments are required for ${criteria.name}`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const judgmentData = {
      submissionId,
      overallScore: parseFloat(calculateOverallScore()),
      overallComments: overallComments.trim(),
      criteriaScores: defaultCriteria.map(criteria => ({
        judgingCriteriaId: criteria.id,
        score: criteriaScores[criteria.id]?.score || criteria.minScore,
        comments: criteriaScores[criteria.id]?.comments?.trim() || ""
      }))
    };

    onSubmitJudgment(judgmentData);
  };

  const renderSliderInput = (criteria) => {
    const score = criteriaScores[criteria.id]?.score || criteria.minScore;
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            {criteria.minScore}
          </span>
          <span 
            className="badge"
            style={{
              backgroundColor: score >= 8 ? "#28a745" : score >= 6 ? "#ffc107" : score >= 4 ? "#fd7e14" : "#dc3545",
              color: "white",
              fontSize: "1em"
            }}
          >
            {score}
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            {criteria.maxScore}
          </span>
        </div>
        <input
          type="range"
          min={criteria.minScore}
          max={criteria.maxScore}
          step="1"
          value={score}
          onChange={(e) => handleScoreChange(criteria.id, parseInt(e.target.value))}
          className="form-range"
          style={{
            background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((score - criteria.minScore) / (criteria.maxScore - criteria.minScore)) * 100}%, rgba(255,255,255,0.3) ${((score - criteria.minScore) / (criteria.maxScore - criteria.minScore)) * 100}%, rgba(255,255,255,0.3) 100%)`
          }}
        />
      </div>
    );
  };

  const renderStarInput = (criteria) => {
    const score = criteriaScores[criteria.id]?.score || criteria.minScore;
    return (
      <div className="mb-3">
        <div className="d-flex align-items-center">
          {[...Array(criteria.maxScore)].map((_, index) => {
            const starValue = index + 1;
            return (
              <button
                key={starValue}
                type="button"
                className="btn p-1"
                onClick={() => handleScoreChange(criteria.id, starValue)}
                style={{
                  background: "none",
                  border: "none",
                  color: starValue <= score ? "#ffc107" : "rgba(255,255,255,0.3)",
                  fontSize: "1.5em"
                }}
              >
                {starValue <= score ? <FaStar /> : <FaRegStar />}
              </button>
            );
          })}
          <span className="ms-2" style={{ color: "var(--text-secondary)" }}>
            ({score}/{criteria.maxScore})
          </span>
        </div>
      </div>
    );
  };

  const renderRadioInput = (criteria) => {
    const score = criteriaScores[criteria.id]?.score || criteria.minScore;
    const options = criteria.scoringOptions || ["Poor", "Fair", "Good", "Excellent"];
    
    return (
      <div className="mb-3">
        {options.map((option, index) => {
          const optionValue = index + 1;
          return (
            <Form.Check
              key={optionValue}
              type="radio"
              id={`${criteria.id}-${optionValue}`}
              name={`criteria-${criteria.id}`}
              label={option}
              checked={score === optionValue}
              onChange={() => handleScoreChange(criteria.id, optionValue)}
              className="mb-2"
              style={{
                color: "var(--text-primary)"
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderScoringInput = (criteria) => {
    switch (criteria.scoringType) {
      case "Slider":
        return renderSliderInput(criteria);
      case "Stars":
        return renderStarInput(criteria);
      case "RadioButtons":
        return renderRadioInput(criteria);
      default:
        return renderSliderInput(criteria);
    }
  };

  return (
    <Card 
      className="h-100"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        border: "1px solid var(--border-color)"
      }}
    >
      <Card.Header 
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
            Judging Scorecard
          </h5>
          <span 
            className="badge"
            style={{
              backgroundColor: "var(--accent-secondary)",
              color: "white"
            }}
          >
            Overall: {calculateOverallScore()}/10
          </span>
        </div>
      </Card.Header>

      <Card.Body className="p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {/* Criteria Scoring */}
        {defaultCriteria.map((criteria) => (
          <div key={criteria.id} className="mb-4">
            <div className="mb-3">
              <h6 style={{ color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
                {criteria.name}
                <span 
                  className="badge ms-2"
                  style={{
                    backgroundColor: "rgba(0, 200, 255, 0.2)",
                    color: "var(--accent-primary)",
                    fontSize: "0.7em"
                  }}
                >
                  Weight: {(criteria.weight * 100).toFixed(0)}%
                </span>
              </h6>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9em", marginBottom: "1rem" }}>
                {criteria.description}
              </p>
            </div>

            {renderScoringInput(criteria)}

            {/* Comments for this criteria */}
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "var(--text-primary)", fontSize: "0.9em" }}>
                Comments {criteria.isCommentRequired && <span style={{ color: "#dc3545" }}>*</span>}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={criteriaScores[criteria.id]?.comments || ""}
                onChange={(e) => handleCommentsChange(criteria.id, e.target.value)}
                placeholder={`Specific feedback for ${criteria.name.toLowerCase()}...`}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)"
                }}
              />
            </Form.Group>

            {validationErrors[criteria.id] && (
              <Alert variant="danger" className="py-2">
                {validationErrors[criteria.id]}
              </Alert>
            )}

            <hr style={{ borderColor: "var(--border-color)", margin: "1.5rem 0" }} />
          </div>
        ))}

        {/* Overall Comments */}
        <div className="mb-4">
          <Form.Group>
            <Form.Label style={{ color: "var(--accent-primary)", fontSize: "1.1em", fontWeight: "600" }}>
              Overall Comments
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              placeholder="Provide overall feedback about the submission, highlighting strengths and areas for improvement..."
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)"
              }}
            />
          </Form.Group>
        </div>

        {/* Submit Button */}
        <div className="d-grid">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: "var(--accent-primary)",
              borderColor: "var(--accent-primary)",
              color: "white",
              fontWeight: "600"
            }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                {existingJudgment ? "Updating Score..." : "Submitting Judgment..."}
              </>
            ) : (
              existingJudgment ? "Update Score" : "Submit Score"
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default JudgingScorecard; 