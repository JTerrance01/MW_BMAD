using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Persistence;

namespace MixWarz.Infrastructure.Services
{
    /// <summary>
    /// Service for managing the lifecycle of Hybrid Fair-Play Tournaments
    /// </summary>
    public class TournamentLifecycleService : ITournamentLifecycleService
    {
        private readonly IAppDbContext _context;
        private readonly ISubmissionAssignmentService _submissionAssignmentService;
        private readonly IJudgingService _judgingService;
        private readonly IJudgingProwessCalculator _judgingProwessCalculator;
        private readonly ILogger<TournamentLifecycleService> _logger;

        public TournamentLifecycleService(
            IAppDbContext context,
            ISubmissionAssignmentService submissionAssignmentService,
            IJudgingService judgingService,
            IJudgingProwessCalculator judgingProwessCalculator,
            ILogger<TournamentLifecycleService> logger)
        {
            _context = context;
            _submissionAssignmentService = submissionAssignmentService;
            _judgingService = judgingService;
            _judgingProwessCalculator = judgingProwessCalculator;
            _logger = logger;
        }

        /// <summary>
        /// Starts the universal judging phase for a competition
        /// </summary>
        public async Task<int> StartUniversalJudging(int competitionId)
        {
            _logger.LogInformation("🚀 Starting Universal Judging for competition {CompetitionId}", competitionId);

            // Cast to concrete AppDbContext to access Database property for transactions
            var dbContext = _context as AppDbContext;
            if (dbContext == null)
            {
                throw new InvalidOperationException("Unable to cast IAppDbContext to AppDbContext for transaction management");
            }

            using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                // Get the competition and verify it exists
                var competition = await _context.Competitions
                    .FirstOrDefaultAsync(c => c.CompetitionId == competitionId);

                if (competition == null)
                {
                    throw new ArgumentException($"Competition with ID {competitionId} not found", nameof(competitionId));
                }

                // Verify competition is in the correct state for starting judging
                if (competition.Status != CompetitionStatus.OpenForSubmissions && competition.Status != CompetitionStatus.InJudging)
                {
                    throw new InvalidOperationException(
                        $"Competition must be in OpenForSubmissions or InJudging status to start/manage judging. Current status: {competition.Status}");
                }

                // If already in judging, check if assignments already exist
                if (competition.Status == CompetitionStatus.InJudging)
                {
                    var existingAssignments = await _context.Judgements
                        .Include(j => j.Submission)
                        .Where(j => j.Submission.CompetitionId == competitionId)
                        .CountAsync();

                    if (existingAssignments > 0)
                    {
                        _logger.LogInformation("⚠️ Competition {CompetitionId} already has {ExistingCount} judging assignments",
                            competitionId, existingAssignments);
                        return existingAssignments;
                    }
                }

                _logger.LogInformation("✅ Competition {CompetitionId} verified and ready for judging phase", competitionId);

                // Get all submitted submissions for validation
                var submissions = await _context.Submissions
                    .Where(s => s.CompetitionId == competitionId && s.Status == SubmissionStatus.Submitted)
                    .ToListAsync();

                if (submissions.Count < 2)
                {
                    throw new InvalidOperationException(
                        $"Cannot start judging: competition {competitionId} needs at least 2 submissions, found {submissions.Count}");
                }

                _logger.LogInformation("📄 Found {SubmissionCount} submissions ready for judging", submissions.Count);

                // Create judging assignments using the existing SubmissionAssignmentService
                var assignmentsCreated = await _submissionAssignmentService.CreateAssignments(competitionId);

                _logger.LogInformation("📋 Created {AssignmentCount} judging assignments", assignmentsCreated);

                // The SubmissionAssignmentService already updates competition status to InJudging
                // and submission statuses to AwaitingJudging, so we don't need to do that here

                // Commit the transaction
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Successfully started Universal Judging for competition {CompetitionId}. " +
                    "{AssignmentCount} judging assignments created.", competitionId, assignmentsCreated);

