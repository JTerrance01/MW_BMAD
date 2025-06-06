# Epic 9: Competition Voting System - Foundation & Data Model

## Description

This epic lays the groundwork for implementing the multi-round, peer-based competition voting system required to align the MixWarz application with the Tourna-Mix rules. It focuses on updating the core data model to support storing individual votes/scorecards and enhancing the competition lifecycle states to reflect the different phases of the competition, from submission to judging rounds.

## Functional Requirements Addressed

* Support for distinct voting rounds (Round 1 and Round 2).
* Ability to record individual votes for submissions.
* Storage of multi-point scoring (1st, 2nd, 3rd place points).
* Foundation for managing competition state transitions through submission and voting phases.

## Technical Approach

The current `Submission` entity only has a single `Score` field, which is insufficient for the required multi-point, peer-based voting system. The `CompetitionStatus` enum needs to be more granular.

This epic will introduce new database entities and update existing ones to capture the detailed voting information. We will create a clear relationship between users (voters), submissions, and their individual votes/rankings. The `Competition` entity's status will be expanded to explicitly track the progress through the new voting phases.

### Data Model Changes

1.  **`Competition` Entity (`MixWarz.Domain/Entities/Competition.cs`):**
    * Modify `CompetitionStatus` enum to include states for Round 1 Setup, Round 1 Voting, Round 1 Tallying, Round 2 Setup, Round 2 Voting, Round 2 Tallying, and potentially states for disqualification review.
    * Add optional fields if needed for voting configuration (e.g., group size, scoring weights - although these are fixed by the rules, explicit fields might be helpful for clarity or future flexibility).
    * Consider adding fields to store the number of participants and submissions after the deadline, which is needed for group calculations.
2.  **New Entity: `SubmissionVote` (`MixWarz.Domain/Entities/SubmissionVote.cs`):**
    * Represents a single vote cast by a user for a specific submission within a competition.
    * Properties:
        * `Id` (Guid)
        * `SubmissionId` (Guid, Foreign Key to `Submission`)
        * `VoterId` (Guid, Foreign Key to `User`) - The user casting the vote.
        * `CompetitionId` (Guid, Foreign Key to `Competition`) - Redundant but useful for querying.
        * `Rank` (int) - The rank assigned by the voter (1, 2, or 3). Nullable if a voter doesn't rank all 3.
        * `Points` (int) - Calculated points based on rank (3 for 1st, 2 for 2nd, 1 for 3rd).
        * `VoteTime` (DateTimeOffset) - Timestamp of when the vote was cast.
3.  **Update `Submission` Entity (`MixWarz.Domain/Entities/Submission.cs`):**
    * Remove the single `Score` field, as scores will be aggregated from `SubmissionVote` entities.
    * Add a navigation property: `public ICollection<SubmissionVote> Votes { get; set; }`.
    * Consider adding calculated properties or separate view models to display aggregate scores for different rounds.
    * Add fields to track the submission's status within the voting rounds (e.g., `IsEligibleForRound1Voting`, `IsEligibleForRound2Voting`, `AdvancedToRound2`, `IsDisqualified`, `FinalRank`, `FinalScore`).
4.  **Database Context (`MixWarz.Infrastructure/Persistence/AppDbContext.cs`):**
    * Add `DbSet<SubmissionVote>`.
    * Configure relationships (one `Submission` to many `SubmissionVote`, one `User` to many `SubmissionVote`).

### Competition State Transitions (via Commands/Handlers)

This epic will focus on the initial commands to move the competition into and out of the submission phase and into the first voting phase setup.

* **From `OpenForSubmission` to `VotingRound1Setup`:** This transition happens automatically after the submission deadline. A scheduled task (to be implemented in a later epic) or an admin action will trigger a command.
* **From `VotingRound1Setup` to `VotingRound1Open`:** Triggered after Round 1 groups are generated and assignments are made (logic for this in a later epic).
* Further state transitions (tallying, Round 2) will be handled in subsequent epics.

## User Stories

* **Story 9.1: As a system architect, I want to update the `CompetitionStatus` enum and `Competition` entity so that the system can track the detailed phases of the competition voting process.**
    * _Description:_ Modify the `CompetitionStatus` enum to include states for Round 1 and Round 2 voting setup, open, and tallying phases. Add these new statuses to the `Competition` entity.
    * _Acceptance Criteria:_
        * The `CompetitionStatus` enum in `MixWarz.Domain` is updated with new values (e.g., `VotingRound1Setup`, `VotingRound1Open`, `VotingRound1Tallying`, `VotingRound2Setup`, `VotingRound2Open`, `VotingRound2Tallying`, `Completed`, `Archived`, `Disqualified`).
        * The `Competition` entity includes the updated `CompetitionStatus` enum.
        * Database migrations are created to reflect the changes to the `Competition` table.
