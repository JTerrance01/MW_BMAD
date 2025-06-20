using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Services
{
    public class Round1AssignmentService : IRound1AssignmentService
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IRound1AssignmentRepository _round1AssignmentRepository;
        private readonly ISubmissionGroupRepository _submissionGroupRepository;
        private readonly ISubmissionVoteRepository _submissionVoteRepository;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<Round1AssignmentService> _logger;
        private readonly IAppDbContext _context;

        private static readonly Random _random = new Random();

        public Round1AssignmentService(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            IRound1AssignmentRepository round1AssignmentRepository,
            ISubmissionGroupRepository submissionGroupRepository,
            ISubmissionVoteRepository submissionVoteRepository,
            UserManager<User> userManager,
            ILogger<Round1AssignmentService> logger,
            IAppDbContext context)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _round1AssignmentRepository = round1AssignmentRepository;
            _submissionGroupRepository = submissionGroupRepository;
            _submissionVoteRepository = submissionVoteRepository;
            _userManager = userManager;
            _logger = logger;
            _context = context;
        }

        public async Task<int> CreateGroupsAndAssignVotersAsync(int competitionId, int targetGroupSize = 20)
        {
            _logger.LogInformation("🔧 Starting voting group creation for competition {CompetitionId}", competitionId);

            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            if (competition.Status != CompetitionStatus.VotingRound1Setup)
            {
                throw new Exception($"Competition must be in VotingRound1Setup status, current status: {competition.Status}");
            }

            // Get all eligible submissions (not disqualified)
            var submissions = (await _submissionRepository.GetByCompetitionIdAsync(
                competitionId, 1, 1000))
                .Where(s => !s.IsDisqualified && s.IsEligibleForRound1Voting)
                .ToList();

            if (submissions.Count < 3)
            {
                throw new Exception($"Not enough eligible submissions to create groups. At least 3 required, found {submissions.Count}");
            }

            _logger.LogInformation("📝 Found {SubmissionCount} eligible submissions", submissions.Count);

            // BUSINESS LOGIC: Only submitters can vote (voters = submissions)
            // Get users who submitted to this competition
            var submitterUserIds = submissions.Select(s => s.UserId).Distinct().ToList();
            var submitters = await _userManager.Users
                .Where(u => submitterUserIds.Contains(u.Id))
                .ToListAsync();

            if (submitters.Count != submissions.Count)
            {
                _logger.LogWarning("⚠️ Submitter count ({SubmitterCount}) doesn't match submission count ({SubmissionCount}). Some users may have multiple submissions.",
                    submitters.Count, submissions.Count);
            }

            _logger.LogInformation("👤 Found {SubmitterCount} submitters who are eligible to vote (only submitters can vote)", submitters.Count);

            // Clear any existing assignments (in case this is a re-run)
            await ClearExistingAssignmentsAsync(competitionId);

            // Generate random groups with improved logic for small competitions
            var randomizedSubmissions = submissions.OrderBy(s => _random.Next()).ToList();
            int groupCount;

            // Improved grouping logic based on competition size
            if (randomizedSubmissions.Count <= 6)
            {
                // Very small competition: 2 groups with 3 submissions each (minimum for voting)
                groupCount = 2;
            }
            else if (randomizedSubmissions.Count <= 12)
            {
                // Small competition: 3 groups to ensure good distribution
                groupCount = 3;
            }
            else if (randomizedSubmissions.Count <= 20)
            {
                // Medium competition: 4 groups to prevent overly large groups
                groupCount = 4;
            }
            else
            {
                // Large competition: Use targetGroupSize calculation
                groupCount = Math.Max(2, (int)Math.Ceiling((double)randomizedSubmissions.Count / targetGroupSize));

                // Ensure we don't have tiny groups
                if (randomizedSubmissions.Count / groupCount < 5)
                {
                    groupCount = Math.Max(2, randomizedSubmissions.Count / 5);
                }
            }

            // Ensure minimum of 2 groups (never put everyone in 1 group)
            groupCount = Math.Max(2, groupCount);

            _logger.LogInformation("👥 Creating {GroupCount} groups for {SubmissionCount} submissions (avg {AvgGroupSize} per group)",
                groupCount, randomizedSubmissions.Count, (double)randomizedSubmissions.Count / groupCount);

            // Create submission groups with round-robin distribution
            var submissionGroups = new List<SubmissionGroup>();
            for (int i = 0; i < randomizedSubmissions.Count; i++)
            {
                var groupNumber = (i % groupCount) + 1;  // Groups are 1-based
                var submission = randomizedSubmissions[i];

                submissionGroups.Add(new SubmissionGroup
                {
                    CompetitionId = competitionId,
                    SubmissionId = submission.SubmissionId,
                    GroupNumber = groupNumber
                });
            }

            // Save submission groups
            await _submissionGroupRepository.CreateManyAsync(submissionGroups);
            _logger.LogInformation("✅ Created {GroupCount} submission groups", groupCount);

            // Create a mapping of user IDs to their submission group numbers
            var userSubmissionGroups = new Dictionary<string, int>();
            foreach (var submission in randomizedSubmissions)
            {
                var submissionGroup = submissionGroups.First(sg => sg.SubmissionId == submission.SubmissionId);
                userSubmissionGroups[submission.UserId] = submissionGroup.GroupNumber;
            }

            _logger.LogInformation("📊 {SubmitterCount} users have submissions in the competition", userSubmissionGroups.Count);

            // Create voter assignments for ONLY SUBMITTERS, ensuring no one votes on their own group
            var assignments = new List<Round1Assignment>();
            foreach (var user in submitters)
            {
                // Determine which group this user's submission is in
                var userSubmittedGroupNumber = userSubmissionGroups[user.Id];

                // Assign voter to a group (different from their own)
                var possibleGroups = Enumerable.Range(1, groupCount)
                    .Where(g => g != userSubmittedGroupNumber).ToList();

                int assignedGroupNumber;
                if (possibleGroups.Count > 0)
                {
                    assignedGroupNumber = possibleGroups[_random.Next(possibleGroups.Count)];
                }
                else
                {
                    // Fallback: this shouldn't happen with multiple groups, but assign to group 1
                    assignedGroupNumber = 1;
                    _logger.LogWarning("⚠️ Could not find alternative group for user {UserId} who submitted to group {GroupNumber}",
                        user.Id, userSubmittedGroupNumber);
                }

                assignments.Add(new Round1Assignment
                {
                    CompetitionId = competitionId,
                    VoterId = user.Id,
                    VoterGroupNumber = userSubmittedGroupNumber,
                    AssignedGroupNumber = assignedGroupNumber,
                    HasVoted = false
                });

                _logger.LogDebug("👤 User {UserId}: SubmittedGroup={SubmittedGroup}, AssignedToVoteOnGroup={AssignedGroup}",
                    user.Id, userSubmittedGroupNumber, assignedGroupNumber);
            }

            // Save assignments
            await _round1AssignmentRepository.CreateManyAsync(assignments);

            _logger.LogInformation("🎉 VOTING LOGIC UPDATE: Created voting assignments for {AssignmentCount} submitters (only submitters can vote)", assignments.Count);

            return groupCount;
        }

        public async Task<IEnumerable<Submission>> GetAssignedSubmissionsForVoterAsync(int competitionId, string voterId)
        {
            _logger.LogInformation("🔍 Getting voting assignments for user {VoterId} in competition {CompetitionId}", voterId, competitionId);

            // Get voter's assignment
            var assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, voterId);
            if (assignment == null)
            {
                _logger.LogWarning("❌ No voting assignment found for user {VoterId} in competition {CompetitionId}", voterId, competitionId);
                return Enumerable.Empty<Submission>();
            }

            _logger.LogInformation("✅ Found assignment for user {VoterId}: assigned to group {GroupNumber}", voterId, assignment.AssignedGroupNumber);

            // Get all submissions in the assigned group
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                competitionId, assignment.AssignedGroupNumber);

            var submissions = submissionGroups.Select(sg => sg.Submission).ToList();
            _logger.LogInformation("📄 User {VoterId} has {SubmissionCount} submissions to vote on", voterId, submissions.Count);

            // Return the actual submission objects
            return submissions;
        }

        public async Task<bool> ProcessVoterSubmissionAsync(int competitionId, string voterId,
            int firstPlaceSubmissionId, int secondPlaceSubmissionId, int thirdPlaceSubmissionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null || competition.Status != CompetitionStatus.VotingRound1Open)
            {
                return false;
            }

            // Get voter's assignment
            var assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, voterId);
            if (assignment == null)
            {
                return false;
            }

            // Check if voter has already voted
            if (assignment.HasVoted)
            {
                return false;
            }

            // Ensure all submission IDs are unique
            var submissionIds = new HashSet<int> { firstPlaceSubmissionId, secondPlaceSubmissionId, thirdPlaceSubmissionId };
            if (submissionIds.Count != 3)
            {
                return false;
            }

            // Get assigned submissions for verification
            var assignedSubmissionGroups = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                competitionId, assignment.AssignedGroupNumber);

            var assignedSubmissionIds = assignedSubmissionGroups.Select(sg => sg.SubmissionId).ToHashSet();

            // Verify all voted submissions are in the assigned group
            if (!submissionIds.All(id => assignedSubmissionIds.Contains(id)))
            {
                return false;
            }

            // Create votes records with proper point values
            var votes = new List<SubmissionVote>
            {
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = firstPlaceSubmissionId,
                    VoterId = voterId,
                    Rank = 1,
                    Points = 3,
                    VotingRound = 1,
                    VoteTime = DateTimeOffset.UtcNow
                },
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = secondPlaceSubmissionId,
                    VoterId = voterId,
                    Rank = 2,
                    Points = 2,
                    VotingRound = 1,
                    VoteTime = DateTimeOffset.UtcNow
                },
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = thirdPlaceSubmissionId,
                    VoterId = voterId,
                    Rank = 3,
                    Points = 1,
                    VotingRound = 1,
                    VoteTime = DateTimeOffset.UtcNow
                }
            };

            // Save votes
            foreach (var vote in votes)
            {
                await _submissionVoteRepository.CreateAsync(vote);
            }

            // Update assignment status
            assignment.HasVoted = true;
            assignment.VotingCompletedDate = DateTimeOffset.UtcNow;
            await _round1AssignmentRepository.UpdateAsync(assignment);

            return true;
        }

        public async Task<int> TallyVotesAndDetermineAdvancementAsync(int competitionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            // ENHANCED: Auto-transition from VotingRound1Open to VotingRound1Tallying if needed
            if (competition.Status == CompetitionStatus.VotingRound1Open)
            {
                _logger.LogInformation($"Auto-transitioning competition {competitionId} from VotingRound1Open to VotingRound1Tallying");
                // Update status to VotingRound1Tallying
                competition.Status = CompetitionStatus.VotingRound1Tallying;
                await _competitionRepository.UpdateAsync(competition);
                _logger.LogInformation($"Competition {competitionId} status updated to VotingRound1Tallying");
            }
            else if (competition.Status != CompetitionStatus.VotingRound1Tallying)
            {
                throw new Exception($"Competition must be in VotingRound1Open or VotingRound1Tallying status for tallying, current status: {competition.Status}");
            }

            _logger.LogInformation($"🔄 Starting comprehensive Round 1 tallying for competition {competitionId}");

            // PHASE 1: JUDGE DISQUALIFICATION LOGIC
            // Identify and disqualify submissions from judges who didn't complete their assignments
            _logger.LogInformation($"📋 Phase 1: Identifying incomplete judges and applying disqualifications");

            var incompleteJudgesDisqualified = await DisqualifyIncompleteJudgesSubmissionsAsync(competitionId);
            if (incompleteJudgesDisqualified > 0)
            {
                _logger.LogWarning($"⚠️ Disqualified {incompleteJudgesDisqualified} submissions from judges who didn't complete their assignments");
            }

            // PHASE 2: FAIR SCORING SYSTEM
            // Calculate Round1Score for ALL submissions (including those with no judgments)
            _logger.LogInformation($"📊 Phase 2: Calculating fair Round1 scores for all submissions");

            await CalculateFairRound1ScoresAsync(competitionId);

            // PHASE 3: VOTE COUNTING AND RANKING
            // Calculate vote counts and rankings based on judgment data
            _logger.LogInformation($"🗳️ Phase 3: Processing vote counts and determining rankings");

            var advancedCount = await ProcessVoteCountsAndAdvancementAsync(competitionId);

            // PHASE 4: VALIDATION AND INTEGRITY CHECK
            // Verify all non-disqualified submissions have Round1Score
            _logger.LogInformation($"🔍 Phase 4: Validating tallying results");

            await ValidateTallyingResultsAsync(competitionId);

            // Update competition status to VotingRound2Setup
            competition.Status = CompetitionStatus.VotingRound2Setup;
            await _competitionRepository.UpdateAsync(competition);

            _logger.LogInformation($"✅ Competition {competitionId} tallying complete. {advancedCount} submissions advanced to Round 2");

            return advancedCount;
        }

        /// <summary>
        /// PHASE 1: Disqualify submissions from judges who didn't complete their assignments
        /// BUSINESS RULE: Judges who don't fulfill their judging duties forfeit their chance to advance
        /// </summary>
        private async Task<int> DisqualifyIncompleteJudgesSubmissionsAsync(int competitionId)
        {
            var disqualifiedCount = 0;

            // Get all judge assignments for this competition
            var allAssignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
            var incompleteJudges = new List<string>();

            foreach (var assignment in allAssignments)
            {
                // Get all submissions in the judge's assigned group
                var assignedSubmissions = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                    competitionId, assignment.AssignedGroupNumber);

                var eligibleSubmissionIds = assignedSubmissions
                    .Where(sg => !sg.Submission.IsDisqualified)
                    .Select(sg => sg.SubmissionId)
                    .ToList();

                if (eligibleSubmissionIds.Count == 0)
                {
                    _logger.LogInformation($"Judge {assignment.VoterId}: No eligible submissions in assigned group {assignment.AssignedGroupNumber}");
                    continue;
                }

                // Check if judge completed judgments for ALL eligible submissions
                var completedJudgments = await _context.SubmissionJudgments
                    .Where(sj => sj.JudgeId == assignment.VoterId &&
                               sj.CompetitionId == competitionId &&
                               (sj.VotingRound == 1 || sj.VotingRound == null) && // Handle NULL or missing VotingRound
                               sj.IsCompleted == true &&
                               sj.OverallScore.HasValue &&
                               eligibleSubmissionIds.Contains(sj.SubmissionId))
                    .CountAsync();

                if (completedJudgments < eligibleSubmissionIds.Count)
                {
                    incompleteJudges.Add(assignment.VoterId);
                    _logger.LogWarning($"❌ Judge {assignment.VoterId}: INCOMPLETE - judged {completedJudgments}/{eligibleSubmissionIds.Count} assigned submissions in group {assignment.AssignedGroupNumber}. Will be disqualified.");
                }
                else
                {
                    _logger.LogInformation($"✅ Judge {assignment.VoterId}: COMPLETE - judged all {completedJudgments} assigned submissions in group {assignment.AssignedGroupNumber}");
                }
            }

            // Disqualify submissions from incomplete judges
            foreach (var incompleteJudgeId in incompleteJudges)
            {
                var submissions = await _submissionRepository.GetByCompetitionIdAndUserIdAsync(
                    competitionId, incompleteJudgeId);

                foreach (var submission in submissions)
                {
                    submission.IsDisqualified = true;
                    submission.AdvancedToRound2 = false;
                    submission.IsEligibleForRound2Voting = false;
                    submission.Feedback = "Disqualified: Judge did not complete assigned Round 1 evaluations";

                    await _submissionRepository.UpdateAsync(submission);
                    disqualifiedCount++;

                    _logger.LogWarning($"🚫 Disqualified submission {submission.SubmissionId} ({submission.MixTitle}) from incomplete judge {incompleteJudgeId}");
                }
            }

            return disqualifiedCount;
        }

        /// <summary>
        /// PHASE 2: Calculate fair Round1 scores for ALL submissions
        /// Ensures every submission gets a Round1Score value (no NULL values)
        /// Uses ALL valid judgments, not just from "complete" judges
        /// </summary>
        private async Task CalculateFairRound1ScoresAsync(int competitionId)
        {
            // Get ALL submissions for this competition
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);

            // Statistics tracking
            int totalSubmissions = allSubmissions.Count();
            int submissionsWithJudgments = 0;
            int submissionsWithoutJudgments = 0;
            var judgmentCounts = new Dictionary<int, int>(); // Track distribution of judgment counts

            foreach (var submission in allSubmissions)
            {
                if (submission.IsDisqualified)
                {
                    // Disqualified submissions get score of 0
                    submission.Round1Score = 0;
                    _logger.LogInformation($"Submission {submission.SubmissionId} ({submission.MixTitle}): DISQUALIFIED - Round1Score = 0");
                }
                else
                {
                    // IMPROVED: Get ALL valid completed judgments for this submission
                    // We don't restrict to only "complete judges" - we use ALL valid judgments
                    // FIXED: Handle cases where VotingRound might be NULL or not set to 1
                    var judgments = await _context.SubmissionJudgments
                        .Where(sj => sj.SubmissionId == submission.SubmissionId &&
                                   sj.CompetitionId == competitionId &&
                                   (sj.VotingRound == 1 || sj.VotingRound == null) && // Handle NULL or missing VotingRound
                                   sj.IsCompleted == true &&
                                   sj.OverallScore.HasValue)
                        .ToListAsync();

                    // Track statistics
                    if (!judgmentCounts.ContainsKey(judgments.Count))
                        judgmentCounts[judgments.Count] = 0;
                    judgmentCounts[judgments.Count]++;

                    if (judgments.Count > 0)
                    {
                        // Calculate average score from ALL valid judgments
                        decimal averageScore = judgments.Average(j => j.OverallScore.Value);
                        submission.Round1Score = Math.Round(averageScore, 2);
                        submissionsWithJudgments++;

                        // Log detailed information
                        var judgeList = string.Join(", ", judgments.Select(j => j.JudgeId));
                        _logger.LogInformation($"Submission {submission.SubmissionId} ({submission.MixTitle}): " +
                            $"{judgments.Count} judgments from judges [{judgeList}], " +
                            $"Scores: [{string.Join(", ", judgments.Select(j => j.OverallScore.Value))}], " +
                            $"Average Score = {submission.Round1Score}");

                        // Warn if submission has very few judgments
                        if (judgments.Count < 3)
                        {
                            _logger.LogWarning($"⚠️ Submission {submission.SubmissionId} ({submission.MixTitle}) " +
                                $"has only {judgments.Count} judgment(s) - may affect fairness");
                        }
                    }
                    else
                    {
                        // No judgments received - assign minimum score
                        submission.Round1Score = 0;
                        submissionsWithoutJudgments++;
                        _logger.LogWarning($"Submission {submission.SubmissionId} ({submission.MixTitle}): " +
                            "No completed judgments found - Round1Score = 0 (minimum score)");
                    }
                }

                await _submissionRepository.UpdateAsync(submission);
            }

            // Log comprehensive statistics
            _logger.LogInformation($"✅ Round1Score calculation complete for Competition {competitionId}:");
            _logger.LogInformation($"   Total submissions: {totalSubmissions}");
            _logger.LogInformation($"   Submissions with judgments: {submissionsWithJudgments}");
            _logger.LogInformation($"   Submissions without judgments: {submissionsWithoutJudgments}");
            _logger.LogInformation($"   Judgment count distribution:");
            foreach (var kvp in judgmentCounts.OrderBy(x => x.Key))
            {
                _logger.LogInformation($"      {kvp.Key} judgment(s): {kvp.Value} submissions");
            }
        }

        /// <summary>
        /// PHASE 3: Process vote counts and determine Round2 advancement
        /// Only eligible (non-disqualified) submissions are considered for advancement
        /// </summary>
        private async Task<int> ProcessVoteCountsAndAdvancementAsync(int competitionId)
        {
            // Process each group
            var groups = await _submissionGroupRepository.GetGroupCountByCompetitionIdAsync(competitionId);
            var advancedCount = 0;

            for (int groupNumber = 1; groupNumber <= groups; groupNumber++)
            {
                _logger.LogInformation($"🏆 Processing advancement for Group {groupNumber}");

                // Get all submissions in this group
                var submissionGroups = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                    competitionId, groupNumber);

                // IMPROVED: Calculate vote counts using ALL valid judgments
                await CalculateVoteCountsForGroupImproved(competitionId, groupNumber, submissionGroups);

                // Determine eligible submissions (non-disqualified)
                var eligibleSubmissions = submissionGroups
                    .Where(sg => !sg.Submission.IsDisqualified)
                    .OrderByDescending(sg => sg.Submission.Round1Score)  // Primary ranking by Round1Score
                    .ThenByDescending(sg => sg.FirstPlaceVotes ?? 0)     // Tie-break 1: Most 1st place votes
                    .ThenByDescending(sg => sg.SecondPlaceVotes ?? 0)    // Tie-break 2: Most 2nd place votes
                    .ThenByDescending(sg => sg.ThirdPlaceVotes ?? 0)     // Tie-break 3: Most 3rd place votes
                    .ThenBy(sg => sg.SubmissionId)                       // Final tie-break: Submission ID for consistency
                    .ToList();

                // Update rankings
                for (int i = 0; i < eligibleSubmissions.Count; i++)
                {
                    var sg = eligibleSubmissions[i];
                    sg.RankInGroup = i + 1;
                    await _submissionGroupRepository.UpdateAsync(sg);

                    _logger.LogInformation($"Group {groupNumber} Rank {i + 1}: {sg.Submission.MixTitle} " +
                        $"(Score: {sg.Submission.Round1Score}, 1st: {sg.FirstPlaceVotes}, 2nd: {sg.SecondPlaceVotes}, 3rd: {sg.ThirdPlaceVotes})");
                }

                // UPDATED BUSINESS LOGIC: Set Round 2 voting eligibility for ALL non-disqualified submissions
                foreach (var sg in eligibleSubmissions)
                {
                    var submission = sg.Submission;
                    // ALL non-disqualified submissions are eligible to vote in Round 2
                    submission.IsEligibleForRound2Voting = true;
                    await _submissionRepository.UpdateAsync(submission);
                }

                // UPDATED BUSINESS LOGIC: Top 3 competitors per group advance to Round 2
                var advancingSubmissions = eligibleSubmissions.Take(3).ToList();

                foreach (var sg in advancingSubmissions)
                {
                    var submission = sg.Submission;
                    submission.AdvancedToRound2 = true;
                    // IsEligibleForRound2Voting already set to true above
                    // Round1Score already set in Phase 2

                    await _submissionRepository.UpdateAsync(submission);
                    advancedCount++;

                    _logger.LogInformation($"🏆 GROUP {groupNumber} - RANK {sg.RankInGroup}: {submission.MixTitle} advanced to Round 2 with score {submission.Round1Score}");
                }

                // Mark non-advancing eligible submissions (all except top 3)
                foreach (var sg in eligibleSubmissions.Skip(3))
                {
                    var submission = sg.Submission;
                    submission.AdvancedToRound2 = false;
                    // IsEligibleForRound2Voting remains true (set above) - they can vote in Round 2
                    // Round1Score already set in Phase 2

                    await _submissionRepository.UpdateAsync(submission);
                    _logger.LogInformation($"📉 {submission.MixTitle} eliminated (only top 3 advance) but eligible for Round 2 voting - Score: {submission.Round1Score}");
                }
            }

            return advancedCount;
        }

        /// <summary>
        /// IMPROVED: Calculate vote counts using ALL valid judgments
        /// This ensures we use all available data, not just from "complete" judges
        /// </summary>
        private async Task CalculateVoteCountsForGroupImproved(int competitionId, int groupNumber,
            IEnumerable<SubmissionGroup> submissionGroups)
        {
            // Reset vote counts
            foreach (var sg in submissionGroups)
            {
                sg.FirstPlaceVotes = 0;
                sg.SecondPlaceVotes = 0;
                sg.ThirdPlaceVotes = 0;
            }

            // Get all judges who provided judgments for this group
            var eligibleSubmissionIds = submissionGroups
                .Where(sg => !sg.Submission.IsDisqualified)
                .Select(sg => sg.SubmissionId)
                .ToList();

            // Get all judges who judged submissions in this group
            var judgesInGroup = await _context.SubmissionJudgments
                .Where(sj => sj.CompetitionId == competitionId &&
                           (sj.VotingRound == 1 || sj.VotingRound == null) && // Handle NULL or missing VotingRound
                           sj.IsCompleted == true &&
                           sj.OverallScore.HasValue &&
                           eligibleSubmissionIds.Contains(sj.SubmissionId))
                .Select(sj => sj.JudgeId)
                .Distinct()
                .ToListAsync();

            _logger.LogInformation($"Group {groupNumber}: Found {judgesInGroup.Count} judges who provided judgments");

            foreach (var judgeId in judgesInGroup)
            {
                // Get this judge's judgments for eligible submissions in this group
                var judgeJudgments = await _context.SubmissionJudgments
                    .Where(sj => sj.JudgeId == judgeId &&
                               sj.CompetitionId == competitionId &&
                               (sj.VotingRound == 1 || sj.VotingRound == null) && // Handle NULL or missing VotingRound
                               sj.IsCompleted == true &&
                               sj.OverallScore.HasValue &&
                               eligibleSubmissionIds.Contains(sj.SubmissionId))
                    .OrderByDescending(sj => sj.OverallScore)
                    .ThenBy(sj => sj.SubmissionId)
                    .ToListAsync();

                // Only process if judge has at least one judgment
                if (judgeJudgments.Count > 0)
                {
                    // Assign 1st, 2nd, 3rd place votes based on judge's rankings
                    for (int rank = 0; rank < Math.Min(3, judgeJudgments.Count); rank++)
                    {
                        var judgment = judgeJudgments[rank];
                        var submissionGroup = submissionGroups.First(sg => sg.SubmissionId == judgment.SubmissionId);

                        switch (rank)
                        {
                            case 0: // 1st place
                                submissionGroup.FirstPlaceVotes = (submissionGroup.FirstPlaceVotes ?? 0) + 1;
                                break;
                            case 1: // 2nd place
                                submissionGroup.SecondPlaceVotes = (submissionGroup.SecondPlaceVotes ?? 0) + 1;
                                break;
                            case 2: // 3rd place
                                submissionGroup.ThirdPlaceVotes = (submissionGroup.ThirdPlaceVotes ?? 0) + 1;
                                break;
                        }
                    }

                    _logger.LogDebug($"Judge {judgeId} in Group {groupNumber}: Processed {judgeJudgments.Count} judgments");
                }
            }

            // Update all submission groups with new vote counts
            foreach (var sg in submissionGroups)
            {
                // Update TotalPoints in SubmissionGroups for compatibility
                if (sg.Submission.Round1Score.HasValue)
                {
                    sg.TotalPoints = (int)Math.Round(sg.Submission.Round1Score.Value);
                }

                await _submissionGroupRepository.UpdateAsync(sg);

                if (!sg.Submission.IsDisqualified)
                {
                    _logger.LogInformation($"Group {groupNumber} - {sg.Submission.MixTitle}: " +
                        $"Score={sg.Submission.Round1Score}, " +
                        $"1st={sg.FirstPlaceVotes}, 2nd={sg.SecondPlaceVotes}, 3rd={sg.ThirdPlaceVotes}");
                }
            }
        }

        /// <summary>
        /// Calculate vote counts for a specific group based on judge rankings
        /// </summary>
        private async Task CalculateVoteCountsForGroup(int competitionId, int groupNumber,
            IEnumerable<SubmissionGroup> submissionGroups, List<string> completeJudges)
        {
            // Reset vote counts
            foreach (var sg in submissionGroups)
            {
                sg.FirstPlaceVotes = 0;
                sg.SecondPlaceVotes = 0;
                sg.ThirdPlaceVotes = 0;
            }

            // Get judges assigned to this group
            var groupAssignments = await _round1AssignmentRepository.GetByCompetitionAndGroupAsync(
                competitionId, groupNumber);

            foreach (var assignment in groupAssignments)
            {
                // Only process complete judges
                if (!completeJudges.Contains(assignment.VoterId))
                {
                    _logger.LogDebug($"Judge {assignment.VoterId}: SKIPPED - incomplete judge");
                    continue;
                }

                // Get eligible submission IDs for this group
                var eligibleSubmissionIds = submissionGroups
                    .Where(sg => !sg.Submission.IsDisqualified)
                    .Select(sg => sg.SubmissionId)
                    .ToList();

                // Get this judge's rankings
                var judgeJudgments = await _context.SubmissionJudgments
                    .Where(sj => sj.JudgeId == assignment.VoterId &&
                               sj.CompetitionId == competitionId &&
                               (sj.VotingRound == 1 || sj.VotingRound == null) && // Handle NULL or missing VotingRound
                               sj.IsCompleted == true &&
                               sj.OverallScore.HasValue &&
                               eligibleSubmissionIds.Contains(sj.SubmissionId))
                    .OrderByDescending(sj => sj.OverallScore)
                    .ThenBy(sj => sj.SubmissionId)
                    .ToListAsync();

                // Assign 1st, 2nd, 3rd place votes
                for (int rank = 0; rank < Math.Min(3, judgeJudgments.Count); rank++)
                {
                    var judgment = judgeJudgments[rank];
                    var submissionGroup = submissionGroups.First(sg => sg.SubmissionId == judgment.SubmissionId);

                    switch (rank)
                    {
                        case 0: // 1st place
                            submissionGroup.FirstPlaceVotes = (submissionGroup.FirstPlaceVotes ?? 0) + 1;
                            break;
                        case 1: // 2nd place
                            submissionGroup.SecondPlaceVotes = (submissionGroup.SecondPlaceVotes ?? 0) + 1;
                            break;
                        case 2: // 3rd place
                            submissionGroup.ThirdPlaceVotes = (submissionGroup.ThirdPlaceVotes ?? 0) + 1;
                            break;
                    }
                }
            }

            // Update all submission groups with new vote counts
            foreach (var sg in submissionGroups)
            {
                // Update TotalPoints in SubmissionGroups for compatibility
                if (sg.Submission.Round1Score.HasValue)
                {
                    sg.TotalPoints = (int)Math.Round(sg.Submission.Round1Score.Value);
                }

                await _submissionGroupRepository.UpdateAsync(sg);
            }
        }

        // Helper method to clear existing assignments if we're re-running the setup
        private async Task ClearExistingAssignmentsAsync(int competitionId)
        {
            // Get existing assignments
            var existingAssignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);

            // Check if there are any existing votes to avoid breaking referential integrity
            var hasVotes = await _submissionVoteRepository.HasVotesForCompetitionAsync(competitionId, 1);
            if (hasVotes)
            {
                throw new Exception("Cannot clear existing assignments because votes have already been cast");
            }

            // Clear existing assignments
            foreach (var assignment in existingAssignments)
            {
                await _round1AssignmentRepository.DeleteAsync(assignment.Round1AssignmentId);
            }

            // Clear existing submission groups
            var existingGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            foreach (var group in existingGroups)
            {
                await _submissionGroupRepository.DeleteAsync(group.SubmissionGroupId);
            }
        }

        /// <summary>
        /// BUSINESS RULE: Get list of judges who completed ALL assigned submissions
        /// This ensures fair competition by only counting complete evaluations
        /// </summary>
        private async Task<List<string>> GetCompleteJudgesForCompetitionAsync(int competitionId, CancellationToken cancellationToken = default)
        {
            var completeJudges = new List<string>();

            // Get all judge assignments for this competition
            var allAssignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);

            foreach (var assignment in allAssignments)
            {
                // Get all submissions in the judge's assigned group
                var assignedSubmissions = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                    competitionId, assignment.AssignedGroupNumber);

                var eligibleSubmissionIds = assignedSubmissions
                    .Where(sg => !sg.Submission.IsDisqualified)
                    .Select(sg => sg.SubmissionId)
                    .ToList();

                if (eligibleSubmissionIds.Count == 0)
                {
                    _logger.LogWarning($"Judge {assignment.VoterId}: No eligible submissions in assigned group {assignment.AssignedGroupNumber}");
                    continue;
                }

                // Check if judge completed judgments for ALL eligible submissions
                var completedJudgments = await _context.SubmissionJudgments
                    .Where(sj => sj.JudgeId == assignment.VoterId &&
                               sj.CompetitionId == competitionId &&
                               sj.VotingRound == 1 &&
                               sj.IsCompleted == true &&
                               sj.OverallScore.HasValue &&
                               eligibleSubmissionIds.Contains(sj.SubmissionId))
                    .CountAsync(cancellationToken);

                if (completedJudgments == eligibleSubmissionIds.Count)
                {
                    completeJudges.Add(assignment.VoterId);
                    _logger.LogInformation($"✅ Judge {assignment.VoterId}: COMPLETE - judged all {completedJudgments} assigned submissions in group {assignment.AssignedGroupNumber}");
                }
                else
                {
                    _logger.LogWarning($"❌ Judge {assignment.VoterId}: INCOMPLETE - judged {completedJudgments}/{eligibleSubmissionIds.Count} assigned submissions in group {assignment.AssignedGroupNumber}. Judgments will be excluded from tallying for fair competition.");
                }
            }

            _logger.LogInformation($"📊 Competition {competitionId}: {completeJudges.Count}/{allAssignments.Count()} judges completed all assigned judgments and will be counted in tallying");

            return completeJudges;
        }

        /// <summary>
        /// PHASE 4: Validate tallying results to ensure data integrity
        /// </summary>
        private async Task ValidateTallyingResultsAsync(int competitionId)
        {
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);

            var nullScoreCount = 0;
            var disqualifiedCount = 0;
            var validScoreCount = 0;
            var advancedCount = 0;

            foreach (var submission in allSubmissions)
            {
                if (submission.IsDisqualified)
                {
                    disqualifiedCount++;
                    if (!submission.Round1Score.HasValue || submission.Round1Score.Value != 0)
                    {
                        _logger.LogError($"❌ VALIDATION ERROR: Disqualified submission {submission.SubmissionId} " +
                            $"should have Round1Score = 0, but has {submission.Round1Score}");
                    }
                }
                else
                {
                    if (!submission.Round1Score.HasValue)
                    {
                        nullScoreCount++;
                        _logger.LogError($"❌ VALIDATION ERROR: Non-disqualified submission {submission.SubmissionId} " +
                            $"({submission.MixTitle}) has NULL Round1Score!");
                    }
                    else
                    {
                        validScoreCount++;
                        if (submission.AdvancedToRound2)
                        {
                            advancedCount++;
                        }
                    }
                }
            }

            _logger.LogInformation($"📊 VALIDATION RESULTS for Competition {competitionId}:");
            _logger.LogInformation($"   Total submissions: {allSubmissions.Count()}");
            _logger.LogInformation($"   Disqualified: {disqualifiedCount}");
            _logger.LogInformation($"   Valid scores: {validScoreCount}");
            _logger.LogInformation($"   NULL scores (ERROR): {nullScoreCount}");
            _logger.LogInformation($"   Advanced to Round 2: {advancedCount}");

            if (nullScoreCount > 0)
            {
                _logger.LogError($"❌ CRITICAL: {nullScoreCount} submissions have NULL Round1Score! " +
                    "This indicates a problem with the tallying process.");

                // In production, you might want to throw an exception here
                // throw new Exception($"Tallying validation failed: {nullScoreCount} submissions have NULL scores");
            }
        }

        public async Task<int> DisqualifyNonVotersAsync(int competitionId)
        {
            // Get all non-voters
            var nonVoters = await _round1AssignmentRepository.GetNonVotersAsync(competitionId);
            var disqualifiedCount = 0;

            // Disqualify submissions from non-voters
            foreach (var nonVoter in nonVoters)
            {
                // Get the user's submission
                var submissions = await _submissionRepository.GetByCompetitionIdAndUserIdAsync(
                    competitionId, nonVoter.VoterId);

                foreach (var submission in submissions)
                {
                    submission.IsDisqualified = true;
                    submission.AdvancedToRound2 = false;
                    submission.IsEligibleForRound2Voting = false;
                    submission.Feedback = "Disqualified for not voting in Round 1";

                    await _submissionRepository.UpdateAsync(submission);
                    disqualifiedCount++;
                }
            }

            return disqualifiedCount;
        }
    }
}