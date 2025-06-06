# Epic 2: Competition Module MVP

**Goal:** Implement the essential features for creating, viewing, participating in, and managing basic judging for mix competitions. This includes the core workflows for users to submit their entries and for organizers/admins to manage these competitions and determine results, directly supporting the PRD objective of launching a functional platform for mix competitions.

## Story List

### Story 2.1: Competition & Submission Entities & DB Migrations

-   **User Story / Goal:** As a Backend Developer, I want to define `Competition` and `Submission` entities in the Domain layer and create EF Core migrations, so that competition and submission data can be persistently stored.
-   **Detailed Requirements:**
    -   Define the `Competition` entity:
        -   Attributes: CompetitionID (PK), Title (string, required), Description (text, required), RulesText (text, required), StartDate (DateTime, required), EndDate (DateTime, required), PrizeDetails (text, required), Status (enum: Upcoming, OpenForSubmissions, InJudging, Closed, Cancelled; required, default Upcoming), OrganizerUserID (FK to User, required), CreationDate (DateTime, required, auto-set).
    -   Define the `Submission` entity:
        -   Attributes: SubmissionID (PK), CompetitionID (FK, required), UserID (FK, required), SubmissionDate (DateTime, required, auto-set), AudioFilePath (string, S3 key, required), MixTitle (string, required), MixDescription (text, optional), Score (decimal?, nullable for MVP simple judging), Feedback (text, nullable), Status (enum: Submitted, UnderReview, Judged, Disqualified; required, default Submitted).
    -   Establish relationships:
        -   A `Competition` can have many `Submissions`.
        -   A `User` (as participant) can have many `Submissions`.
        -   A `User` (as Organizer) is linked to a `Competition` via `OrganizerUserID`.
    -   Add unique constraint: (CompetitionID, UserID) on `Submissions` table to prevent multiple submissions by the same user to the same competition for MVP.
    -   Configure `DbContext` for these new entities.
    -   Generate EF Core migrations to create the corresponding tables in the database.
-   **Acceptance Criteria (ACs):**
    -   AC1: `Competition` and `Submission` entities are defined in the .NET Core backend codebase with specified attributes and constraints.
    -   AC2: Relationships between `Competition`, `Submission`, and `User` entities are correctly configured in EF Core.
    -   AC3: EF Core migration is created and successfully applied locally, creating `Competitions` and `Submissions` tables with correct schema, foreign keys, and unique constraints.
    -   AC4: The new tables are created in the staging database after CI/CD deployment or manual migration run.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Define `Competition` POCO entity with enums for Status.
    -   [ ] Define `Submission` POCO entity with enums for Status.
    -   [ ] Update `DbContext` to include `Competition` and `Submission` DbSets.
    -   [ ] Configure entity relationships and unique constraints using Fluent API or Data Annotations.
    -   [ ] Generate EF Core migration for new tables.

---

### Story 2.2: Create Competition API & Basic UI (Admin/Organizer)

