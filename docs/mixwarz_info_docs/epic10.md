# Epic 10: Competition Voting System - Round 1 Logic

## Description

This epic implements the core business logic for the first round of competition voting. It covers the randomization and grouping of submissions, assigning specific groups of submissions to participants for judging, enabling participants to submit their votes, processing those votes, calculating scores based on the multi-point system, applying Round 1 tie-breaking rules, and identifying which submissions successfully advance to the second round. It also includes the implementation of the mandatory voting rule and associated disqualification process.

This epic builds directly upon the data model changes introduced in Epic 9.

## Functional Requirements Addressed

* Participants are randomized and divided into subgroups (15-30 contestants).
* Each participant is assigned to listen to and vote on mixes from *another* group.
* Participants select their top three mixes from their assigned group.
* Scoring: 1st place = 3 points, 2nd place = 2 points, 3rd place = 1 point.
* Points are tallied.
* The TOP TWO mixes from each group move forward to Round 2.
* Tie-breaking (Round 1): Total 1st place votes > total 2nd place votes > both advance.
* Round 1 voting is mandatory.
* Failure to vote during Round 1 results in disqualification from that contest.

## Technical Approach

We will introduce commands and handlers to manage the state transitions and logic specific to Round 1. A dedicated domain service or application service will encapsulate the complex logic for grouping, assignment, scoring, and tie-breaking to ensure testability and separation of concerns. This service will interact with the repositories for `Competition`, `Submission`, `SubmissionVote`, and `User` entities.

### Key Technical Tasks & Components

1.  **Grouping and Assignment Service:** A new service (e.g., `Round1AssignmentService`) will be responsible for:
    * Fetching all active submissions for a competition in `VotingRound1Setup` status.
    * Randomizing the order of participants/submissions.
    * Dividing participants/submissions into groups of approximately 15-30.
    * Assigning each participant to judge a different group (ensure no participant judges their own group). This might involve creating a mapping table or entity (`Round1Assignment`) to store which user is assigned to judge which group of submissions.
    * Updating competition status to `VotingRound1Open` after assignments are made.
2.  **Vote Submission Command/Handler:**
    * A command (e.g., `SubmitRound1VotesCommand`) allowing a user to submit their 1st, 2nd, and 3rd place choices for their assigned group.
    * The handler will validate:
        * The competition is in `VotingRound1Open` status.
        * The user is a participant in the competition and eligible to vote in Round 1.
        * The submitted votes are for submissions within the user's *assigned* voting group.
        * The user has not already submitted votes for this competition in Round 1.
        * Exactly three unique submissions are ranked (1st, 2nd, 3rd).
    * The handler will create `SubmissionVote` entries in the database based on the submitted ranks and calculated points.
    * Mark the user as having voted for Round 1 (e.g., adding a field to the `User` entity or a new `UserCompetitionStatus` entity).
3.  **Vote Tallying and Advancement Service:** A new service (e.g., `Round1TallyingService`) will be responsible for:
    * Fetching all submissions and their associated `SubmissionVote` entries for a competition in `VotingRound1Tallying` status.
    * Calculating the total points for each submission within its original group.
    * Applying the Round 1 tie-breaking logic (count 1st place votes, then 2nd place votes).
    * Identifying the top two submissions in each group that advance.
    * Updating the `Submission` entity's status (`AdvancedToRound2 = true`).
    * Updating competition status to `VotingRound2Setup`.
4.  **Mandatory Voting Enforcement:**
    * A process (likely triggered by a scheduled task, see Epic 12) to run after the Round 1 voting deadline.
    * Identify participants who submitted a mix but did *not* cast their Round 1 votes.
    * Mark these users/submissions as disqualified (e.g., updating `Submission.IsDisqualified = true` and potentially adding a reason).
    * Disqualified submissions *cannot* advance, even if they received votes.
    * Disqualified users *cannot* vote in Round 2.
5.  **Queries:** New queries to fetch submissions assigned to a specific user for voting and to view Round 1 results (scores per submission per group, who advanced) (primarily for admin/internal use initially, public view in Epic 13).

