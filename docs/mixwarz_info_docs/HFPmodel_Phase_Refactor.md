# MixWarz Competition Refactor: Epics and Stories

This document outlines the epics and user stories for refactoring the MixWarz competition model to the new **Hybrid Fair-Play Tournament Model**.

---

## 🚀 **Epic 1: Core Domain & Data Layer**

This epic focuses on establishing the foundational data models and database schema required to support the new judging and feedback processes.

### **User Stories**

* **Story 1.1: Create `Judgement` Entity**
    * **As a** System Architect
    * **I want** to define a `Judgement` entity
    * **So that** we can store a record of each judge's assignment to a submission.
    * **Acceptance Criteria:**
        * A `Judgement.cs` file is created in `src/MixWarz.Domain/Entities/`.
        * The entity includes properties for `SubmissionId`, `JudgeId`, `Score`, and `Comments`.
        * The entity is added to the `AppDbContext`.

* **Story 1.2: Create `FeedbackRating` Entity**
    * **As a** System Architect
    * **I want** to define a `FeedbackRating` entity
    * **So that** participants can rate the quality of feedback they receive.
    * **Acceptance Criteria:**
        * A `FeedbackRating.cs` file is created in `src/MixWarz.Domain/Entities/`.
        * The entity includes properties for `JudgementId`, `ParticipantId`, and `Rating`.
        * The entity is added to the `AppDbContext`.

* **Story 1.3: Update Database Schema**
    * **As a** Database Administrator
    * **I want** to update the database to include the new `Judgements` and `FeedbackRatings` tables
    * **So that** the application can store and retrieve judging data.
    * **Acceptance Criteria:**
        * A new Entity Framework migration is created.
        * The `dotnet ef database update` command runs successfully.
        * The new tables are present in the database schema.

---

## ⚙️ **Epic 2: Application Services**

This epic covers the development of the business logic required to manage the tournament lifecycle and judging processes.

### **User Stories**

* **Story 2.1: Implement `SubmissionAssignmentService`**
    * **As a** Backend Developer
    * **I want** a service to automatically assign submissions to judges
    * **So that** the judging phase of a competition can be initiated.
    * **Acceptance Criteria:**
        * A `SubmissionAssignmentService.cs` is created.
        * The service correctly creates `Judgement` entities for each submission in a competition.
        * The logic prevents judges from being assigned their own submissions.
        * The service replaces the functionality of the old `Round1AssignmentService`.

* **Story 2.2: Implement `JudgingService`**
    * **As a** Backend Developer
    * **I want** a service to handle judging actions
    * **So that** judges can view their assigned submissions and submit their feedback.
    * **Acceptance Criteria:**
        * A `JudgingService.cs` is created.
        * The service includes methods to fetch a judge's assigned `Judgements`.
        * The service includes a method to submit a score and comments for a `Judgement`.

* **Story 2.3: Implement `TournamentLifecycleService`**
    * **As a** Backend Developer
    * **I want** a centralized service to manage competition state transitions
    * **So that** the competition can move through its phases in a controlled and predictable manner.
    * **Acceptance Criteria:**
        * A `TournamentLifecycleService.cs` is created.
        * The service includes a `StartJudgingPhase` method that utilizes the `SubmissionAssignmentService`.
        * The service's methods correctly update the competition's status.
        * The large `switch` statement in `UpdateCompetitionStatusCommandHandler` is refactored to use this service.

---

## 🔌 **Epic 3: API & UI Layer**

This epic focuses on exposing the new functionality through a new API and updating the user interface to interact with it.

### **User Stories**

* **Story 3.1: Create V2 Tournament API Controller**
    * **As a** Full-Stack Developer
    * **I want** a new set of API endpoints for managing tournaments
    * **So that** the frontend can interact with the new tournament services.
    * **Acceptance Criteria:**
        * A `TournamentController.cs` is created with the `/api/v2/` prefix.
        * The controller is injected with the new application services.

* **Story 3.2: Implement `Start Judging` Endpoint and UI**
    * **As a** Competition Administrator
    * **I want** to be able to start the judging phase of a competition with a single click
    * **So that** I can move the competition from the submission phase to the judging phase.
    * **Acceptance Criteria:**
        * A `POST` endpoint `api/v2/competitions/{id}/start-judging` is created.
        * This endpoint calls the `TournamentLifecycleService.StartJudgingPhase` method.
        * The "Setup Round 1 Voting" button in the UI is updated to call this new endpoint.
        * The 500 error is resolved, and the competition successfully transitions to the `Round1Judging` phase.

* **Story 3.3: Implement Judge Dashboard UI**
    * **As a** Judge
    * **I want** to see a list of all submissions I have been assigned to judge