using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Infrastructure.Services
{
    /// <summary>
    /// Service responsible for assigning submissions to competitors for judging in the Hybrid Fair-Play Tournament
    /// </summary>
    public class SubmissionAssignmentService : ISubmissionAssignmentService
    {
        private const int DefaultAssignmentsPerJudge = 3; // Configurable number of submissions per judge

        private readonly IAppDbContext _context;
        private readonly ILogger<SubmissionAssignmentService> _logger;

        public SubmissionAssignmentService(IAppDbContext context, ILogger<SubmissionAssignmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Creates judging assignments for all competitors in a competition
        /// Each competitor gets assigned a configurable number of random submissions (excluding their own)
        /// </summary>
        /// <param name="competitionId">The ID of the competition to create assignments for</param>
        /// <param name="assignmentsPerJudge">Number of submissions to assign to each judge (defaults to 3)</param>
        /// <returns>Number of assignments created</returns>
        public async Task<int> CreateAssignments(int competitionId, int assignmentsPerJudge = DefaultAssignmentsPerJudge)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(CancellationToken.None);

            try
            {
                _logger.LogInformation("Starting assignment creation for competition {CompetitionId}", competitionId);

                // Get the competition and verify it exists
                var competition = await _context.Competitions
                    .FirstOrDefaultAsync(c => c.CompetitionId == competitionId);

                if (competition == null)
                {
                    throw new ArgumentException($"Competition with ID {competitionId} not found", nameof(competitionId));
                }

                // Get all active submissions for this competition
                var activeSubmissions = await _context.Submissions
                    .Where(s => s.CompetitionId == competitionId &&
                               s.Status == SubmissionStatus.Submitted)
                    .Include(s => s.User)
                    .ToListAsync();

                if (activeSubmissions.Count == 0)
                {
                    _logger.LogWarning("No active submissions found for competition {CompetitionId}", competitionId);
                    return 0;
                }

                // Get all competitors (users who have submissions in this competition)
                var competitors = activeSubmissions
                    .Select(s => s.User)
                    .Distinct()
                    .ToList();

                if (competitors.Count < 2)
                {
                    throw new InvalidOperationException($"Cannot create assignments: competition {competitionId} needs at least 2 competitors");
                }

                var assignmentsCreated = 0;
                var random = new Random();

                // Create assignments for each competitor
                foreach (var competitor in competitors)
                {
                    // Get submissions that this competitor can judge (excluding their own)
                    var judgableSubmissions = activeSubmissions
                        .Where(s => s.UserId != competitor.Id)
                        .ToList();

                    if (judgableSubmissions.Count == 0)
                    {
                        _logger.LogWarning("No judgable submissions for competitor {CompetitorId} in competition {CompetitionId}",
                            competitor.Id, competitionId);
                        continue;
                    }

                    // Determine how many assignments to create (min of requested count and available submissions)
                    var assignmentCount = Math.Min(assignmentsPerJudge, judgableSubmissions.Count);

                    // Randomly select submissions for this judge
                    var selectedSubmissions = judgableSubmissions
                        .OrderBy(x => random.Next())
                        .Take(assignmentCount)
                        .ToList();

                    // Create judgement assignments (empty judgements that will be filled later)
                    foreach (var submission in selectedSubmissions)
                    {
                        // Check if assignment already exists to prevent duplicates
                        var existingAssignment = await _context.Judgements
                            .FirstOrDefaultAsync(j => j.SubmissionId == submission.SubmissionId &&
                                                    j.JudgeUserId == competitor.Id);

                        if (existingAssignment == null)
                        {
                            var judgement = new Judgement
                            {
                                SubmissionId = submission.SubmissionId,
                                JudgeUserId = competitor.Id,
                                Score = 0, // Will be filled when judge submits their judgement
                                Feedback = "", // Will be filled when judge submits their judgement
                                SubmittedAt = DateTime.UtcNow // Temporary timestamp, will be updated when actually submitted
                            };

                            _context.Judgements.Add(judgement);
                            assignmentsCreated++;

                            _logger.LogDebug("Created assignment: Judge {JudgeId} -> Submission {SubmissionId}",
                                competitor.Id, submission.SubmissionId);
                        }
                    }
                }

                // Update competition status to Judging
                competition.Status = CompetitionStatus.InJudging;

                // Update submission statuses to AwaitingJudging
                foreach (var submission in activeSubmissions)
                {
                    submission.Status = SubmissionStatus.AwaitingJudging;
                }

                // Save all changes
                await _context.SaveChangesAsync(CancellationToken.None);
                await transaction.CommitAsync(CancellationToken.None);

                _logger.LogInformation("Successfully created {AssignmentCount} assignments for competition {CompetitionId}",
                    assignmentsCreated, competitionId);

                return assignmentsCreated;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(CancellationToken.None);
                _logger.LogError(ex, "Failed to create assignments for competition {CompetitionId}", competitionId);
                throw;
            }
        }
    }
}