## User Stories

* **Story 10.1: As an administrator, I want to trigger the Round 1 setup process for a competition so that participants and submissions are randomized, grouped, and assigned for voting.**
    * _Description:_ Implement a command (e.g., `SetupRound1Command`) that, when a competition is in `VotingRound1Setup` status, fetches participants with submissions, randomizes, groups them (aiming for 15-30 per group), assigns voters to judge different groups, and stores these assignments. Update competition status to `VotingRound1Open`.
    * _Acceptance Criteria:_
        * A `SetupRound1Command` and handler are created.
        * A service (`Round1AssignmentService`) is implemented to perform grouping and assignment logic.
        * Submissions and users are correctly grouped and assignments are recorded (potentially in a new `Round1Assignment` entity).
        * The competition status is updated to `VotingRound1Open`.
        * An API endpoint is added for this command (Admin protected).
* **Story 10.2: As a participant, I want to view the list of submissions I have been assigned to vote on for the current Round 1 of a competition.**
    * _Description:_ Implement a query (e.g., `GetRound1VotingAssignmentsQuery`) that retrieves the list of submissions assigned to the currently authenticated user for voting in a specific competition that is in `VotingRound1Open` status.
    * _Acceptance Criteria:_
        * A `GetRound1VotingAssignmentsQuery` and handler are created.
        * The query returns a list of submissions relevant to the user's Round 1 voting assignment.
        * The query handler enforces that the competition is in the correct state and the user has an assignment.
        * An API endpoint is added for this query (User authenticated).
* **Story 10.3: As a participant, I want to submit my ranked votes (1st, 2nd, 3rd) for the submissions in my assigned group during Round 1 voting.**
    * _Description:_ Implement a command (e.g., `SubmitRound1VotesCommand`) that allows a user to submit a list of submission IDs corresponding to their 1st, 2nd, and 3rd choices for their assigned voting group. The handler will validate the input, create `SubmissionVote` records, and mark the user as having voted for Round 1.
    * _Acceptance Criteria:_
        * A `SubmitRound1VotesCommand` and handler are created.
        * The handler validates the input (correct number of votes, valid submission IDs within assignment, user has not voted yet).
        * `SubmissionVote` entities are created with correct `Rank` and calculated `Points` (3, 2, 1).
        * The user's voting status for Round 1 is marked as complete.
        * An API endpoint is added for this command (User authenticated).
* **Story 10.4: As an administrator, I want to trigger the Round 1 tallying process to calculate scores and determine which submissions advance to Round 2 based on the votes received.**
    * _Description:_ Implement a command (e.g., `TallyRound1VotesCommand`) that, when a competition is in `VotingRound1Tallying` status, aggregates `SubmissionVote` points for each submission within its original group, applies the Round 1 tie-breaking rules, and updates the `AdvancedToRound2` status on the `Submission` entity for the top two in each group. Update competition status to `VotingRound2Setup`.
    * _Acceptance Criteria:_
        * A `TallyRound1VotesCommand` and handler are created.
        * A service (`Round1TallyingService`) is implemented to perform score calculation and tie-breaking logic.
        * Submission scores are calculated accurately based on votes.
        * Tie-breaking rules (1st place votes, then 2nd place votes) are correctly applied.
        * The top two submissions per group are marked `AdvancedToRound2 = true`.
        * The competition status is updated to `VotingRound2Setup`.
        * An API endpoint is added for this command (Admin protected).
* **Story 10.5: As a system, I want to automatically identify participants who did not cast their Round 1 votes by the deadline and disqualify their submissions.**
    * _Description:_ Implement logic (to be triggered by a scheduled task, see Epic 12) that runs after the Round 1 voting deadline. This logic identifies users with submissions who do not have completed Round 1 votes and marks their `Submission.IsDisqualified = true`.
    * _Acceptance Criteria:_
        * Logic is implemented to identify non-voters.
        * Submissions belonging to non-voters are marked as disqualified.
        * Disqualified submissions are excluded from advancing to Round 2.