-   **User Story / Goal:** As an Admin or Organizer, I want to create a new competition by providing its details (title, description, rules, dates, prizes), so that users can participate in it.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `POST /api/v1/competitions`).
        -   Requires 'Admin' or 'Organizer' role (verified via `[Authorize(Roles = "Admin,Organizer")]`).
        -   Accepts competition details: Title, Description, RulesText, StartDate, EndDate, PrizeDetails.
        -   The OrganizerUserID should be automatically set to the ID of the authenticated user creating the competition.
        -   Validate input: Title not empty, EndDate > StartDate, StartDate not in the past (unless admin override for specific cases - simplify for MVP: StartDate must be now or future).
        -   Store the new competition record in the database. Status is determined based on StartDate (Upcoming if StartDate > Now, OpenForSubmissions if StartDate <= Now < EndDate).
    -   **Frontend (React):**
        -   Create a "Create Competition" form accessible to users with 'Admin' or 'Organizer' roles (link from Admin area or a dedicated Organizer dashboard stub).
        -   Fields for Title, Description, Rules, Start Date, End Date, Prize Details. Use date/time pickers for dates.
        -   Client-side validation for inputs.
        -   On submit, call the create competition API.
        -   Display success/error messages and redirect to the new competition's detail page or a management list.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint successfully creates a new competition in the database when valid data is provided by an authorized user. OrganizerUserID is correctly set.
    -   AC2: API returns 403 Forbidden if a user without 'Admin' or 'Organizer' role attempts access.
    -   AC3: API returns validation errors for invalid input (e.g., EndDate before StartDate).
    -   AC4: Frontend "Create Competition" form captures necessary details and performs client-side validation.
    -   AC5: Frontend successfully calls the API and handles responses, redirecting on success.
    -   AC6: Competition status is correctly determined (Upcoming/OpenForSubmissions) based on StartDate upon creation.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Create Competition DTOs.
    -   [ ] Implement Create Competition controller and application service logic, including status determination.
    -   [ ] Add authorization checks.
    -   [ ] Create React "Create Competition" form component with date pickers.
    -   [ ] Implement API call from frontend.

---

### Story 2.3: View Competitions List API & UI (Public)

-   **User Story / Goal:** As a User, I want to view a list of available (upcoming, open) and past (closed, judged) competitions, so that I can discover opportunities and see past events.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a public RESTful endpoint (e.g., `GET /api/v1/competitions`).
        -   Return a paginated list of competitions (e.g., ID, Title, Status, StartDate, EndDate, OrganizerUsername (if available and public)).
        -   Allow filtering by status (e.g., `?status=OpenForSubmissions`, `?status=Upcoming`, `?status=Closed`).
        -   Default sort order: Upcoming/Open by StartDate ascending, Closed/Judged by EndDate descending.
    -   **Frontend (React):**
        -   Create a "Competitions" page.
        -   Fetch and display a list of competitions from the API, handling pagination.
        -   Display key information for each competition (Title, Status, Dates, Organizer).
        -   Provide links to view details for each competition.
        -   Implement UI for filtering by status (e.g., tabs: "Active", "Upcoming", "Past").
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint returns a paginated list of competitions with key details, respecting status filters and default sort order.
    -   AC2: Frontend "Competitions" page displays a list of competitions fetched from the API and supports pagination.
    -   AC3: Users can click on a competition in the list to navigate to its detail view.
    -   AC4: Filtering by status (Active (OpenForSubmissions/InJudging), Upcoming, Past (Closed)) works on the frontend.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Competition List DTO.
    -   [ ] Implement Get Competitions controller and application service logic with filtering, sorting, pagination.
    -   [ ] Create React "Competition List" page and "Competition Card" component.
    -   [ ] Implement API call and display logic in frontend, including pagination and filter controls.

---

### Story 2.4: View Competition Details API & UI (Public)

