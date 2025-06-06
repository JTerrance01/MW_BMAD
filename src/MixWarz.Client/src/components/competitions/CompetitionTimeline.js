import React from "react";
import "./CompetitionTimeline.css";

// Define the ordered phases for the timeline.
// The 'key' should match the status/phase values from your backend competition data.
// The 'name' is for display purposes.
export const TIMELINE_PHASES = [
  { key: "Upcoming", name: "Upcoming / Registration" },
  { key: "OpenForSubmissions", name: "Submission Phase" },
  { key: "Round1Voting", name: "Round 1 Voting" },
  { key: "Round2Voting", name: "Round 2 Voting" },
  { key: "ResultsAnnounced", name: "Winner Announced" },
  { key: "Completed", name: "Competition Ended" },
];

const CompetitionTimeline = ({ currentPhaseKey }) => {
  console.log("Current phase key:", currentPhaseKey); // Add logging to help debug

  const currentPhaseIndex = TIMELINE_PHASES.findIndex(
    (p) => p.key === currentPhaseKey
  );

  console.log("Current phase index:", currentPhaseIndex);

  // Handle cases where the currentPhaseKey might not be in TIMELINE_PHASES
  // or if you want to show all as future/past if it's an unexpected phase.
  // For simplicity, if not found, currentPhaseIndex will be -1.

  return (
    <div className="competition-timeline">
      <h3>Competition Timeline</h3>
      <div className="timeline-steps">
        {TIMELINE_PHASES.map((phase, index) => {
          let phaseStatus = "future"; // Default to future

          if (currentPhaseIndex === -1) {
            // If current phase is unknown or not in the timeline definition,
            // default behavior: all are 'future'
            console.log("Unknown phase key:", currentPhaseKey);
          } else if (index < currentPhaseIndex) {
            phaseStatus = "completed";
          } else if (index === currentPhaseIndex) {
            phaseStatus = "current"; // This will be green
          }

          return (
            <div key={phase.key} className={`timeline-step ${phaseStatus}`}>
              <div className={`timeline-circle ${phaseStatus}`}></div>
              <div className="timeline-step-name">{phase.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionTimeline;
