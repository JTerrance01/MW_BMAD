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

            // TASK 1: Wrap in a database transaction for atomicity
            // Cast to concrete AppDbContext to access Database property
            var dbContext = _context as Persistence.AppDbContext;
            if (dbContext == null)
            {
                throw new InvalidOperationException("Unable to cast IAppDbContext to AppDbContext for transaction management");
            }

            using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                // PHASE 1: Disqualify submissions from judges who didn't vote
                _logger.LogInformation("Phase 1: Disqualifying submissions from incomplete judges...");
                await DisqualifyIncompleteJudgesSubmissionsAsync(competitionId);

                // PHASE 2: Calculate scores and vote counts for all remaining submissions
                _logger.LogInformation("Phase 2: Calculating scores and vote counts...");
                await ProcessScoresAndVotesAsync(competitionId);

                // PHASE 3: Determine advancement based on the calculated scores and votes
                _logger.LogInformation("Phase 3: Determining advancement to Round 2...");
                var advancedCount = await ProcessVoteCountsAndAdvancementAsync(competitionId);

                // PHASE 3.5: Update Round 2 voting eligibility based on Round 1 participation
                _logger.LogInformation("Phase 3.5: Updating Round 2 voting eligibility...");
                await UpdateRound2VotingEligibilityAsync(competitionId);

                // PHASE 4: Final validation
                _logger.LogInformation("Phase 4: Validating tallying results...");
                await ValidateTallyingResultsAsync(competitionId);

                // Update competition status to complete the process
                competition.Status = CompetitionStatus.VotingRound2Setup;
                await _competitionRepository.UpdateAsync(competition);

                _logger.LogInformation($"✅ Competition {competitionId} tallying complete. {advancedCount} submissions advanced to Round 2.");

                // If everything is successful, commit the transaction
                await transaction.CommitAsync();

                return advancedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "A critical error occurred during Round 1 vote tallying for competition {CompetitionId}. Rolling back changes.", competitionId);
                await transaction.RollbackAsync();
                throw; // Re-throw the exception to signal failure
            }
        }

        /// <summary>
        /// PHASE 1: Disqualify submissions from judges who didn't complete their judging duties
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
                    _logger.LogInformation($"Judge {assignment.VoterId}: No eligible submissions in assigned group.");
                    continue;
                }

                if (!assignment.HasVoted)
                {
                    // Judge did not complete their assignment, disqualify all their submissions
                    var userSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId, 1, 1000);
                    var userSubmissionIds = userSubmissions.Where(s => s.UserId == assignment.VoterId && !s.IsDisqualified)
                        .Select(s => s.SubmissionId).ToList();

                    foreach (var submissionId in userSubmissionIds)
                    {
                        var submission = userSubmissions.FirstOrDefault(s => s.SubmissionId == submissionId);
                        if (submission != null)
                        {
                            submission.IsDisqualified = true;
                            await _submissionRepository.UpdateAsync(submission);
                            disqualifiedCount++;
                            _logger.LogInformation($"Disqualified submission {submissionId} for incomplete judge {assignment.VoterId}");
                        }
                    }
                    incompleteJudges.Add(assignment.VoterId);
                }
            }

            _logger.LogInformation($"Phase 1 complete: Disqualified {disqualifiedCount} submissions from {incompleteJudges.Count} incomplete judges.");
            return disqualifiedCount;
        }

        public async Task<int> DisqualifyNonVotersAsync(int competitionId)
        {
            // Public wrapper for admin/manual disqualification
            return await DisqualifyIncompleteJudgesSubmissionsAsync(competitionId);
        }

        /// <summary>
        /// PHASE 2: Calculate scores and vote counts from SubmissionVote table
        /// Uses SubmissionVote as the single source of truth for all calculations
        /// </summary>
        private async Task ProcessScoresAndVotesAsync(int competitionId)
        {
            _logger.LogInformation("🗳️ Starting vote aggregation from SubmissionVote table for competition {CompetitionId}", competitionId);

            // Get all submissions for the competition (excluding already disqualified ones)
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId, 1, 1000);
            var eligibleSubmissions = allSubmissions.Where(s => !s.IsDisqualified).ToList();

            if (!eligibleSubmissions.Any())
            {
                _logger.LogWarning("⚠️ No eligible submissions found for competition {CompetitionId}", competitionId);
                return;
            }

            // Get all Round 1 votes from SubmissionVote table (source of truth)
            var allVotes = await _submissionVoteRepository.GetByCompetitionIdAsync(competitionId, 1, 1, 10000);
            _logger.LogInformation("📊 Found {VoteCount} total Round 1 votes in SubmissionVote table", allVotes.Count());

            // Group votes by submission
            var votesBySubmission = allVotes.GroupBy(v => v.SubmissionId).ToList();
            _logger.LogInformation("📈 Votes distributed across {SubmissionCount} submissions", votesBySubmission.Count);

            // Get submission groups for updating vote counts
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            var groupLookup = submissionGroups.ToDictionary(sg => sg.SubmissionId, sg => sg);

            // Process each submission's votes
            int processedSubmissions = 0;
            int submissionsWithVotes = 0;

            foreach (var submission in eligibleSubmissions)
            {
                var submissionVotes = votesBySubmission.FirstOrDefault(g => g.Key == submission.SubmissionId);

                if (submissionVotes != null && submissionVotes.Any())
                {
                    // Calculate aggregated data from votes
                    int totalPoints = submissionVotes.Sum(v => v.Points);
                    int firstPlaceVotes = submissionVotes.Count(v => v.Rank == 1);
                    int secondPlaceVotes = submissionVotes.Count(v => v.Rank == 2);
                    int thirdPlaceVotes = submissionVotes.Count(v => v.Rank == 3);

                    // Update submission's Round1Score
                    submission.Round1Score = totalPoints;
                    await _submissionRepository.UpdateAsync(submission);

                    // Update SubmissionGroup with vote counts if it exists
                    if (groupLookup.TryGetValue(submission.SubmissionId, out var submissionGroup))
                    {
                        submissionGroup.TotalPoints = totalPoints;
                        submissionGroup.FirstPlaceVotes = firstPlaceVotes;
                        submissionGroup.SecondPlaceVotes = secondPlaceVotes;
                        submissionGroup.ThirdPlaceVotes = thirdPlaceVotes;
                        await _submissionGroupRepository.UpdateAsync(submissionGroup);
                    }

                    submissionsWithVotes++;
                    _logger.LogDebug("✅ Submission {SubmissionId}: {TotalPoints} points " +
                        "(1st: {First}, 2nd: {Second}, 3rd: {Third})",
                        submission.SubmissionId, totalPoints, firstPlaceVotes, secondPlaceVotes, thirdPlaceVotes);
                }
                else
                {
                    // No votes received - set score to 0 (but don't disqualify)
                    submission.Round1Score = 0;
                    await _submissionRepository.UpdateAsync(submission);

                    // Update SubmissionGroup to reflect no votes
                    if (groupLookup.TryGetValue(submission.SubmissionId, out var submissionGroup))
                    {
                        submissionGroup.TotalPoints = 0;
                        submissionGroup.FirstPlaceVotes = 0;
                        submissionGroup.SecondPlaceVotes = 0;
                        submissionGroup.ThirdPlaceVotes = 0;
                        await _submissionGroupRepository.UpdateAsync(submissionGroup);
                    }

                    _logger.LogDebug("📉 Submission {SubmissionId}: No votes received", submission.SubmissionId);
                }

                processedSubmissions++;
            }

            _logger.LogInformation("✅ Phase 2 complete: Processed {ProcessedCount} submissions, " +
                "{WithVotesCount} received votes", processedSubmissions, submissionsWithVotes);

            // Log vote distribution statistics for audit
            var uniqueVoters = allVotes.Select(v => v.VoterId).Distinct().Count();
            var avgVotesPerSubmission = submissionsWithVotes > 0 ? (double)allVotes.Count() / submissionsWithVotes : 0;

            _logger.LogInformation("📊 Vote Statistics: {UniqueVoters} unique voters cast {TotalVotes} votes " +
                "(avg {AvgVotes:F1} votes per submission with votes)",
                uniqueVoters, allVotes.Count(), avgVotesPerSubmission);
        }

        /// <summary>
        /// PHASE 3: Determine advancement based on scores within each group
        /// </summary>
        private async Task<int> ProcessVoteCountsAndAdvancementAsync(int competitionId)
        {
            _logger.LogInformation("🏁 Starting advancement determination for competition {CompetitionId}", competitionId);

            // Get competition to check advancement count configuration
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new InvalidOperationException($"Competition {competitionId} not found");
            }

            // Fix for CS0019: Operator '??' cannot be applied to operands of type 'int' and 'int'
            // The issue occurs because the `??` operator is used to provide a default value for nullable types.
            // Since `competition.Round1AdvancementCount` is not nullable, the `??` operator cannot be applied.
            // The fix is to use a conditional check instead.

            int advancementPerGroup = competition.Round1AdvancementCount != 0 ? competition.Round1AdvancementCount : 3;
            _logger.LogInformation("📌 Advancement configuration: Top {Count} from each group advance to Round 2", advancementPerGroup);

            // Get all submission groups
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            var groupNumbers = submissionGroups.Select(sg => sg.GroupNumber).Distinct().OrderBy(g => g).ToList();

            if (!groupNumbers.Any())
            {
                _logger.LogWarning("⚠️ No submission groups found for competition {CompetitionId}", competitionId);
                return 0;
            }

            _logger.LogInformation("🎯 Processing {GroupCount} groups for advancement", groupNumbers.Count);

            int totalAdvanced = 0;
            var advancementLog = new List<string>();
            var groupAdvancementSummary = new Dictionary<int, int>(); // Track advancement per group

            // Process each group
            foreach (var groupNumber in groupNumbers)
            {
                var groupSubmissions = submissionGroups
                    .Where(sg => sg.GroupNumber == groupNumber)
                    .OrderByDescending(sg => sg.TotalPoints ?? 0)
                    .ThenByDescending(sg => sg.FirstPlaceVotes ?? 0)
                    .ThenByDescending(sg => sg.SecondPlaceVotes ?? 0)
                    .ThenByDescending(sg => sg.ThirdPlaceVotes ?? 0)
                    .ThenBy(sg => sg.SubmissionId) // Consistent tie-breaker
                    .ToList();

                _logger.LogInformation("📊 Group {GroupNumber}: {SubmissionCount} submissions",
                    groupNumber, groupSubmissions.Count);

                int groupAdvancedCount = 0;

                // Assign ranks within group
                for (int i = 0; i < groupSubmissions.Count; i++)
                {
                    var submissionGroup = groupSubmissions[i];
                    submissionGroup.RankInGroup = i + 1;
                    await _submissionGroupRepository.UpdateAsync(submissionGroup);

                    // Mark top N for advancement
                    if (i < advancementPerGroup && !submissionGroup.Submission.IsDisqualified)
                    {
                        submissionGroup.Submission.AdvancedToRound2 = true;
                        await _submissionRepository.UpdateAsync(submissionGroup.Submission);
                        totalAdvanced++;
                        groupAdvancedCount++;

                        advancementLog.Add($"Group {groupNumber}, Rank {i + 1}: " +
                            $"Submission {submissionGroup.SubmissionId} " +
                            $"({submissionGroup.TotalPoints ?? 0} points)");

                        _logger.LogDebug("✅ ADVANCED: Group {Group}, Rank {Rank}, Submission {Id}, Score {Score}",
                            groupNumber, i + 1, submissionGroup.SubmissionId, submissionGroup.TotalPoints ?? 0);
                    }
                    else
                    {
                        // Ensure non-advancing submissions are marked correctly
                        submissionGroup.Submission.AdvancedToRound2 = false;
                        await _submissionRepository.UpdateAsync(submissionGroup.Submission);

                        _logger.LogDebug("❌ NOT ADVANCED: Group {Group}, Rank {Rank}, Submission {Id}, Score {Score}",
                            groupNumber, i + 1, submissionGroup.SubmissionId, submissionGroup.TotalPoints ?? 0);
                    }
                }

                groupAdvancementSummary[groupNumber] = groupAdvancedCount;

                // Log group results
                var groupAdvanced = Math.Min(advancementPerGroup,
                    groupSubmissions.Count(sg => !sg.Submission.IsDisqualified));
                _logger.LogInformation("✅ Group {GroupNumber}: {AdvancedCount} submissions advanced to Round 2 " +
                    "(Target: {Target}, Actual: {Actual})",
                    groupNumber, groupAdvanced, advancementPerGroup, groupAdvancedCount);
            }

            // Log comprehensive advancement summary
            _logger.LogInformation("🎯 ADVANCEMENT SUMMARY BY GROUP:");
            foreach (var kvp in groupAdvancementSummary)
            {
                _logger.LogInformation("   - Group {Group}: {Count} advanced", kvp.Key, kvp.Value);
            }

            // Log all advancements for audit trail
            _logger.LogInformation("🎯 Detailed Advancement List:\n{AdvancementDetails}",
                string.Join("\n", advancementLog));

            _logger.LogInformation("✅ Phase 3 complete: {TotalAdvanced} submissions advanced to Round 2 " +
                "across {GroupCount} groups (Expected per group: {ExpectedPerGroup})",
                totalAdvanced, groupNumbers.Count, advancementPerGroup);

            // Verify the total matches expectations
            var expectedTotal = groupNumbers.Count * advancementPerGroup;
            if (totalAdvanced < expectedTotal)
            {
                _logger.LogWarning("⚠️ ADVANCEMENT MISMATCH: Expected {Expected} total advancements " +
                    "({Groups} groups × {PerGroup} per group), but only {Actual} were advanced. " +
                    "This might be due to insufficient eligible submissions in some groups.",
                    expectedTotal, groupNumbers.Count, advancementPerGroup, totalAdvanced);
            }

            // Double-check: Query the database to verify AdvancedToRound2 flags
            var allSubmissionsAfterUpdate = await _submissionRepository.GetByCompetitionIdAsync(competitionId, 1, 1000);
            var advancedInDb = allSubmissionsAfterUpdate.Count(s => s.AdvancedToRound2);

            _logger.LogInformation("🔍 VERIFICATION: Database shows {DbCount} submissions with AdvancedToRound2 = true " +
                "(Process marked {ProcessCount} for advancement)",
                advancedInDb, totalAdvanced);

            if (advancedInDb != totalAdvanced)
            {
                _logger.LogError("❌ DATABASE MISMATCH: Process marked {ProcessCount} for advancement " +
                    "but database shows {DbCount} with AdvancedToRound2 = true!",
                    totalAdvanced, advancedInDb);
            }

            return totalAdvanced;
        }

        /// <summary>
        /// PHASE 4: Validate tallying results for consistency and completeness
        /// </summary>
        private async Task ValidateTallyingResultsAsync(int competitionId)
        {
            _logger.LogInformation("🔍 Starting validation of Round 1 tallying results for competition {CompetitionId}", competitionId);

            var validationErrors = new List<string>();

            // Get all submissions
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId, 1, 1000);
            var nonDisqualified = allSubmissions.Where(s => !s.IsDisqualified).ToList();

            // Validation 1: All non-disqualified submissions should have a Round1Score
            var missingScoredSubmissions = nonDisqualified.Where(s => !s.Round1Score.HasValue).ToList();
            if (missingScoredSubmissions.Any())
            {
                validationErrors.Add($"❌ {missingScoredSubmissions.Count} non-disqualified submissions missing Round1Score");
                foreach (var submission in missingScoredSubmissions.Take(5))
                {
                    _logger.LogError("Missing Round1Score: Submission {SubmissionId} ({Title})",
                        submission.SubmissionId, submission.MixTitle);
                }
            }

            // Validation 2: Check advancement consistency
            var advancedSubmissions = allSubmissions.Where(s => s.AdvancedToRound2).ToList();
            var eligibleForRound2 = allSubmissions.Where(s => s.IsEligibleForRound2Voting).ToList();

            _logger.LogInformation("📊 Advancement Statistics:");
            _logger.LogInformation("   - Total advanced to Round 2: {Count}", advancedSubmissions.Count);
            _logger.LogInformation("   - Advanced submission IDs: {Ids}",
                string.Join(", ", advancedSubmissions.Select(s => s.SubmissionId)));

            // Check advancement per group
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            var advancementByGroup = submissionGroups
                .Where(sg => sg.Submission.AdvancedToRound2)
                .GroupBy(sg => sg.GroupNumber)
                .Select(g => new { Group = g.Key, Count = g.Count() })
                .OrderBy(g => g.Group);

            foreach (var group in advancementByGroup)
            {
                _logger.LogInformation("   - Group {Group}: {Count} advanced", group.Group, group.Count);
            }

            if (advancedSubmissions.Count != eligibleForRound2.Count)
            {
                validationErrors.Add($"❌ Mismatch: {advancedSubmissions.Count} AdvancedToRound2 " +
                    $"but {eligibleForRound2.Count} IsEligibleForRound2Voting");
            }

            // Validation 3: No disqualified submissions should have advanced
            var disqualifiedAdvanced = allSubmissions
                .Where(s => s.IsDisqualified && s.AdvancedToRound2).ToList();
            if (disqualifiedAdvanced.Any())
            {
                validationErrors.Add($"❌ {disqualifiedAdvanced.Count} disqualified submissions marked as advanced");
            }

            // Validation 4: Check group rankings consistency
            var groupNumbers = submissionGroups.Select(sg => sg.GroupNumber).Distinct().ToList();

            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            int expectedAdvancementPerGroup = competition?.Round1AdvancementCount ?? 3;

            foreach (var groupNumber in groupNumbers)
            {
                var groupSubs = submissionGroups.Where(sg => sg.GroupNumber == groupNumber).ToList();
                var advancedInGroup = groupSubs.Count(sg => sg.Submission.AdvancedToRound2);
                var eligibleInGroup = groupSubs.Count(sg => !sg.Submission.IsDisqualified);

                var expectedAdvanced = Math.Min(expectedAdvancementPerGroup, eligibleInGroup);
                if (advancedInGroup != expectedAdvanced && eligibleInGroup >= expectedAdvanced)
                {
                    validationErrors.Add($"❌ Group {groupNumber}: Expected {expectedAdvanced} to advance, " +
                        $"but {advancedInGroup} actually advanced");
                }
            }

            // Validation 5: Score and vote count correlation
            var voteCounts = await _submissionVoteRepository.GetByCompetitionIdAsync(competitionId, 1, 1, 10000);
            var votesBySubmission = voteCounts.GroupBy(v => v.SubmissionId).ToList();

            foreach (var submissionVotes in votesBySubmission)
            {
                var expectedScore = submissionVotes.Sum(v => v.Points);
                var submission = allSubmissions.FirstOrDefault(s => s.SubmissionId == submissionVotes.Key);

                if (submission != null && submission.Round1Score != expectedScore)
                {
                    validationErrors.Add($"❌ Submission {submission.SubmissionId}: " +
                        $"Expected score {expectedScore} but has {submission.Round1Score}");
                }
            }
            // Validation 6: Check Round 2 voting eligibility consistency
            var round1Voters = voteCounts.Select(v => v.VoterId).Distinct().ToHashSet();
            var round1Assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
            var round1Participants = round1Assignments
                .Where(ra => ra.HasVoted)
                .Select(ra => ra.VoterId)
                .ToHashSet();

            foreach (var submission in nonDisqualified)
            {
                bool shouldBeEligible = round1Participants.Contains(submission.UserId);
                if (submission.IsEligibleForRound2Voting != shouldBeEligible)
                {
                    validationErrors.Add($"❌ Submission {submission.SubmissionId} (User {submission.UserId}): " +
                        $"IsEligibleForRound2Voting={submission.IsEligibleForRound2Voting} but should be {shouldBeEligible}");
                }
            }

            // Log validation results
            if (validationErrors.Any())
            {
                _logger.LogError("❌ Validation failed with {ErrorCount} errors:\n{Errors}",
                    validationErrors.Count, string.Join("\n", validationErrors));

                // In production, you might want to throw an exception here
                // throw new InvalidOperationException($"Round 1 tallying validation failed with {validationErrors.Count} errors");
            }
            else
            {
                _logger.LogInformation("✅ Phase 4 complete: All validations passed successfully!");

                // Log summary statistics
                _logger.LogInformation("📊 Final Round 1 Results Summary:");
                _logger.LogInformation("   - Total submissions: {Total}", allSubmissions.Count());
                _logger.LogInformation("   - Disqualified: {Disqualified}", allSubmissions.Count(s => s.IsDisqualified));
                _logger.LogInformation("   - Advanced to Round 2: {Advanced}", advancedSubmissions.Count);
                _logger.LogInformation("   - Eligible for Round 2 voting: {EligibleVoters}",
                    allSubmissions.Count(s => s.IsEligibleForRound2Voting));
                _logger.LogInformation("   - Groups processed: {Groups}", groupNumbers.Count);
                _logger.LogInformation("   - Unique voters: {Voters}", voteCounts.Select(v => v.VoterId).Distinct().Count());
            }
        }

        /// <summary>
        /// PHASE 3.5: Update Round 2 voting eligibility based on Round 1 participation
        /// Business Rule: Any user who participated in Round 1 voting is eligible to vote in Round 2
        /// </summary>
        private async Task UpdateRound2VotingEligibilityAsync(int competitionId)
        {
            _logger.LogInformation("🗳️ Starting Round 2 voting eligibility update for competition {CompetitionId}", competitionId);

            // Get all Round 1 assignments to identify who voted
            var round1Assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
            var votersWhoParticipated = round1Assignments
                .Where(ra => ra.HasVoted)
                .Select(ra => ra.VoterId)
                .ToHashSet();

            _logger.LogInformation("📊 Found {VoterCount} users who participated in Round 1 voting", votersWhoParticipated.Count);

            // Get all submissions for the competition
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId, 1, 1000);

            int eligibleCount = 0;
            int ineligibleCount = 0;

            foreach (var submission in allSubmissions)
            {
                // Business Rule: User is eligible for Round 2 voting if:
                // 1. They participated in Round 1 voting (HasVoted = true)
                // 2. Their submission is not disqualified
                bool isEligible = votersWhoParticipated.Contains(submission.UserId) && !submission.IsDisqualified;

                submission.IsEligibleForRound2Voting = isEligible;
                await _submissionRepository.UpdateAsync(submission);

                if (isEligible)
                {
                    eligibleCount++;
                    _logger.LogDebug("✅ User {UserId} (Submission {SubmissionId}) is eligible for Round 2 voting",
                        submission.UserId, submission.SubmissionId);
                }
                else
                {
                    ineligibleCount++;
                    if (submission.IsDisqualified)
                    {
                        _logger.LogDebug("❌ User {UserId} (Submission {SubmissionId}) is NOT eligible - disqualified",
                            submission.UserId, submission.SubmissionId);
                    }
                    else if (!votersWhoParticipated.Contains(submission.UserId))
                    {
                        _logger.LogDebug("❌ User {UserId} (Submission {SubmissionId}) is NOT eligible - did not vote in Round 1",
                            submission.UserId, submission.SubmissionId);
                    }
                }
            }

            _logger.LogInformation("✅ Phase 3.5 complete: {EligibleCount} users eligible for Round 2 voting, " +
                "{IneligibleCount} not eligible", eligibleCount, ineligibleCount);

            // Log summary by category
            var disqualifiedCount = allSubmissions.Count(s => s.IsDisqualified);
            var nonVotersCount = allSubmissions.Count(s => !votersWhoParticipated.Contains(s.UserId) && !s.IsDisqualified);

            _logger.LogInformation("📋 Eligibility Summary:");
            _logger.LogInformation("   - Eligible (voted in Round 1 & not disqualified): {Eligible}", eligibleCount);
            _logger.LogInformation("   - Ineligible due to disqualification: {Disqualified}", disqualifiedCount);
            _logger.LogInformation("   - Ineligible due to not voting in Round 1: {NonVoters}", nonVotersCount);
        }

        private async Task ClearExistingAssignmentsAsync(int competitionId)
        {
            // Remove all Round1Assignment records for this competition
            var assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
            foreach (var assignment in assignments)
            {
                await _round1AssignmentRepository.DeleteAsync(assignment.Round1AssignmentId);
            }
            // Remove all SubmissionGroup records for this competition
            var groups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            foreach (var group in groups)
            {
                await _submissionGroupRepository.DeleteAsync(group.SubmissionGroupId);
            }
        }
    }
}