-   **User Story / Goal:** As a User, I want to view the detailed information of a specific competition, so that I can understand its rules, timeline, and prizes before deciding to participate.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a public RESTful endpoint (e.g., `GET /api/v1/competitions/{competitionId}`).
        -   Return detailed information for the specified competition (all fields from Competition entity, including Organizer's username).
    -   **Frontend (React):**
        -   Create a "Competition Details" page.
        -   Fetch and display all relevant details of the competition from the API.
        -   If the competition status is 'OpenForSubmissions' and the user is authenticated, display a "Submit Entry" button.
        -   If the competition status is 'Closed' or 'InJudging' and results are available (Story 2.8), display a "View Results" button/section.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint returns detailed information for a valid competition ID.
    -   AC2: API returns 404 Not Found for an invalid competition ID.
    -   AC3: Frontend "Competition Details" page displays all fetched competition information clearly.
    -   AC4: A "Submit Entry" button is visible and enabled for authenticated users if the competition is 'OpenForSubmissions'.
    -   AC5: Link/button to "View Results" is visible if results are published for the competition.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Competition Detail DTO.
    -   [ ] Implement Get Competition Detail controller and application service logic.
    -   [ ] Create React "Competition Detail" page component.
    -   [ ] Implement API call and display logic.
    -   [ ] Add conditional rendering for "Submit Entry" and "View Results" buttons.

---

### Story 2.5: Submit to Competition API & UI (Authenticated User)

-   **User Story / Goal:** As an Authenticated User, I want to submit my mix (audio file and metadata) to an open competition, so that I can participate.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `POST /api/v1/competitions/{competitionId}/submissions`).
        -   Requires 'User' role (via `[Authorize(Roles = "User")]`).
        -   Accepts multipart/form-data including: Audio file (WAV or MP3, max size e.g., 100MB), MixTitle (string), MixDescription (string, optional).
        -   Validate:
            -   Competition exists and its status is 'OpenForSubmissions'.
            -   User has not already submitted to this competition (check unique constraint (CompetitionID, UserID) on `Submissions`).
            -   File type (server-side check on MIME type/extension) and size limits.
        -   Perform virus scan on the uploaded file (can be an async background job; for MVP, log and flag if scan fails, don't block submission but don't make available for judging if infected).
        -   Upload the audio file to AWS S3 (e.g., `mixwarz-submissions/{competitionId}/{userId}/{originalFileName_timestamp}.ext`). Store the S3 key in `AudioFilePath`.
        -   Create a `Submission` record in the database with status 'Submitted'.
    -   **Frontend (React):**
        -   Create a "Submit Entry" form page, accessible from Competition Detail page.
        -   Fields for Mix Title, Mix Description (optional), and a file input for the audio mix.
        -   Client-side validation for file type (accept .wav, .mp3), size, and required fields.
        -   Show upload progress if possible.
        -   On submit, call the submission API.
        -   Display success/error messages. On success, redirect to "My Submissions" or Competition Detail page.
-   **Acceptance Criteria (ACs):**
    -   AC1: API successfully creates a `Submission` record and uploads the audio file to S3 when valid data and file are provided by an authenticated user to an 'OpenForSubmissions' competition.
    -   AC2: API returns 403 Forbidden if the competition is not open or the user has already submitted.
    -   AC3: API performs file validation (type, size) and returns appropriate errors. Virus scan is initiated.
    -   AC4: Frontend submission form captures inputs and file, performing client-side validation.
    -   AC5: Frontend successfully calls the API, handles file upload (with progress indication), and displays responses, redirecting on success.
    -   AC6: Audio file is stored in S3, and the S3 key is saved in the `Submission` record.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Submission DTO.
    -   [ ] Implement S3 upload service for submissions.
    -   [ ] Implement basic virus scanning step (e.g., using a Lambda function triggered by S3 upload, or a library if synchronous).
    -   [ ] Implement Submission controller and application service logic (validation, DB record creation).
    -   [ ] Create React "Submit Entry" form component with file upload handling.
    -   [ ] Implement API call from frontend.

---

### Story 2.6: View Submissions for a Competition API & UI (Organizer/Admin)

