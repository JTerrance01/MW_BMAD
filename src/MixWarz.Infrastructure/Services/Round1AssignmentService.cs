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

            // UPDATED APPROACH: Calculate TotalPoints from SubmissionJudgments OverallScore and determine rankings
            // This processes judgment data to calculate scores and vote counts

            // BUSINESS RULE: Get complete judges who finished ALL assigned submissions for fair competition
            var completeJudges = await GetCompleteJudgesForCompetitionAsync(competitionId);

            if (completeJudges.Count == 0)
            {
                _logger.LogWarning($"⚠️ Competition {competitionId}: No judges completed all assigned submissions. Cannot proceed with tallying.");
                throw new Exception("Cannot tally votes: No judges completed all assigned submissions. Tallying requires complete judge evaluations for fair competition.");
            }

            _logger.LogInformation($"📊 Using judgments from {completeJudges.Count} complete judges for tallying");

            // Tally votes for each submission by group
            // First, get all groups
            var groups = await _submissionGroupRepository.GetGroupCountByCompetitionIdAsync(competitionId);
            var advancedCount = 0;

            // Process each group
            for (int groupNumber = 1; groupNumber <= groups; groupNumber++)
            {
                // Get all submissions in this group
                var submissionGroups = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(
                    competitionId, groupNumber);

                // Get all judges for this group (voters assigned to this group)
                var groupAssignments = await _round1AssignmentRepository.GetByCompetitionAndGroupAsync(
                    competitionId, groupNumber);

                // Calculate TotalPoints from SubmissionJudgments for each submission
                foreach (var submissionGroup in submissionGroups)
                {
                    // Reset vote counts before recalculating
                    submissionGroup.FirstPlaceVotes = 0;
                    submissionGroup.SecondPlaceVotes = 0;
                    submissionGroup.ThirdPlaceVotes = 0;

                    // BUSINESS RULE: Get only judgments from complete judges for fair competition
                    var judgments = await _context.SubmissionJudgments
                        .Where(sj => sj.SubmissionId == submissionGroup.SubmissionId &&
                                   sj.CompetitionId == competitionId &&
                                   sj.VotingRound == 1 &&
                                   sj.IsCompleted == true &&
                                   sj.OverallScore.HasValue &&
                                   completeJudges.Contains(sj.JudgeId))  // CRITICAL: Only count complete judges
                        .ToListAsync();

                    // Calculate total points by summing OverallScore from all judgments
                    decimal totalPoints = judgments.Sum(j => j.OverallScore.Value);

                    // Update submission group with tallied scores
                    submissionGroup.TotalPoints = (int)Math.Round(totalPoints);

                    await _submissionGroupRepository.UpdateAsync(submissionGroup);

                    _logger.LogInformation($"Submission {submissionGroup.SubmissionId}: TotalPoints = {submissionGroup.TotalPoints} (from {judgments.Count} complete judge judgments)");
                }

                // Now determine rankings within the group based on TotalPoints and calculate vote counts
                var validSubmissions = submissionGroups
                    .Where(sg => !sg.Submission.IsDisqualified && sg.TotalPoints.HasValue)
                    .OrderByDescending(sg => sg.TotalPoints)  // Rank by total points from judgments
                    .ThenBy(sg => sg.SubmissionId)  // Consistent tie-breaking
                    .ToList();

                // Calculate vote counts based on rankings within each judge's group
                foreach (var assignment in groupAssignments)
                {
                    // FIXED: Get submission IDs for non-disqualified submissions in this group
                    var eligibleSubmissionIds = submissionGroups
                        .Where(sg => !sg.Submission.IsDisqualified)
                        .Select(sg => sg.SubmissionId)
                        .ToList();

                    _logger.LogDebug($"Judge {assignment.VoterId}: Processing {eligibleSubmissionIds.Count} eligible submissions in group {groupNumber}");

                    // BUSINESS RULE: Only process judgments from complete judges for fair competition
                    if (!completeJudges.Contains(assignment.VoterId))
                    {
                        _logger.LogDebug($"Judge {assignment.VoterId}: SKIPPED - incomplete judge, not counting vote assignments");
                        continue;
                    }

                    // Get judgments from this complete judge using simple Contains() operation
                    var judgeJudgments = await _context.SubmissionJudgments
                        .Where(sj => sj.JudgeId == assignment.VoterId &&
                                   sj.CompetitionId == competitionId &&
                                   sj.VotingRound == 1 &&
                                   sj.IsCompleted == true &&
                                   sj.OverallScore.HasValue &&
                                   eligibleSubmissionIds.Contains(sj.SubmissionId))  // Simple Contains() instead of Any()
                        .OrderByDescending(sj => sj.OverallScore)  // Rank by judge's scores
                        .ThenBy(sj => sj.SubmissionId)  // Consistent tie-breaking
                        .ToListAsync();

                    _logger.LogDebug($"Judge {assignment.VoterId}: Found {judgeJudgments.Count} completed judgments");

                    // Assign 1st, 2nd, 3rd place votes based on judge's rankings
                    for (int rank = 0; rank < Math.Min(3, judgeJudgments.Count); rank++)
                    {
                        var judgment = judgeJudgments[rank];
                        var submissionGroup = submissionGroups.First(sg => sg.SubmissionId == judgment.SubmissionId);

                        // Increment vote counts based on ranking
                        switch (rank)
                        {
                            case 0: // 1st place
                                submissionGroup.FirstPlaceVotes = (submissionGroup.FirstPlaceVotes ?? 0) + 1;
                                _logger.LogDebug($"Judge {assignment.VoterId}: 1st place vote for submission {judgment.SubmissionId} (Score: {judgment.OverallScore})");
                                break;
                            case 1: // 2nd place
                                submissionGroup.SecondPlaceVotes = (submissionGroup.SecondPlaceVotes ?? 0) + 1;
                                _logger.LogDebug($"Judge {assignment.VoterId}: 2nd place vote for submission {judgment.SubmissionId} (Score: {judgment.OverallScore})");
                                break;
                            case 2: // 3rd place
                                submissionGroup.ThirdPlaceVotes = (submissionGroup.ThirdPlaceVotes ?? 0) + 1;
                                _logger.LogDebug($"Judge {assignment.VoterId}: 3rd place vote for submission {judgment.SubmissionId} (Score: {judgment.OverallScore})");
                                break;
                        }
                    }
                }

                // IMPROVED: Batch update all submission groups for this group at once
                foreach (var submissionGroup in submissionGroups)
                {
                    await _submissionGroupRepository.UpdateAsync(submissionGroup);
                    _logger.LogInformation($"Updated SubmissionGroup {submissionGroup.SubmissionId}: Points={submissionGroup.TotalPoints}, 1st={submissionGroup.FirstPlaceVotes}, 2nd={submissionGroup.SecondPlaceVotes}, 3rd={submissionGroup.ThirdPlaceVotes}");
                }

                // Final ranking using complete criteria: TotalPoints, then vote counts for tie-breaking
                var rankedSubmissions = validSubmissions
                    .OrderByDescending(sg => sg.TotalPoints)
                    .ThenByDescending(sg => sg.FirstPlaceVotes ?? 0)  // Most 1st place votes wins tie-break
                    .ThenByDescending(sg => sg.SecondPlaceVotes ?? 0)
                    .ThenByDescending(sg => sg.ThirdPlaceVotes ?? 0)
                    .ToList();

                // Update rank in group
                for (int i = 0; i < rankedSubmissions.Count; i++)
                {
                    var sg = rankedSubmissions[i];
                    sg.RankInGroup = i + 1;
                    await _submissionGroupRepository.UpdateAsync(sg);

                    _logger.LogInformation($"Group {groupNumber} Rank {i + 1}: Submission {sg.SubmissionId} " +
                        $"(Points: {sg.TotalPoints}, 1st: {sg.FirstPlaceVotes}, 2nd: {sg.SecondPlaceVotes}, 3rd: {sg.ThirdPlaceVotes})");
                }

                // Top 2 submissions in each group advance to Round 2
                var advancingSubmissions = rankedSubmissions
                    .Where((sg, index) => index < 2 ||
                          // Special case: if tied for 2nd place, both advance
                          (index == 2 &&
                           sg.TotalPoints == rankedSubmissions[1].TotalPoints &&
                           (sg.FirstPlaceVotes ?? 0) == (rankedSubmissions[1].FirstPlaceVotes ?? 0) &&
                           (sg.SecondPlaceVotes ?? 0) == (rankedSubmissions[1].SecondPlaceVotes ?? 0) &&
                           (sg.ThirdPlaceVotes ?? 0) == (rankedSubmissions[1].ThirdPlaceVotes ?? 0)))
                    .ToList();

                // Mark submissions as advancing to Round 2
                foreach (var sg in advancingSubmissions)
                {
                    var submission = sg.Submission;
                    submission.AdvancedToRound2 = true;
                    submission.IsEligibleForRound2Voting = true;
                    submission.Round1Score = sg.TotalPoints;

                    await _submissionRepository.UpdateAsync(submission);
                    advancedCount++;

                    _logger.LogInformation($"Submission {sg.SubmissionId} advanced to Round 2 with score {sg.TotalPoints}");
                }
            }

            // Update competition status to VotingRound2Setup
            competition.Status = CompetitionStatus.VotingRound2Setup;
            await _competitionRepository.UpdateAsync(competition);

            _logger.LogInformation($"Competition {competitionId} tallying complete. {advancedCount} submissions advanced to Round 2");

            return advancedCount;
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
    }
}