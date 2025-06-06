# Epic 11: Competition Voting System - Round 2 Logic

## Description

This epic implements the core business logic for the second and final round of competition voting, leading to the determination of the overall competition winner. It includes identifying the correct set of voters (participants eliminated in Round 1), enabling them to cast votes on the submissions that advanced from Round 1, processing these votes, calculating final scores, applying the Round 2 tie-breaking rules (including the manual admin pick for true ties), and recording the Song Creator's selections.

This epic builds upon the data model and Round 1 processing implemented in Epics 9 and 10.

## Functional Requirements Addressed

* Round 2 voting involves members who were eliminated in Round 1.
* Participants who advanced to Round 2 *cannot* vote in Round 2.
* Eligible Round 2 voters choose their top three mixes from those that advanced.
* Scoring is identical to Round 1 (1st=3, 2nd=2, 3rd=1).
* The mix with the most points WINS the competition.
* Tie-breaking (Round 2): Same as Round 1 (1st place votes, then 2nd place votes).
* In the event of a true points tie in Round 2, the winning mix is chosen manually by the organizer (Eric Passmore).
* Song Creator picks their top three mixes during Round 2 voting (for bragging rights).

## Technical Approach

Similar to Epic 10, we will use commands, handlers, and dedicated services to manage the Round 2 process. Services will handle identifying eligible voters, processing votes, calculating final scores, applying tie-breaking logic, and determining the winner. The data model established in Epic 9 (`SubmissionVote`) will be used to store Round 2 votes.

### Key Technical Tasks & Components

1.  **Round 2 Eligibility and Setup:**
    * A command/handler (e.g., `SetupRound2Command`) triggered when a competition transitions to `VotingRound2Setup`.
    * This process identifies submissions that have `AdvancedToRound2 = true`.
    * It identifies users who submitted to the competition but did *not* have their submission `AdvancedToRound2 = true` AND were *not* `IsDisqualified` in Round 1. These are the eligible Round 2 voters.
    * Update competition status to `VotingRound2Open`.
2.  **Round 2 Vote Submission:**
    * A command (e.g., `SubmitRound2VotesCommand`) allowing an *eligible Round 2 voter* to submit their 1st, 2nd, and 3rd place choices from the submissions that advanced.
    * The handler will validate:
        * The competition is in `VotingRound2Open` status.
        * The user is eligible to vote in Round 2 (eliminated and not disqualified from Round 1).
        * The submitted votes are for submissions that `AdvancedToRound2 = true`.
        * The user has not already submitted Round 2 votes.
        * Exactly three unique advanced submissions are ranked (1st, 2nd, 3rd).
    * The handler will create `SubmissionVote` entries, explicitly marking them as Round 2 votes (e.g., adding a `RoundNumber` property to `SubmissionVote` or using the competition state context).
3.  **Round 2 Vote Tallying and Winner Determination Service:** A service (e.g., `Round2TallyingService`) responsible for:
    * Fetching all advanced submissions and their associated `SubmissionVote` entries for a competition in `VotingRound2Tallying` status.
    * Calculating the total points for each advanced submission based on Round 2 votes.
    * Applying the Round 2 tie-breaking logic (count 1st place votes, then 2nd place votes).
    * Identifying the submission with the highest total score as the winner.
    * If a true tie exists after applying tie-breakers, mark the competition status to indicate it requires manual resolution (e.g., `RequiresManualWinnerSelection`).
    * If no true tie, mark the winning submission (e.g., `Submission.IsWinner = true`) and update competition status to `Completed`.
4.  **Manual Winner Selection Command/Handler:**
    * A command (e.g., `SelectRound2WinnerManuallyCommand`) for an administrator to explicitly choose the winner when a true tie occurs.
    * The handler validates the competition is in the `RequiresManualWinnerSelection` state and the submitted submission ID is one of the tied submissions.
    * Marks the selected submission as the winner and updates the competition status to `Completed`.
5.  **Song Creator Pick Command/Handler:**
    * A command (e.g., `RecordSongCreatorPicksCommand`) for an administrator to record the Song Creator's top three picks from the submissions that advanced to Round 2.
    * This data should be stored separately, perhaps in a new entity (`SongCreatorPick`) linking to the Competition, Song Creator User (if represented in the system), Submission, and Rank.
6.  **Queries:** New queries to view advanced submissions (for voting), view Round 2 results (scores per submission, potential ties), view the final winner, and view Song Creator picks (for display).

## User Stories

* **Story 11.1: As an administrator, I want to trigger the Round 2 setup process for a competition so that eligible voters (eliminated participants) and advanced submissions are identified.**
    * _Description:_ Implement a command (`SetupRound2Command`) that transitions a competition from `VotingRound2Setup` to `VotingRound2Open`, identifies submissions marked `AdvancedToRound2`, and determines eligible Round 2 voters (participants who submitted but did not advance and were not disqualified).
    * _Acceptance Criteria:_
        * A `SetupRound2Command` and handler are created.
        * The handler correctly identifies advanced submissions and eligible Round 2 voters.
        * The competition status is updated to `VotingRound2Open`.
        * An API endpoint is added for this command (Admin protected).