                return assignmentsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to start Universal Judging for competition {CompetitionId}. Rolling back changes.", competitionId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Tallies the results of universal judging and determines which submissions advance
        /// </summary>
        public async Task<IEnumerable<int>> TallyUniversalJudgingResults(int competitionId, int advancementCount = 3)
        {
            _logger.LogInformation("🔄 Starting Universal Judging result tallying for competition {CompetitionId}", competitionId);

            // Cast to concrete AppDbContext to access Database property for transactions
            var dbContext = _context as AppDbContext;
            if (dbContext == null)
            {
                throw new InvalidOperationException("Unable to cast IAppDbContext to AppDbContext for transaction management");
            }

            using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                // Get the competition and verify it exists
                var competition = await _context.Competitions
                    .FirstOrDefaultAsync(c => c.CompetitionId == competitionId);

                if (competition == null)
                {
                    throw new ArgumentException($"Competition with ID {competitionId} not found", nameof(competitionId));
                }

                // Verify competition is in the correct state for tallying
                if (competition.Status != CompetitionStatus.InJudging)
                {
                    throw new InvalidOperationException(
                        $"Competition must be in InJudging status to tally results. Current status: {competition.Status}");
                }

                _logger.LogInformation("✅ Competition {CompetitionId} verified and ready for result tallying", competitionId);

                // PHASE 1: Calculate final scores for all submissions
                _logger.LogInformation("Phase 1: Calculating final scores from judgements...");
                await CalculateFinalScoresAsync(competitionId);

                // PHASE 2: Determine advancement based on calculated scores
                _logger.LogInformation("Phase 2: Determining advancement to finals...");
                var advancedSubmissionIds = await DetermineAdvancementAsync(competitionId, advancementCount);

                // PHASE 3: Update submission statuses
                _logger.LogInformation("Phase 3: Updating submission statuses...");
                await UpdateSubmissionStatusesAsync(competitionId, advancedSubmissionIds);

                // PHASE 4: Calculate judging prowess scores
                _logger.LogInformation("Phase 4: Calculating judging prowess scores...");
                await CalculateJudgingProwessAsync(competitionId);

                // PHASE 5: Validation
                _logger.LogInformation("Phase 5: Validating tallying results...");
                await ValidateResultsAsync(competitionId, advancedSubmissionIds);

                // Update competition status to complete the universal judging phase
                competition.Status = CompetitionStatus.Completed; // In a real system, this might be another status like "FinalsReady"
                await _context.SaveChangesAsync(CancellationToken.None);

                // Commit the transaction
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Successfully tallied Universal Judging results for competition {CompetitionId}. " +
                    "{AdvancedCount} submissions advanced to finals.", competitionId, advancedSubmissionIds.Count());

                return advancedSubmissionIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to tally Universal Judging results for competition {CompetitionId}. Rolling back changes.", competitionId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Gets the current lifecycle status for a competition
        /// </summary>
        public async Task<TournamentLifecycleStatus> GetLifecycleStatus(int competitionId)
        {
            _logger.LogInformation("📊 Getting lifecycle status for competition {CompetitionId}", competitionId);

            // Get competition
            var competition = await _context.Competitions
                .FirstOrDefaultAsync(c => c.CompetitionId == competitionId);

            if (competition == null)
            {
                throw new ArgumentException($"Competition with ID {competitionId} not found", nameof(competitionId));
            }

            // Get submission statistics
            var submissions = await _context.Submissions
                .Where(s => s.CompetitionId == competitionId)
                .ToListAsync();

            var totalSubmissions = submissions.Count;
            var awaitingJudging = submissions.Count(s => s.Status == SubmissionStatus.AwaitingJudging);

            // Get judging statistics
            var allJudgements = await _context.Judgements
                .Include(j => j.Submission)
                .Where(j => j.Submission.CompetitionId == competitionId)
                .ToListAsync();

            var totalAssignments = allJudgements.Count;
            var completedJudgements = allJudgements.Count(j => j.IsCompleted);

            var judgingProgress = totalAssignments > 0 ? (double)completedJudgements / totalAssignments * 100 : 0;

            // Determine capabilities
            var canStartJudging = competition.Status == CompetitionStatus.OpenForSubmissions && totalSubmissions >= 2;
            var canTallyResults = competition.Status == CompetitionStatus.InJudging &&
                                 judgingProgress > 80; // Require at least 80% completion

            // Determine current and next phases
            var currentPhase = GetCurrentPhase(competition.Status);
            var nextPhase = GetNextPhase(competition.Status);

            return new TournamentLifecycleStatus
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                CurrentPhase = currentPhase,
                TotalSubmissions = totalSubmissions,
                JudgingAssignments = totalAssignments,
                CompletedJudgements = completedJudgements,
                JudgingProgress = judgingProgress,
                CanStartJudging = canStartJudging,
                CanTallyResults = canTallyResults,
                PhaseStartedAt = competition.StartDate,
                NextPhase = nextPhase
            };
        }

        #region Private Methods