-   **User Story / Goal:** As an Organizer or Admin, I want to view a list of all submissions for a competition I manage (or any competition if Admin), so that I can review them for judging.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `GET /api/v1/competitions/{competitionId}/submissions/manage`).
        -   Requires 'Admin' role, OR ('Organizer' role AND the authenticated user is the organizer of the specified `competitionId`).
        -   Return a paginated list of submissions for the competition (SubmissionID, User's username, MixTitle, SubmissionDate, AudioFilePath (for generating pre-signed URL), current Score, current SubmissionStatus).
    -   **Frontend (React):**
        -   A "Manage Submissions" page (part of Admin/Organizer competition management view).
        -   Fetch and display the list of submissions for a selected competition.
        -   Provide a secure way to stream/listen to the submitted audio files (e.g., button that fetches and uses a pre-signed S3 URL).
        -   Link to a judging interface/modal for each submission.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint returns a paginated list of submissions for the specified competition to an authorized Admin or the correct Organizer.
    -   AC2: API returns 403 Forbidden if the user is not authorized to manage submissions for that competition.
    -   AC3: API returns 404 if the competition does not exist.
    -   AC4: Frontend page displays the list of submissions with relevant details and pagination.
    -   AC5: Authorized users can securely stream/listen to the submitted audio files.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Submission List DTO for organizers/admins.
    -   [ ] Implement Get Submissions (manage) controller and application service logic with authorization checks.
    -   [ ] Implement S3 pre-signed URL generation for secure audio file access.
    -   [ ] Create React "Manage Submissions" page/component.
    -   [ ] Implement API call and display logic, including audio playback.

---

### Story 2.7: Basic Judging/Scoring API & UI (Organizer/Admin)

-   **User Story / Goal:** As an Organizer or Admin, I want to assign a score (e.g., 1-100) and optionally provide brief feedback to a submission, so that competition results can be determined.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `PATCH /api/v1/submissions/{submissionId}/judge`).
        -   Requires 'Admin' role, OR ('Organizer' role AND the submission belongs to a competition they manage).
        -   Accepts a Score (integer/decimal) and optional Feedback (text).
        -   Validate score range (e.g., 1-100).
        -   Update the `Submission` record with the Score and Feedback, and change its `Status` to 'Judged'.
    -   **Frontend (React):**
        -   On the "Manage Submissions" page, for each submission, provide input fields (e.g., in a modal or inline edit) for score and feedback.
        -   On submit, call the judging API.
        -   Update the UI to reflect the judged status/score for that submission.
-   **Acceptance Criteria (ACs):**
    -   AC1: API successfully updates the specified `Submission` with the score and feedback, and sets status to 'Judged' by an authorized user. Score validation is performed.
    -   AC2: API returns 403 Forbidden if the user is not authorized to judge the submission.
    -   AC3: API returns 404 if the submission does not exist.
    -   AC4: Frontend interface allows input of score (within defined range) and feedback.
    -   AC5: Frontend successfully calls the API and updates the submission's display (score, status).
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Judge Submission DTO.
    -   [ ] Implement Judge Submission controller and application service logic with authorization.
    -   [ ] Add score/feedback input fields and submit action to the submission viewing UI.
    -   [ ] Implement API call from frontend.

---

### Story 2.8: Display Competition Results/Leaderboard API & UI (Public)

-   **User Story / Goal:** As a User, I want to view the results (ranked list of participants) for a completed competition, so that I can see who won and how entries were ranked.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a public RESTful endpoint (e.g., `GET /api/v1/competitions/{competitionId}/results`).
        -   Only return results if the competition `Status` is 'Closed' (or perhaps 'InJudging' if partial results display is desired later - for MVP, only 'Closed').
        -   Return a list of 'Judged' submissions for the specified competition, ordered by `Score` (descending). Include User's username, MixTitle, Score. Limit to top N (e.g., Top 20) or paginate.
    -   **Frontend (React):**
        -   On the "Competition Details" page (or a dedicated "Results" tab/section), display the ranked list of submissions with scores.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint returns a list of judged submissions ranked by score for a 'Closed' competition.
    -   AC2: API returns an appropriate response (e.g., empty list or message like "Results not yet published") if results are not available or competition not in 'Closed' status.
    -   AC3: Frontend displays the competition results clearly, showing rank (derived from order), user, mix title, and score.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Results DTO.
    -   [ ] Implement Get Results controller and application service logic (fetch judged submissions, sort, paginate).
    -   [ ] Create React component to display results/leaderboard.
    -   [ ] Implement API call and display logic in frontend, conditional on competition status.

## Change Log

| Change        | Date       | Version | Description                       | Author         |
| ------------- | ---------- | ------- | --------------------------------- | -------------- |
| Initial Draft | 2025-05-07 | 0.1     | First draft of Epic 2 stories.    | Product Manager AI |
| Revision 1    | 2025-05-07 | 0.2     | Added entity details, constraints, status handling | Product Manager AI |