* **Story 9.2: As a system architect, I want to create a new `SubmissionVote` entity and database table to store individual votes cast by users for submissions, including their ranking and calculated points.**
    * _Description:_ Design and implement the `SubmissionVote` entity with properties for `SubmissionId`, `VoterId`, `CompetitionId`, `Rank`, `Points`, and `VoteTime`. Create the corresponding database table and configure relationships in `AppDbContext`.
    * _Acceptance Criteria:_
        * A `SubmissionVote` entity is created in `MixWarz.Domain`.
        * The `AppDbContext` includes a `DbSet<SubmissionVote>` and relationship configurations.
        * Database migrations are created for the `SubmissionVote` table.
* **Story 9.3: As a system architect, I want to update the `Submission` entity to remove the single `Score` field and add a collection of `SubmissionVote` entities.**
    * _Description:_ Remove the existing `Score` property from the `Submission` entity. Add a collection navigation property for `SubmissionVote`. Add fields to track voting eligibility and status within voting rounds.
    * _Acceptance Criteria:_
        * The `Score` property is removed from the `Submission` entity.
        * An `ICollection<SubmissionVote>` property is added to the `Submission` entity.
        * Properties like `IsEligibleForRound1Voting`, `IsEligibleForRound2Voting`, `AdvancedToRound2`, `IsDisqualified`, `FinalRank`, `FinalScore` are added to the `Submission` entity (consider if these are needed immediately or can be added in later epics focusing on the logic). *Decision: Add `IsEligibleForRound1Voting`, `IsEligibleForRound2Voting`, `AdvancedToRound2`, and `IsDisqualified` now as they are state indicators needed early.*
        * Database migrations are created to reflect these changes.
* **Story 9.4: As a system architect, I want to implement repositories for the new `SubmissionVote` entity and update the `SubmissionRepository` to handle the new relationships.**
    * _Description:_ Create a new repository interface (`ISubmissionVoteRepository`) and implementation (`SubmissionVoteRepository`) for basic CRUD operations on `SubmissionVote`. Update `ISubmissionRepository` and `SubmissionRepository` to include methods for querying submissions with their votes and potentially filtering based on voting eligibility status.
    * _Acceptance Criteria:_
        * `ISubmissionVoteRepository` interface is created in `MixWarz.Domain.Interfaces`.
        * `SubmissionVoteRepository` implementation is created in `MixWarz.Infrastructure.Persistence.Repositories`.
        * Basic CRUD methods are implemented in `SubmissionVoteRepository`.
        * `ISubmissionRepository` and `SubmissionRepository` are updated to fetch related `SubmissionVote` data when necessary (e.g., using `Include` in Entity Framework Core).
* **Story 9.5: As an administrator, I want to be able to manually transition a competition from 'Open For Submission' to 'Voting Round 1 Setup' after the submission deadline.**
    * _Description:_ Create a new command and handler (e.g., `TransitionCompetitionToRound1SetupCommand`) that updates a competition's status from `OpenForSubmission` to `VotingRound1Setup`. This handler should include a check to ensure the current status is correct and the submission deadline has passed. This provides a manual trigger before automation is implemented.
    * _Acceptance Criteria:_
        * A new command `TransitionCompetitionToRound1SetupCommand` is created in the Application layer.
        * A corresponding handler `TransitionCompetitionToRound1SetupCommandHandler` is created.
        * The handler verifies the competition is in the `OpenForSubmission` state and the end date/time has passed.
        * The handler updates the competition status to `VotingRound1Setup`.
        * An API endpoint is added (likely in `AdminController`) to trigger this command.

## Potential Future Epics (Brief Outline)

* **Epic 10: Competition Voting System - Round 1 Logic:** Implement the core logic for Round 1 voting, including grouping, assignment, receiving votes, calculating Round 1 scores, applying tie-breaking, and determining who advances to Round 2. Implement mandatory voting enforcement.
* **Epic 11: Competition Voting System - Round 2 Logic:** Implement the core logic for Round 2 voting, including identifying eligible voters (eliminated participants), receiving votes, calculating Round 2 scores, applying tie-breaking, and determining the final winner. Implement the Song Creator pick mechanism.
* **Epic 12: Competition Voting System - Admin & Automation:** Build admin interfaces to monitor voting progress, handle manual ties, manage disqualifications, and implement scheduled tasks for automatic competition state transitions (e.g., after submission deadline, after voting round ends).
* **Epic 13: Competition Voting System - User Interface Integration:** Develop the frontend components and API integrations for users to view competitions in different phases, submit their votes, see their voting assignments, and view results and rankings.