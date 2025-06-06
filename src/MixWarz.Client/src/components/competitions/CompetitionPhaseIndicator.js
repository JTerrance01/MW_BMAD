import React from "react";
import { ProgressBar } from "react-bootstrap";
import { FaClipboardList, FaUsers, FaVoteYea, FaTrophy } from "react-icons/fa";

// Define competition statuses for reference
const COMPETITION_STATUSES = {
  OPEN_FOR_SUBMISSIONS: "OpenForSubmissions",
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

// Calculate progress percentage based on competition status
const getProgressPercentage = (status) => {
  const progressMap = {
    [COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS]: 10,
    [COMPETITION_STATUSES.VOTING_ROUND1_SETUP]: 25,
    [COMPETITION_STATUSES.VOTING_ROUND1_OPEN]: 40,
    [COMPETITION_STATUSES.VOTING_ROUND1_TALLYING]: 50,
    [COMPETITION_STATUSES.VOTING_ROUND2_SETUP]: 60,
    [COMPETITION_STATUSES.VOTING_ROUND2_OPEN]: 75,
    [COMPETITION_STATUSES.VOTING_ROUND2_TALLYING]: 90,
    [COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER]: 95,
    [COMPETITION_STATUSES.COMPLETED]: 100,
    [COMPETITION_STATUSES.ARCHIVED]: 100,
  };

  return progressMap[status] || 0;
};

// Get user-friendly status name
const getStatusDisplayName = (status) => {
  const displayMap = {
    [COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS]: "Open for Submissions",
    [COMPETITION_STATUSES.VOTING_ROUND1_SETUP]: "Preparing Round 1 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND1_OPEN]: "Round 1 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND1_TALLYING]:
      "Calculating Round 1 Results",
    [COMPETITION_STATUSES.VOTING_ROUND2_SETUP]: "Preparing Round 2 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND2_OPEN]: "Round 2 Voting",
    [COMPETITION_STATUSES.VOTING_ROUND2_TALLYING]: "Calculating Final Results",
    [COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER]: "Resolving Ties",
    [COMPETITION_STATUSES.COMPLETED]: "Competition Completed",
    [COMPETITION_STATUSES.ARCHIVED]: "Competition Archived",
  };

  return displayMap[status] || "Unknown Status";
};

// Get appropriate variant for progress bar
const getVariant = (status) => {
  if (
    status === COMPETITION_STATUSES.COMPLETED ||
    status === COMPETITION_STATUSES.ARCHIVED
  ) {
    return "success";
  }

  if (status === COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER) {
    return "warning";
  }

  return "primary";
};

// Determine if a phase is active, completed, or upcoming
const getPhaseStatus = (currentStatus, phaseStatus) => {
  const statusOrder = [
    COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS,
    COMPETITION_STATUSES.VOTING_ROUND1_SETUP,
    COMPETITION_STATUSES.VOTING_ROUND1_OPEN,
    COMPETITION_STATUSES.VOTING_ROUND1_TALLYING,
    COMPETITION_STATUSES.VOTING_ROUND2_SETUP,
    COMPETITION_STATUSES.VOTING_ROUND2_OPEN,
    COMPETITION_STATUSES.VOTING_ROUND2_TALLYING,
    COMPETITION_STATUSES.REQUIRES_MANUAL_WINNER,
    COMPETITION_STATUSES.COMPLETED,
    COMPETITION_STATUSES.ARCHIVED,
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  const phaseIndex = statusOrder.indexOf(phaseStatus);

  if (currentIndex < 0 || phaseIndex < 0) return "upcoming";

  if (currentStatus === phaseStatus) return "active";
  if (currentIndex > phaseIndex) return "completed";
  return "upcoming";
};

const CompetitionPhaseIndicator = ({ status }) => {
  // Get progress information
  const progress = getProgressPercentage(status);
  const statusName = getStatusDisplayName(status);
  const variant = getVariant(status);

  // Define phase information
  const phases = [
    {
      status: COMPETITION_STATUSES.OPEN_FOR_SUBMISSIONS,
      icon: <FaClipboardList />,
      title: "Submission Phase",
      description: "Users submit their mixes",
    },
    {
      status: COMPETITION_STATUSES.VOTING_ROUND1_OPEN,
      icon: <FaVoteYea />,
      title: "Round 1 Voting",
      description: "Group voting & selection",
    },
    {
      status: COMPETITION_STATUSES.VOTING_ROUND2_OPEN,
      icon: <FaUsers />,
      title: "Round 2 Voting",
      description: "Final voting by participants",
    },
    {
      status: COMPETITION_STATUSES.COMPLETED,
      icon: <FaTrophy />,
      title: "Competition Complete",
      description: "Winner announced",
    },
  ];

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        {" "}
        <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
          Competition Status
        </h5>{" "}
        <span style={{ color: "var(--accent-primary)" }}>{statusName}</span>{" "}
      </div>{" "}
      <ProgressBar
        variant={variant}
        now={progress}
        className="mb-3"
        style={{ height: "10px" }}
      />
      <div className="d-flex justify-content-between">
        {phases.map((phase, index) => {
          const phaseStatus = getPhaseStatus(status, phase.status);

          // Set color based on phase status
          let iconClass = "";
          let iconColor = "var(--text-muted)";
          let titleColor = "var(--text-muted)";

          if (phaseStatus === "active") {
            iconColor = "var(--accent-primary)";
            titleColor = "var(--accent-primary)";
          } else if (phaseStatus === "completed") {
            iconColor = "var(--success)";
            titleColor = "var(--success)";
          }

          return (
            <div
              key={index}
              className="text-center position-relative"
              style={{
                width:
                  index === 0 || index === phases.length - 1 ? "auto" : "25%",
              }}
            >
              <div
                className="mb-2"
                style={{ fontSize: "1.5rem", color: iconColor }}
              >
                {phase.icon}
              </div>
              <div
                className="small mb-1"
                style={{
                  color: titleColor,
                  fontWeight: phaseStatus === "active" ? "600" : "normal",
                }}
              >
                {phase.title}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                }}
              >
                {phase.description}
              </div>
              {/* Display connector lines between phases except for the last one */}{" "}
              {index < phases.length - 1 && (
                <div
                  className="position-absolute"
                  style={{
                    height: "2px",
                    width: "100%",
                    top: "24px",
                    left: "50%",
                    zIndex: -1,
                    backgroundColor: "var(--border-color)",
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionPhaseIndicator;