* **Story 11.2: As an eliminated participant, I want to view the submissions that advanced to Round 2 so I can cast my final votes.**
    * _Description:_ Implement a query (e.g., `GetRound2VotingSubmissionsQuery`) that retrieves the list of submissions that have `AdvancedToRound2 = true` for a specific competition in `VotingRound2Open` status. The query handler should verify the user is eligible to vote in Round 2.
    * _Acceptance Criteria:_
        * A `GetRound2VotingSubmissionsQuery` and handler are created.
        * The query returns only submissions marked `AdvancedToRound2`.
        * The query handler enforces that the competition is in the correct state and the user is an eligible Round 2 voter.
        * An API endpoint is added for this query (User authenticated).
* **Story 11.3: As an eliminated participant, I want to submit my ranked votes (1st, 2nd, 3rd) for the submissions that advanced to Round 2.**
    * _Description:_ Implement a command (e.g., `SubmitRound2VotesCommand`) allowing an eligible Round 2 voter to submit their top three ranked choices from the advanced submissions. The handler will validate eligibility and input, and create `SubmissionVote` records, marking them as Round 2 votes.
    * _Acceptance Criteria:_
        * A `SubmitRound2VotesCommand` and handler are created.
        * The handler validates input (correct number of votes, valid advanced submission IDs, user eligibility, user has not voted yet in Round 2).
        * `SubmissionVote` entities are created with correct `Rank`, calculated `Points`, and identified as Round 2 votes.
        * The user's voting status for Round 2 is marked as complete.
        * An API endpoint is added for this command (User authenticated).
* **Story 11.4: As an administrator, I want to trigger the Round 2 tallying process to calculate final scores and determine the competition winner.**
    * _Description:_ Implement a command (e.g., `TallyRound2VotesCommand`) that, when a competition is in `VotingRound2Tallying` status, aggregates Round 2 `SubmissionVote` points for each advanced submission, applies the Round 2 tie-breaking rules, and identifies the winner. If a true tie occurs, set the competition status to `RequiresManualWinnerSelection`. Otherwise, mark the winner and set status to `Completed`.
    * _Acceptance Criteria:_
        * A `TallyRound2VotesCommand` and handler are created.
        * A service (`Round2TallyingService`) is implemented for score calculation and tie-breaking.
        * Final submission scores are calculated based on Round 2 votes.
        * Round 2 tie-breaking rules (1st place votes, then 2nd place votes) are correctly applied.
        * The winner is identified.
        * If a true tie, competition status is set to `RequiresManualWinnerSelection`.
        * If no true tie, the winning submission is marked and competition status is set to `Completed`.
        * An API endpoint is added for this command (Admin protected).
* **Story 11.5: As an administrator, I want to manually select the winner for a competition that resulted in a true tie during Round 2 tallying.**
    * _Description:_ Implement a command (e.g., `SelectRound2WinnerManuallyCommand`) allowing an admin to specify the winning submission ID for a competition in the `RequiresManualWinnerSelection` state. The handler will validate the input, mark the selected submission as the winner, and set the competition status to `Completed`.
    * _Acceptance Criteria:_
        * A `SelectRound2WinnerManuallyCommand` and handler are created.
        * The handler validates the command against competition state and tied submissions.
        * The specified submission is marked as the winner.
        * The competition status is updated to `Completed`.
        * An API endpoint is added for this command (Admin protected).
* **Story 11.6: As an administrator, I want to record the Song Creator's top three picks for a competition after Round 2 voting is complete.**
    * _Description:_ Implement a command (e.g., `RecordSongCreatorPicksCommand`) that allows an admin to submit the 1st, 2nd, and 3rd place picks from the Song Creator from the list of advanced submissions. Store these picks in a dedicated table/entity (`SongCreatorPick`).
    * _Acceptance Criteria:_
        * A `RecordSongCreatorPicksCommand` and handler are created.
        * A `SongCreatorPick` entity/table is designed and implemented.
        * The handler validates input (correct number of picks, valid advanced submission IDs).
        * Song Creator picks are stored correctly, linked to the competition and submissions.
        * An API endpoint is added for this command (Admin protected).
* **Story 11.7: As a system, after the Round 2 winner is determined (either automatically or manually), I want the competition status to be finalized as 'Completed'.**
    * _Description:_ Ensure the `TallyRound2VotesCommand` and `SelectRound2WinnerManuallyCommand` handlers correctly update the `CompetitionStatus` to `Completed` once a winner is definitively decided.
    * _Acceptance Criteria:_
        * Competition status is correctly set to `Completed` after automatic winner determination or manual selection.