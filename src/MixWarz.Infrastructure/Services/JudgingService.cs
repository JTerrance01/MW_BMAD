using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Judging.DTOs;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Infrastructure.Services
{
    /// <summary>
    /// Service for handling judging operations in the Hybrid Fair-Play Tournament
    /// </summary>
    public class JudgingService : IJudgingService
    {
        private readonly IAppDbContext _context;
        private readonly ILogger<JudgingService> _logger;

        public JudgingService(IAppDbContext context, ILogger<JudgingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Submits a judgement for an assigned submission
        /// </summary>
        public async Task<Judgement> SubmitJudgement(SubmitJudgementDto judgementDto)
        {
            _logger.LogInformation("Submitting judgement for submission {SubmissionId} by judge {JudgeUserId}",
                judgementDto.SubmissionId, judgementDto.JudgeUserId);

            // Validate score range first
            if (judgementDto.Score < 1 || judgementDto.Score > 10)
            {
                throw new ArgumentException("Score must be between 1 and 10", nameof(judgementDto));
            }

            // Validate that the submission exists and is in the correct state
            var submission = await _context.Submissions
                .Include(s => s.Competition)
                .FirstOrDefaultAsync(s => s.SubmissionId == judgementDto.SubmissionId);

            if (submission == null)
            {
                throw new ArgumentException($"Submission with ID {judgementDto.SubmissionId} not found", nameof(judgementDto));
            }

            if (submission.Status != SubmissionStatus.AwaitingJudging)
            {
                throw new InvalidOperationException($"Submission {judgementDto.SubmissionId} is not in a state that allows judging. Current status: {submission.Status}");
            }

            // Validate that the judge exists
            var judge = await _context.Users.FindAsync(judgementDto.JudgeUserId);
            if (judge == null)
            {
                throw new ArgumentException($"Judge with ID {judgementDto.JudgeUserId} not found", nameof(judgementDto));
            }

            // Validate that the judge is assigned to this submission
            var existingAssignment = await _context.Judgements
                .FirstOrDefaultAsync(j => j.SubmissionId == judgementDto.SubmissionId &&
                                         j.JudgeUserId == judgementDto.JudgeUserId);

            if (existingAssignment == null)
            {
                throw new InvalidOperationException($"Judge {judgementDto.JudgeUserId} is not assigned to judge submission {judgementDto.SubmissionId}");
            }

            // Check if the judgement has already been submitted (score > 0 and feedback not empty)
            if (existingAssignment.Score > 0 && !string.IsNullOrWhiteSpace(existingAssignment.Feedback))
            {
                throw new InvalidOperationException($"Judge {judgementDto.JudgeUserId} has already submitted a judgement for submission {judgementDto.SubmissionId}");
            }

            // Prevent self-judging as an additional safety check
            if (submission.UserId == judgementDto.JudgeUserId)
            {
                throw new InvalidOperationException("A competitor cannot judge their own submission");
            }

            // All validation passed, now start transaction for the actual update
            using var transaction = await _context.Database.BeginTransactionAsync(CancellationToken.None);

            try
            {

                // Update the existing assignment with the actual judgement data
                existingAssignment.Score = judgementDto.Score;
                existingAssignment.Feedback = judgementDto.Feedback;
                existingAssignment.SubmittedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(CancellationToken.None);
                await transaction.CommitAsync(CancellationToken.None);

                _logger.LogInformation("Successfully submitted judgement {JudgementId} for submission {SubmissionId} by judge {JudgeUserId}",
                    existingAssignment.JudgementId, judgementDto.SubmissionId, judgementDto.JudgeUserId);

                return existingAssignment;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(CancellationToken.None);
                _logger.LogError(ex, "Failed to submit judgement for submission {SubmissionId} by judge {JudgeUserId}",
                    judgementDto.SubmissionId, judgementDto.JudgeUserId);
                throw;
            }
        }

        /// <summary>
        /// Rates the helpfulness of feedback received from a judge
        /// </summary>
        public async Task<FeedbackRating> RateFeedback(RateFeedbackDto ratingDto)
        {
            _logger.LogInformation("Rating feedback for judgement {JudgementId} by user {RaterUserId}",
                ratingDto.JudgementId, ratingDto.RaterUserId);

            // Validate that the judgement exists and has been submitted
            var judgement = await _context.Judgements
                .Include(j => j.Submission)
                .FirstOrDefaultAsync(j => j.JudgementId == ratingDto.JudgementId);

            if (judgement == null)
            {
                throw new ArgumentException($"Judgement with ID {ratingDto.JudgementId} not found", nameof(ratingDto));
            }

            // Ensure the judgement has actually been submitted (not just an assignment)
            if (judgement.Score == 0 || string.IsNullOrWhiteSpace(judgement.Feedback))
            {
                throw new InvalidOperationException($"Judgement {ratingDto.JudgementId} has not been submitted yet and cannot be rated");
            }

            // Validate that the rater exists
            var rater = await _context.Users.FindAsync(ratingDto.RaterUserId);
            if (rater == null)
            {
                throw new ArgumentException($"Rater with ID {ratingDto.RaterUserId} not found", nameof(ratingDto));
            }

            // Validate that the rater is the owner of the submission that was judged
            if (judgement.Submission.UserId != ratingDto.RaterUserId)
            {
                throw new InvalidOperationException($"Only the submission owner can rate feedback. Expected: {judgement.Submission.UserId}, Actual: {ratingDto.RaterUserId}");
            }

            // Check if this user has already rated this judgement
            var existingRating = await _context.FeedbackRatings
                .FirstOrDefaultAsync(fr => fr.JudgementId == ratingDto.JudgementId &&
                                          fr.RaterUserId == ratingDto.RaterUserId);

            if (existingRating != null)
            {
                throw new InvalidOperationException($"User {ratingDto.RaterUserId} has already rated judgement {ratingDto.JudgementId}");
            }

            // All validation passed, now start transaction for the actual update
            using var transaction = await _context.Database.BeginTransactionAsync(CancellationToken.None);

            try
            {

                // Create the feedback rating
                var feedbackRating = new FeedbackRating
                {
                    JudgementId = ratingDto.JudgementId,
                    RaterUserId = ratingDto.RaterUserId,
                    IsHelpful = ratingDto.IsHelpful,
                    RatedAt = DateTime.UtcNow
                };

                _context.FeedbackRatings.Add(feedbackRating);
                await _context.SaveChangesAsync(CancellationToken.None);
                await transaction.CommitAsync(CancellationToken.None);

                _logger.LogInformation("Successfully rated feedback for judgement {JudgementId} by user {RaterUserId} as {Rating}",
                    ratingDto.JudgementId, ratingDto.RaterUserId, ratingDto.IsHelpful ? "helpful" : "not helpful");

                return feedbackRating;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(CancellationToken.None);
                _logger.LogError(ex, "Failed to rate feedback for judgement {JudgementId} by user {RaterUserId}",
                    ratingDto.JudgementId, ratingDto.RaterUserId);
                throw;
            }
        }

        /// <summary>
        /// Gets all judgements assigned to a specific judge for a competition
        /// </summary>
        public async Task<IEnumerable<Judgement>> GetJudgeAssignments(string judgeUserId, int competitionId)
        {
            _logger.LogDebug("Getting judge assignments for user {JudgeUserId} in competition {CompetitionId}",
                judgeUserId, competitionId);

            return await _context.Judgements
                .Include(j => j.Submission)
                    .ThenInclude(s => s.User)
                .Include(j => j.Submission)
                    .ThenInclude(s => s.Competition)
                .Where(j => j.JudgeUserId == judgeUserId &&
                           j.Submission.CompetitionId == competitionId)
                .OrderBy(j => j.Submission.SubmissionDate)
                .ToListAsync();
        }

        /// <summary>
        /// Gets all judgements received for a specific submission
        /// </summary>
        public async Task<IEnumerable<Judgement>> GetSubmissionJudgements(int submissionId)
        {
            _logger.LogDebug("Getting judgements for submission {SubmissionId}", submissionId);

            return await _context.Judgements
                .Include(j => j.Judge)
                .Include(j => j.FeedbackRatings)
                .Where(j => j.SubmissionId == submissionId)
                .OrderBy(j => j.SubmittedAt)
                .ToListAsync();
        }
    }
}
