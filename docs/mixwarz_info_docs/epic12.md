# Epic 12: Competition Voting System - Admin & Automation

## Description

This epic addresses the critical supporting functionalities for the competition voting system. It ensures that submitted mixes meet the specified technical requirements (late submissions, uniqueness, format), provides administrators with tools to monitor and manage the competition process (including handling disqualifications), and automates the transitions between competition phases using scheduled tasks, reducing manual administrative overhead.

This epic complements the core voting logic implemented in Epics 9, 10, and 11 by adding necessary validations, administrative control, and automation.

## Functional Requirements Addressed

* No late submissions are accepted.
* Only one submission per contest per participant is allowed.
* Submissions must be in 320kbps MP3 format.
* Administrators can monitor the progress of voting rounds.
* Administrators can manage participant disqualifications.
* Competition phases transition automatically based on deadlines (Submission End -> Round 1 Setup -> Round 1 Voting -> Round 1 Tallying -> Round 2 Setup -> Round 2 Voting -> Round 2 Tallying -> Completed).
* Automated monthly creation of competitions (optional based on project priority, but aligns with Tourna-Mix cadence).

## Technical Approach

Submission validations will be implemented within the `CreateSubmissionCommandValidator` and potentially the `CreateSubmissionCommand` handler itself. Admin tools will be exposed via new queries and potentially dedicated admin commands. Automation will be achieved using a scheduling library like Quartz.NET or a cloud-native scheduler service, which will trigger commands responsible for transitioning competition states.

### Key Technical Tasks & Components

1.  **Submission Validation (Update `CreateSubmissionCommandValidator` and/or Handler):**
    * **Deadline Check:** Add a rule to check `Competition.EndDate` against the current time.
    * **Uniqueness Check:** Add a rule or handler logic to query for existing submissions by the current user for the given competition.
    * **File Format Validation:** Use FluentValidation custom validators or direct handler logic to check the uploaded file's MIME type (`IFormFile.ContentType`) and potentially attempt to verify the bitrate (this might require integrating an external library capable of reading audio metadata).
2.  **Admin Monitoring Queries:**
    * New queries (e.g., `GetCompetitionVotingProgressQuery`) to provide administrators with insights into the voting status of a competition, such as the number of participants who have voted in each round, the current top submissions based on votes received so far (during open voting phases), and the status of each submission (advanced, eliminated, disqualified).
3.  **Admin Disqualification Management:**
    * An admin query (e.g., `GetDisqualifiedSubmissionsQuery`) to list submissions marked as disqualified.
    * Potentially an admin command (e.g., `OverrideDisqualificationCommand`) if manual override is deemed necessary (requires careful consideration and logging). The primary disqualification (for not voting) is automated in Epic 10.
4.  **Scheduled Tasks (Using Quartz.NET or equivalent):**
    * Configure a scheduler service within the application or deploy an external scheduler.
    * Define jobs (`IJob` implementations in Quartz.NET) for each automated transition:
        * `TransitionSubmissionToEndJob`: Triggers `SetupRound1Command` after `Competition.EndDate`.
        * `TransitionRound1VotingToEndJob`: Triggers `TallyRound1VotesCommand` after the Round 1 voting deadline.
        * `CheckForRound1NonVotersJob`: Runs after the Round 1 voting deadline to trigger the disqualification logic (from Epic 10).
        * `TransitionRound2VotingToEndJob`: Triggers `TallyRound2VotesCommand` after the Round 2 voting deadline.
        * `CreateMonthlyCompetitionsJob` (Optional): Runs on the 1st of each month to trigger `CreateCompetitionCommand` for the two monthly contests.
    * Define triggers (e.g., `CronTrigger`) with appropriate schedules for each job.
5.  **Automation Command Handlers:** Ensure the command handlers for state transitions (`SetupRound1Command`, `TallyRound1VotesCommand`, `SetupRound2Command`, `TallyRound2VotesCommand`) are robust enough to be triggered by the scheduler and handle potential concurrency issues if applicable (though sequential processing per competition is likely sufficient).
6.  **Configuration:** Externalize scheduling configurations (cron expressions, delays) in `appsettings.json` or a configuration service.

## User Stories

* **Story 12.1: As a user, I want to be prevented from submitting my mix after the competition submission deadline has passed, and I want to receive a clear message indicating this.**
    * _Description:_ Add validation to `CreateSubmissionCommandValidator` to check `Competition.EndDate` before processing the submission. Return a validation error if the deadline has passed.
    * _Acceptance Criteria:_
        * `CreateSubmissionCommandValidator` includes a rule comparing `SubmissionTime` (or the time the command is received) against the competition's `EndDate`.
        * Submissions after the deadline are rejected with a specific validation error message.
