# MixWarz Hybrid Fair-Play Tournament: Epics & Stories

## Epic 1: Core Tournament Engine Implementation

**Goal:** To build and deliver the complete, functional backend for the new Hybrid Fair-Play Tournament model, including all necessary database changes, services, and API endpoints. At the end of this epic, the new system will be fully testable via the v2 API.

---

### Story 1.1: Foundational Database and Model Integration

* **Status:** Draft
* **Story:** As a system administrator, I want the database schema updated and new C# models integrated into the application, so that the foundational data structures are in place for the new tournament functionality.
* **Acceptance Criteria:**
    1.  A new Entity Framework Core migration is created and successfully applied.
    2.  The database contains a new `Judgements` table with all specified columns.
    3.  The database contains a new `FeedbackRatings` table with all specified columns.
    4.  The `Submissions` table is altered to include a `Status` column.
    5.  The `Competitors` table is altered to include a nullable `JudgingProwessScore` column.
    6.  The C# models for `Judgement`, `FeedbackRating`, and `SubmissionStatus` are added to the `MixWarz.Domain` project.
    7.  The new models are correctly configured in the `DbContext`.
    8.  The project builds successfully with no errors.
    9.  **Verification:** All existing, unrelated unit and integration tests continue to pass.

### Story 1.2: Implement Submission Assignment Logic

* **Status:** Draft
* **Story:** As a system administrator, I want the system to automatically assign submissions to each competitor for judging, so that Phase 1 of the tournament can begin.
* **Acceptance Criteria:**
    1.  A new `SubmissionAssignmentService` is created.
    2.  The service contains a method `CreateAssignments(competitionId)` that identifies all active submissions.
    3.  A configurable number of random submissions are assigned to each competitor.
    4.  A competitor is never assigned their own submission.
    5.  The assignments are persisted to the database.
    6.  The `Competition`'s status is updated to `Judging`.
    7.  The assignment process is transactional.
    8.  **Verification:** Unit tests are created for the service, including the self-assignment edge case.

### Story 1.3: Implement Core Judging Service

* **Status:** Draft
* **Story:** As a competitor, I want to submit my score and feedback for an assigned submission, so that I can participate in the tournament.
* **Acceptance Criteria:**
    1.  A new `JudgingService` is created.
    2.  The service has a method `SubmitJudgement(judgementDto)` that validates the judge was assigned the submission.
    3.  A new `Judgement` record is created with the correct score, feedback, and timestamps.
    4.  The service includes a method `RateFeedback(ratingDto)` allowing the original submitter to rate a `Judgement` they received.
    5.  A new `FeedbackRating` record is created when feedback is rated.
    6.  **Verification:** New unit tests are created for the `JudgingService` covering all scenarios.

### Story 1.4: Expose Public API for Judging Actions

* **Status:** Draft
* **Story:** As a front-end developer, I want a set of secure, versioned API endpoints for judging actions, so that I can integrate the new functionality into the UI.
* **Acceptance Criteria:**
    1.  A new `HybridTournamentsController` is created at `MixWarz.API/Controllers/v2/`.
    2.  A `POST /api/v2/submissions/{submissionId}/judgements` endpoint is created.
    3.  A `POST /api/v2/judgements/{judgementId}/rate` endpoint is created.
    4.  All endpoints are protected by the existing authentication scheme.
    5.  The controller returns appropriate HTTP status codes.
    6.  **Verification:** New integration tests are created for the controller.

### Story 1.5: Implement Automated Tournament Lifecycle Management

* **Status:** Draft
* **Story:** As a system administrator, I want the tournament to automatically transition between phases based on deadlines, so that it can run without manual intervention.
* **Acceptance Criteria:**
    1.  A new `TournamentLifecycleService` is created.
    2.  The service has a method `StartUniversalJudging(competitionId)` that invokes the assignment service.
    3.  The service has a method `TallyUniversalJudgingResults(competitionId)` that calculates scores and advances the top competitors.
    4.  The `Tally` method updates the `Status` of all `Submissions` correctly.
    5.  These methods are designed to be triggered by a scheduled job runner.
    6.  **Verification:** A secure, admin-only endpoint is created to manually trigger these events for testing.

### Story 1.6: Implement Judging Prowess Calculation

* **Status:** Draft
* **Story:** As a system administrator, I want to calculate and store each competitor's judging skill, so that we can reward high-quality feedback and use the score in the future.
* **Acceptance Criteria:**
    1.  A new `JudgingProwessCalculator` service is created.
    2.  The service implements the logic to calculate a score based on how close a judge's scores are to the final average and how many "Helpful" ratings their feedback received.
    3.  The `TournamentLifecycleService` calls this calculator during the `Tally` phase.
    4.  The calculated score is saved to the `JudgingProwessScore` property on each `Competitor` record.
    5.  **Verification:** Unit tests are created to validate the calculation logic with various data sets.

---

## Epic 2: Deprecation of Old Model & System Transition

**Goal:** To safely remove the old, bracket-based tournament model from the codebase and transition all functionality to the new Hybrid Fair-Play Tournament system, ensuring a clean and final state.

---

### Story 2.1: Frontend Migration to New API

* **Status:** Draft
* **Story:** As a user, I want the website interface to use the new tournament system, so that I can participate in the improved fair-play competitions.
* **Acceptance Criteria:**
    1.  All front-end code making calls to the old tournament API endpoints (e.g., `/api/tournaments/...`) is identified.
    2.  The front-end is refactored to call the new `/api/v2/...` endpoints for all tournament actions.
    3.  The UI is updated to correctly display data from the new API, including submission statuses and feedback ratings.
    4.  The application is fully tested end-to-end to ensure the new front-end/back-end integration works flawlessly.
    5.  **Verification:** All existing end-to-end tests are updated and pass against the new system.

### Story 2.2: Safely Deprecate Old Tournament Code

* **Status:** Draft
* **Story:** As a developer, I want to remove the old tournament codebase after the new system is live and verified, so that we can reduce complexity and prevent future confusion.
* **Acceptance Criteria:**
    1.  A grace period has passed after the front-end migration to ensure the new system is stable.
    2.  The old API controllers (e.g., `TournamentsController`) are deleted.
    3.  The old services (e.g., `TournamentService`) are deleted.
    4.  The old Domain models that are no longer needed (e.g., `Tournament`, `Round`, `Match`) are removed from the `DbContext`.
    5.  A new EF Core migration is created to drop the obsolete tables (`Tournaments`, `Rounds`, `Matches`) from the database.
    6.  The project is fully rebuilt and all remaining tests pass.
    7.  **Verification:** A final code review confirms that no remnants of the old tournament system remain.