        /// <summary>
        /// PHASE 1: Calculate final scores for all submissions based on judgements
        /// </summary>
        private async Task CalculateFinalScoresAsync(int competitionId)
        {
            _logger.LogInformation("🧮 Calculating final scores from judgements for competition {CompetitionId}", competitionId);

            // Get all submissions for the competition
            var submissions = await _context.Submissions
                .Where(s => s.CompetitionId == competitionId && s.Status == SubmissionStatus.AwaitingJudging)
                .ToListAsync();

            if (!submissions.Any())
            {
                _logger.LogWarning("⚠️ No submissions in AwaitingJudging status found for competition {CompetitionId}", competitionId);
                return;
            }

            var submissionScores = new Dictionary<int, (double averageScore, int judgementCount)>();

            // Calculate average scores for each submission
            foreach (var submission in submissions)
            {
                var judgements = await _context.Judgements
                    .Where(j => j.SubmissionId == submission.SubmissionId && j.Score > 0)
                    .ToListAsync();

                if (judgements.Any())
                {
                    var averageScore = judgements.Average(j => j.Score);
                    submissionScores[submission.SubmissionId] = (averageScore, judgements.Count);

                    _logger.LogDebug("📊 Submission {SubmissionId}: {JudgementCount} judgements, average score {AverageScore:F2}",
                        submission.SubmissionId, judgements.Count, averageScore);
                }
                else
                {
                    submissionScores[submission.SubmissionId] = (0, 0);
                    _logger.LogDebug("📊 Submission {SubmissionId}: No judgements received", submission.SubmissionId);
                }
            }

            _logger.LogInformation("✅ Phase 1 complete: Calculated scores for {SubmissionCount} submissions", submissionScores.Count);
        }

        /// <summary>
        /// PHASE 2: Determine which submissions advance based on scores
        /// </summary>
        private async Task<List<int>> DetermineAdvancementAsync(int competitionId, int advancementCount)
        {
            _logger.LogInformation("🎯 Determining top {AdvancementCount} submissions for advancement", advancementCount);

            // Get all judgements for the competition to calculate final scores
            var submissionScores = await _context.Judgements
                .Include(j => j.Submission)
                .Where(j => j.Submission.CompetitionId == competitionId && j.Score > 0)
                .GroupBy(j => j.SubmissionId)
                .Select(g => new
                {
                    SubmissionId = g.Key,
                    AverageScore = g.Average(j => j.Score),
                    JudgementCount = g.Count()
                })
                .OrderByDescending(s => s.AverageScore)
                .ThenByDescending(s => s.JudgementCount) // Tie-breaker: more judgements wins
                .ThenBy(s => s.SubmissionId) // Final tie-breaker for consistency
                .ToListAsync();

            var advancedSubmissionIds = submissionScores
                .Take(advancementCount)
                .Select(s => s.SubmissionId)
                .ToList();

            _logger.LogInformation("📋 Advancement Results:");
            for (int i = 0; i < Math.Min(advancementCount, submissionScores.Count); i++)
            {
                var score = submissionScores[i];
                _logger.LogInformation("   #{Rank}: Submission {SubmissionId} - Score: {AverageScore:F2} ({JudgementCount} judgements)",
                    i + 1, score.SubmissionId, score.AverageScore, score.JudgementCount);
            }

            return advancedSubmissionIds;
        }

        /// <summary>
        /// PHASE 3: Update submission statuses based on advancement results
        /// </summary>
        private async Task UpdateSubmissionStatusesAsync(int competitionId, List<int> advancedSubmissionIds)
        {
            _logger.LogInformation("📝 Updating submission statuses for competition {CompetitionId}", competitionId);

            var submissions = await _context.Submissions
                .Where(s => s.CompetitionId == competitionId && s.Status == SubmissionStatus.AwaitingJudging)
                .ToListAsync();

            int advancedCount = 0;
            int eliminatedCount = 0;

            foreach (var submission in submissions)
            {
                if (advancedSubmissionIds.Contains(submission.SubmissionId))
                {
                    submission.Status = SubmissionStatus.AdvancedToFinals;
                    advancedCount++;
                    _logger.LogDebug("✅ Advanced: Submission {SubmissionId}", submission.SubmissionId);
                }
                else
                {
                    submission.Status = SubmissionStatus.EliminatedInUniversalJudging;
                    eliminatedCount++;
                    _logger.LogDebug("❌ Eliminated: Submission {SubmissionId}", submission.SubmissionId);
                }
            }

            await _context.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation("✅ Phase 3 complete: {AdvancedCount} advanced, {EliminatedCount} eliminated",
                advancedCount, eliminatedCount);
        }

