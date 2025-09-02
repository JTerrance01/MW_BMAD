using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;

namespace MixWarz.Infrastructure.Services
{
    /// <summary>
    /// Service for calculating judging prowess scores based on scoring accuracy and feedback helpfulness
    /// </summary>
    public class JudgingProwessCalculator : IJudgingProwessCalculator
    {
        private readonly IAppDbContext _context;
        private readonly ILogger<JudgingProwessCalculator> _logger;

        // Configuration constants for prowess calculation
        private const decimal AccuracyWeight = 0.7m; // 70% weight for score accuracy
        private const decimal HelpfulnessWeight = 0.3m; // 30% weight for feedback helpfulness
        private const decimal MaxAccuracyDifference = 5.0m; // Maximum expected difference in scores (1-10 scale)
        private const int MinJudgementsForCalculation = 3; // Minimum judgements needed for reliable calculation

        public JudgingProwessCalculator(IAppDbContext context, ILogger<JudgingProwessCalculator> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Calculates and updates judging prowess scores for all judges in a competition
        /// </summary>
        public async Task<Dictionary<string, decimal>> CalculateAndUpdateJudgingProwess(int competitionId)
        {
            _logger.LogInformation("🎯 Starting judging prowess calculation for competition {CompetitionId}", competitionId);

            var prowessScores = new Dictionary<string, decimal>();

            // Get all judges who participated in this competition
            var judgeIds = await _context.Judgements
                .Include(j => j.Submission)
                .Where(j => j.Submission.CompetitionId == competitionId && j.Score > 0)
                .Select(j => j.JudgeId)
                .Distinct()
                .ToListAsync();

            _logger.LogInformation("📊 Found {JudgeCount} judges to calculate prowess for", judgeIds.Count);

            foreach (var judgeId in judgeIds)
            {
                try
                {
                    var prowessScore = await CalculateJudgeProwessScore(competitionId, judgeId);
                    prowessScores[judgeId] = prowessScore;

                    // Update the user's judging prowess score
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == judgeId);
                    if (user != null)
                    {
                        user.JudgingProwessScore = prowessScore;
                        await _context.SaveChangesAsync(CancellationToken.None);

                        _logger.LogDebug("✅ Updated prowess score for judge {JudgeId}: {ProwessScore:F2}",
                            judgeId, prowessScore);
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ Could not find user {JudgeId} to update prowess score", judgeId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to calculate prowess for judge {JudgeId}", judgeId);
                    // Continue with other judges even if one fails
                }
            }

            _logger.LogInformation("✅ Completed judging prowess calculation. Updated {UpdatedCount} judge scores",
                prowessScores.Count);

            return prowessScores;
        }

        /// <summary>
        /// Calculates judging prowess score for a specific judge
        /// </summary>
        public async Task<decimal> CalculateJudgeProwessScore(int competitionId, string judgeId)
        {
            _logger.LogDebug("🔍 Calculating prowess for judge {JudgeId} in competition {CompetitionId}",
                judgeId, competitionId);

            // Get all judgements by this judge for the competition
            var judgeJudgements = await _context.Judgements
                .Include(j => j.Submission)
                .Include(j => j.FeedbackRatings)
                .Where(j => j.Submission.CompetitionId == competitionId &&
                           j.JudgeId == judgeId &&
                           j.Score > 0)
                .ToListAsync();

            if (judgeJudgements.Count < MinJudgementsForCalculation)
            {
                _logger.LogDebug("📉 Judge {JudgeId} has only {JudgementCount} judgements, " +
                    "minimum {MinRequired} required for calculation. Returning neutral score.",
                    judgeId, judgeJudgements.Count, MinJudgementsForCalculation);
                return 50.0m; // Neutral score for insufficient data
            }

            // Calculate final average scores for all submissions in the competition
            var submissionAverages = await CalculateSubmissionAverages(competitionId);

            // Calculate accuracy component
            var accuracyScore = CalculateAccuracyScore(judgeJudgements, submissionAverages);

            // Calculate helpfulness component
            var helpfulnessScore = CalculateHelpfulnessScore(judgeJudgements);

            // Combine components with weights
            var finalProwessScore = (accuracyScore * AccuracyWeight) + (helpfulnessScore * HelpfulnessWeight);

            _logger.LogDebug("📊 Judge {JudgeId} prowess breakdown: Accuracy={AccuracyScore:F2} ({AccuracyWeight:P}), " +
                "Helpfulness={HelpfulnessScore:F2} ({HelpfulnessWeight:P}), Final={FinalScore:F2}",
                judgeId, accuracyScore, AccuracyWeight, helpfulnessScore, HelpfulnessWeight, finalProwessScore);

            return Math.Round(finalProwessScore, 2);
        }