* **Story 12.2: As a user, I want to be prevented from submitting more than one mix to the same competition, and I want to receive a clear message indicating this.**
    * _Description:_ Add a rule or handler logic in `CreateSubmissionCommand` to check if a submission by the current user for the specified competition already exists. Return a validation error if a submission is found.
    * _Acceptance Criteria:_
        * `CreateSubmissionCommand` handler or validator checks for existing submissions by `UserId` and `CompetitionId`.
        * Subsequent submissions for the same competition by the same user are rejected with a specific error message.
* **Story 12.3: As a user, I want my submission to be rejected if it is not a 320kbps MP3 file, and I want to receive a clear message about the required format.**
    * _Description:_ Add validation to `CreateSubmissionCommandValidator` or processing logic in the handler to check the uploaded file's MIME type (e.g., "audio/mpeg") and attempt to verify the bitrate is 320kbps. Reject submissions that don't match the criteria.
    * _Acceptance Criteria:_
        * `CreateSubmissionCommandValidator` or handler includes validation for file MIME type (audio/mpeg).
        * Logic is implemented (potentially using an external library) to check for 320kbps bitrate.
        * Submissions not meeting the format/bitrate requirements are rejected with a specific error message.
* **Story 12.4: As an administrator, I want to view the current voting progress for any active competition, including how many participants have voted in each round and the preliminary standings.**
    * _Description:_ Implement a query (e.g., `GetCompetitionVotingProgressQuery`) that fetches and aggregates voting data (`SubmissionVote` counts per submission, per voter) for a given competition, providing a summary of voting activity and preliminary scores/rankings during active voting rounds.
    * _Acceptance Criteria:_
        * A `GetCompetitionVotingProgressQuery` and handler are created (Admin protected).
        * The query returns metrics like total eligible voters, number of votes cast, and current point totals per submission.
        * Preliminary rankings are calculated based on current votes.
* **Story 12.5: As an administrator, I want to view a list of all submissions that have been automatically disqualified (e.g., for not voting) and the reason for disqualification.**
    * _Description:_ Implement a query (e.g., `GetDisqualifiedSubmissionsQuery`) that retrieves submissions marked with `IsDisqualified = true` and includes the reason for disqualification (potentially stored in a new field on the `Submission` entity or a related audit log).
    * _Acceptance Criteria:_
        * A `GetDisqualifiedSubmissionsQuery` and handler are created (Admin protected).
        * The query returns a list of disqualified submissions and their associated reason.
* **Story 12.6: As a system, I want to automatically transition a competition's status from 'Open For Submission' to 'Voting Round 1 Setup' shortly after the submission deadline passes.**
    * _Description:_ Configure a scheduled job (e.g., using Quartz.NET) that runs shortly after the specified `EndDate` of competitions in the `OpenForSubmission` state and triggers the `SetupRound1Command` for those competitions.
    * _Acceptance Criteria:_
        * A scheduled job (`TransitionSubmissionToEndJob`) is configured to run periodically.
        * The job identifies competitions where the deadline has passed and the status is `OpenForSubmission`.
        * The job successfully sends the `SetupRound1Command` for these competitions.
* **Story 12.7: As a system, I want competitions to automatically transition between the voting phases (Round 1 Setup -> Round 1 Voting, Round 1 Tallying -> Round 2 Setup, etc.) based on configured durations or triggers.**
    * _Description:_ Configure scheduled jobs that run after the expected duration of each voting phase or based on specific triggers (e.g., after Round 1 tallying is complete) to send the appropriate state transition commands (`TallyRound1VotesCommand`, `SetupRound2Command`, `TallyRound2VotesCommand`).
    * _Acceptance Criteria:_
        * Scheduled jobs are configured for transitions between voting phases.
        * Jobs correctly identify competitions in the preceding state.
        * Jobs successfully send the relevant state transition commands.
* **Story 12.8: As a system, I want to automatically create the two monthly competitions on the 1st of each month.**
    * _Description:_ (Optional based on priority) Configure a scheduled job (e.g., using a monthly cron expression) that runs on the 1st of each month and triggers the necessary `CreateCompetitionCommand` twice, providing parameters for the new monthly contests.
    * _Acceptance Criteria:_
        * A scheduled job (`CreateMonthlyCompetitionsJob`) is configured to run monthly (e.g., "0 0 1 * ?").
        * The job triggers the creation of two new competitions with appropriate details for the month.