        /// <summary>
        /// PHASE 4: Calculate judging prowess scores for all judges who participated
        /// </summary>
        private async Task CalculateJudgingProwessAsync(int competitionId)
        {
            _logger.LogInformation("🧠 Calculating judging prowess scores for competition {CompetitionId}", competitionId);

            try
            {
                var prowessScores = await _judgingProwessCalculator.CalculateAndUpdateJudgingProwess(competitionId);

                _logger.LogInformation("✅ Phase 4 complete: Calculated prowess scores for {JudgeCount} judges",
                    prowessScores.Count);

                // Log prowess score summary
                if (prowessScores.Any())
                {
                    var avgProwess = prowessScores.Values.Average();
                    var highestProwess = prowessScores.Values.Max();
                    var lowestProwess = prowessScores.Values.Min();

                    _logger.LogInformation("📊 Prowess Score Summary: Average={AvgProwess:F2}, " +
                        "Highest={HighestProwess:F2}, Lowest={LowestProwess:F2}",
                        avgProwess, highestProwess, lowestProwess);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to calculate judging prowess scores for competition {CompetitionId}. " +
                    "Continuing with remaining tallying process.", competitionId);
                // Don't throw - prowess calculation failure shouldn't stop the tournament progression
            }
        }

        /// <summary>
        /// PHASE 5: Validate tallying results for consistency
        /// </summary>
        private async Task ValidateResultsAsync(int competitionId, List<int> advancedSubmissionIds)
        {
            _logger.LogInformation("🔍 Validating tallying results for competition {CompetitionId}", competitionId);

            var validationErrors = new List<string>();

            // Validation 1: Check that advanced submissions exist and have correct status
            var advancedSubmissions = await _context.Submissions
                .Where(s => advancedSubmissionIds.Contains(s.SubmissionId))
                .ToListAsync();

            if (advancedSubmissions.Count != advancedSubmissionIds.Count)
            {
                validationErrors.Add($"❌ Expected {advancedSubmissionIds.Count} advanced submissions, found {advancedSubmissions.Count}");
            }

            var wrongStatusAdvanced = advancedSubmissions.Count(s => s.Status != SubmissionStatus.AdvancedToFinals);
            if (wrongStatusAdvanced > 0)
            {
                validationErrors.Add($"❌ {wrongStatusAdvanced} advanced submissions have incorrect status");
            }

            // Validation 2: Check that eliminated submissions have correct status
            var eliminatedSubmissions = await _context.Submissions
                .Where(s => s.CompetitionId == competitionId &&
                           s.Status == SubmissionStatus.EliminatedInUniversalJudging)
                .ToListAsync();

            // Validation 3: Ensure no submission is both advanced and eliminated
            var conflictingSubmissions = await _context.Submissions
                .Where(s => s.CompetitionId == competitionId &&
                           advancedSubmissionIds.Contains(s.SubmissionId) &&
                           s.Status == SubmissionStatus.EliminatedInUniversalJudging)
                .ToListAsync();

            if (conflictingSubmissions.Any())
            {
                validationErrors.Add($"❌ {conflictingSubmissions.Count} submissions are marked as both advanced and eliminated");
            }

            // Log validation results
            if (validationErrors.Any())
            {
                _logger.LogError("❌ Validation failed with {ErrorCount} errors:\n{Errors}",
                    validationErrors.Count, string.Join("\n", validationErrors));
                throw new InvalidOperationException($"Tallying validation failed with {validationErrors.Count} errors");
            }
            else
            {
                _logger.LogInformation("✅ Phase 5 complete: All validations passed successfully!");
                _logger.LogInformation("📊 Final Summary:");
                _logger.LogInformation("   - Advanced to finals: {AdvancedCount}", advancedSubmissions.Count);
                _logger.LogInformation("   - Eliminated: {EliminatedCount}", eliminatedSubmissions.Count);
            }
        }

        private static string GetCurrentPhase(CompetitionStatus status)
        {
            return status switch
            {
                CompetitionStatus.Upcoming => "Upcoming",
                CompetitionStatus.OpenForSubmissions => "Open for Submissions",
                CompetitionStatus.InJudging => "Universal Judging",
                CompetitionStatus.Completed => "Completed",
                CompetitionStatus.Archived => "Archived",
                _ => status.ToString()
            };
        }

        private static string GetNextPhase(CompetitionStatus status)
        {
            return status switch
            {
                CompetitionStatus.Upcoming => "Open for Submissions",
                CompetitionStatus.OpenForSubmissions => "Universal Judging",
                CompetitionStatus.InJudging => "Finals",
                CompetitionStatus.Completed => "Archive",
                _ => "Unknown"
            };
        }

        #endregion
    }
}