        /// <summary>
        /// Gets detailed prowess calculation breakdown for transparency
        /// </summary>
        public async Task<JudgingProwessDetails> GetProwessCalculationDetails(int competitionId, string judgeId)
        {
            _logger.LogDebug("📋 Getting detailed prowess calculation for judge {JudgeId}", judgeId);

            var judgeJudgements = await _context.Judgements
                .Include(j => j.Submission)
                .Include(j => j.FeedbackRatings)
                .Where(j => j.Submission.CompetitionId == competitionId &&
                           j.JudgeId == judgeId &&
                           j.Score > 0)
                .ToListAsync();

            var submissionAverages = await CalculateSubmissionAverages(competitionId);

            var judgementDetails = judgeJudgements.Select(j =>
            {
                var submissionAverage = submissionAverages.GetValueOrDefault(j.SubmissionId, 0);
                var accuracyDifference = Math.Abs(j.Score - submissionAverage);
                var feedbackRatings = j.FeedbackRatings;

                return new JudgementAccuracyDetail
                {
                    SubmissionId = j.SubmissionId,
                    JudgeScore = j.Score,
                    FinalAverageScore = submissionAverage,
                    AccuracyDifference = accuracyDifference,
                    HasFeedbackRating = feedbackRatings.Any(),
                    WasRatedHelpful = feedbackRatings.Any() ? feedbackRatings.First().Rating > 3 : null
                };
            }).ToList();

            var accuracyScore = CalculateAccuracyScore(judgeJudgements, submissionAverages);
            var helpfulnessScore = CalculateHelpfulnessScore(judgeJudgements);
            var finalScore = (accuracyScore * AccuracyWeight) + (helpfulnessScore * HelpfulnessWeight);

            var totalRatings = judgeJudgements.Sum(j => j.FeedbackRatings.Count);
            var helpfulRatings = judgeJudgements.Sum(j => j.FeedbackRatings.Count(fr => fr.Rating > 3));
            var helpfulnessRatio = totalRatings > 0 ? (decimal)helpfulRatings / totalRatings : 0;

            var avgAccuracy = judgementDetails.Any() ? judgementDetails.Average(jd => jd.AccuracyDifference) : 0;

            return new JudgingProwessDetails
            {
                JudgeId = judgeId,
                CompetitionId = competitionId,
                TotalJudgements = judgeJudgements.Count,
                AverageScoreAccuracy = avgAccuracy,
                HelpfulFeedbackCount = helpfulRatings,
                TotalFeedbackRatings = totalRatings,
                HelpfulnessRatio = helpfulnessRatio,
                AccuracyScore = accuracyScore,
                HelpfulnessScore = helpfulnessScore,
                FinalProwessScore = Math.Round(finalScore, 2),
                JudgementDetails = judgementDetails
            };
        }

        #region Private Methods

        /// <summary>
        /// Calculates final average scores for all submissions in the competition
        /// </summary>
        private async Task<Dictionary<int, decimal>> CalculateSubmissionAverages(int competitionId)
        {
            var submissionAverages = await _context.Judgements
                .Include(j => j.Submission)
                .Where(j => j.Submission.CompetitionId == competitionId && j.Score > 0)
                .GroupBy(j => j.SubmissionId)
                .Select(g => new
                {
                    SubmissionId = g.Key,
                    AverageScore = g.Average(j => (decimal)j.Score)
                })
                .ToDictionaryAsync(x => x.SubmissionId, x => x.AverageScore);

            _logger.LogDebug("📊 Calculated averages for {SubmissionCount} submissions", submissionAverages.Count);
            return submissionAverages;
        }

        /// <summary>
        /// Calculates accuracy score based on how close judge's scores are to final averages
        /// </summary>
        private decimal CalculateAccuracyScore(List<Judgement> judgeJudgements, Dictionary<int, decimal> submissionAverages)
        {
            if (!judgeJudgements.Any())
                return 50.0m; // Neutral score

            var accuracyScores = new List<decimal>();

            foreach (var judgement in judgeJudgements)
            {
                if (submissionAverages.TryGetValue(judgement.SubmissionId, out var averageScore))
                {
                    // Calculate absolute difference between judge's score and final average
                    var difference = Math.Abs(judgement.Score - averageScore);

                    // Convert difference to accuracy score (0-100 scale)
                    // Smaller differences = higher accuracy scores
                    var accuracyScore = Math.Max(0, 100 - (difference / MaxAccuracyDifference * 100));
                    accuracyScores.Add(accuracyScore);

                    _logger.LogTrace("📐 Submission {SubmissionId}: Judge={JudgeScore}, Average={AverageScore:F2}, " +
                        "Difference={Difference:F2}, AccuracyScore={AccuracyScore:F2}",
                        judgement.SubmissionId, judgement.Score, averageScore, difference, accuracyScore);
                }
            }

            var finalAccuracyScore = accuracyScores.Any() ? accuracyScores.Average() : 50.0m;
            _logger.LogDebug("🎯 Accuracy component: {AccuracyScore:F2} (from {JudgementCount} judgements)",
                finalAccuracyScore, accuracyScores.Count);

            return finalAccuracyScore;
        }

        /// <summary>
        /// Calculates helpfulness score based on feedback ratings received
        /// </summary>
        private decimal CalculateHelpfulnessScore(List<Judgement> judgeJudgements)
        {
            var totalRatings = judgeJudgements.Sum(j => j.FeedbackRatings.Count);
            var helpfulRatings = judgeJudgements.Sum(j => j.FeedbackRatings.Count(fr => fr.Rating > 3));

            if (totalRatings == 0)
            {
                _logger.LogDebug("📝 No feedback ratings available, using neutral helpfulness score");
                return 50.0m; // Neutral score when no feedback has been rated
            }

            // Calculate helpfulness ratio and convert to 0-100 scale
            var helpfulnessRatio = (decimal)helpfulRatings / totalRatings;
            var helpfulnessScore = helpfulnessRatio * 100;

            _logger.LogDebug("👍 Helpfulness component: {HelpfulnessScore:F2} ({HelpfulCount}/{TotalCount} ratings helpful)",
                helpfulnessScore, helpfulRatings, totalRatings);

            return helpfulnessScore;
        }

        #endregion
    }
}
