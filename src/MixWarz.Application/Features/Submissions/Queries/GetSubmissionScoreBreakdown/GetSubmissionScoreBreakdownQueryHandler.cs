using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Submissions.Queries.GetSubmissionScoreBreakdown
{
    public class GetSubmissionScoreBreakdownQueryHandler : IRequestHandler<GetSubmissionScoreBreakdownQuery, GetSubmissionScoreBreakdownResponse>
    {
        private readonly IAppDbContext _context;

        public GetSubmissionScoreBreakdownQueryHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<GetSubmissionScoreBreakdownResponse> Handle(
            GetSubmissionScoreBreakdownQuery request,
            CancellationToken cancellationToken)
        {
            // Get submission with competition details
            var submission = await _context.Submissions
                .Include(s => s.Competition)
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId, cancellationToken);

            if (submission == null)
                throw new ApplicationException("Submission not found");

            // Verify user owns this submission
            if (submission.UserId != request.UserId)
                throw new UnauthorizedAccessException("You can only view score breakdowns for your own submissions");

            // Check if Round 1 voting has been tallied (competition status indicates voting is complete)
            var hasRound1Completed = submission.Competition.Status != CompetitionStatus.OpenForSubmissions
                && submission.Competition.Status != CompetitionStatus.VotingRound1Open;

            if (!hasRound1Completed)
                throw new ApplicationException("Score breakdown is only available after Round 1 voting has been completed");

            // Determine scoring method and calculate results
            var scoringResult = await DetermineAndCalculateScoresAsync(request.SubmissionId, submission.CompetitionId, cancellationToken);

            if (scoringResult == null)
                throw new ApplicationException("No voting or judging data available for this submission");

            return new GetSubmissionScoreBreakdownResponse
            {
                SubmissionId = submission.SubmissionId,
                MixTitle = submission.MixTitle,
                CompetitionTitle = submission.Competition.Title,
                FinalScore = Math.Round(scoringResult.FinalScore, 2),
                Ranking = scoringResult.Ranking,
                CriteriaBreakdowns = scoringResult.CriteriaBreakdowns.OrderBy(cb => cb.DisplayOrder).ToList(),
                TotalJudges = scoringResult.TotalParticipants,
                IsCompleted = true
            };
        }

        private async Task<ScoringResult?> DetermineAndCalculateScoresAsync(int submissionId, int competitionId, CancellationToken cancellationToken)
        {
            // Score Breakdown ALWAYS uses SubmissionJudgments (processed results from voting/judging)
            var judgments = await _context.SubmissionJudgments
                .Where(sj => sj.SubmissionId == submissionId &&
                           sj.VotingRound == 1 &&
                           sj.IsCompleted == true)
                .Include(sj => sj.CriteriaScores)
                    .ThenInclude(cs => cs.JudgingCriteria)
                .ToListAsync(cancellationToken);

            if (!judgments.Any())
                return null; // No judgment data found

            return await CalculateJudgmentBasedScoresAsync(submissionId, competitionId, judgments, cancellationToken);
        }

        private async Task<ScoringResult> CalculateJudgmentBasedScoresAsync(int submissionId, int competitionId,
            List<MixWarz.Domain.Entities.SubmissionJudgment> judgments, CancellationToken cancellationToken)
        {
            var criteriaBreakdowns = new List<CriteriaScoreBreakdown>();

            // Check if competition uses detailed criteria or simple scoring
            var allCriteria = await _context.JudgingCriterias
                .Where(jc => jc.CompetitionId == competitionId)
                .OrderBy(jc => jc.DisplayOrder)
                .ToListAsync(cancellationToken);

            decimal finalScore = 0;

            if (allCriteria.Any())
            {
                // Detailed criteria-based scoring (traditional judging)
                foreach (var criteria in allCriteria)
                {
                    var criteriaScores = judgments
                        .SelectMany(j => j.CriteriaScores)
                        .Where(cs => cs.JudgingCriteriaId == criteria.Id)
                        .ToList();

                    if (criteriaScores.Any())
                    {
                        var averageScore = criteriaScores.Average(cs => cs.Score);
                        var weightedScore = averageScore * criteria.Weight;
                        var comments = criteriaScores
                            .Where(cs => !string.IsNullOrWhiteSpace(cs.Comments))
                            .Select(cs => cs.Comments!)
                            .ToList();

                        criteriaBreakdowns.Add(new CriteriaScoreBreakdown
                        {
                            CriteriaId = criteria.Id,
                            CriteriaName = criteria.Name,
                            CriteriaDescription = criteria.Description,
                            Weight = criteria.Weight,
                            MinScore = criteria.MinScore,
                            MaxScore = criteria.MaxScore,
                            AverageScore = Math.Round(averageScore, 2),
                            WeightedScore = Math.Round(weightedScore, 4),
                            JudgesComments = comments,
                            DisplayOrder = criteria.DisplayOrder
                        });
                    }
                }

                finalScore = criteriaBreakdowns.Sum(cb => cb.WeightedScore);
            }
            else
            {
                // Simple scoring - use OverallScore from judgments (processed from voting)
                var judgmentsWithScores = judgments.Where(j => j.OverallScore.HasValue).ToList();

                if (judgmentsWithScores.Any())
                {
                    var averageOverallScore = judgmentsWithScores.Average(j => j.OverallScore!.Value);
                    var totalPoints = judgmentsWithScores.Sum(j => j.OverallScore!.Value);
                    var comments = judgments
                        .Where(j => !string.IsNullOrWhiteSpace(j.OverallComments))
                        .Select(j => j.OverallComments!)
                        .ToList();

                    // Create a simple summary breakdown
                    criteriaBreakdowns.Add(new CriteriaScoreBreakdown
                    {
                        CriteriaId = 0,
                        CriteriaName = "Overall Score",
                        CriteriaDescription = "Total score from Round 1 evaluation",
                        Weight = 1.0m,
                        MinScore = 0,
                        MaxScore = (int)judgmentsWithScores.Max(j => j.OverallScore!.Value),
                        AverageScore = Math.Round(averageOverallScore, 2),
                        WeightedScore = Math.Round(averageOverallScore, 2),
                        JudgesComments = comments.Any()
                            ? comments
                            : new List<string> { $"📊 Average score: {averageOverallScore:F2} from {judgmentsWithScores.Count} evaluations" },
                        DisplayOrder = 1
                    });

                    finalScore = averageOverallScore;
                }
            }

            var ranking = await CalculateJudgmentBasedRankingAsync(submissionId, competitionId, cancellationToken);

            return new ScoringResult
            {
                FinalScore = finalScore,
                Ranking = ranking,
                CriteriaBreakdowns = criteriaBreakdowns,
                TotalParticipants = judgments.Count
            };
        }

        private async Task<int> CalculateJudgmentBasedRankingAsync(int submissionId, int competitionId, CancellationToken cancellationToken)
        {
            // Try to get ranking from submission groups first
            var submissionGroup = await _context.SubmissionGroups
                .FirstOrDefaultAsync(sg => sg.SubmissionId == submissionId && sg.CompetitionId == competitionId,
                    cancellationToken);

            if (submissionGroup?.RankInGroup.HasValue == true)
            {
                return submissionGroup.RankInGroup.Value;
            }

            // Calculate ranking based on OverallScore from SubmissionJudgments
            var allSubmissionScores = await _context.SubmissionJudgments
                .Where(sj => sj.CompetitionId == competitionId &&
                           sj.VotingRound == 1 &&
                           sj.IsCompleted == true &&
                           sj.OverallScore.HasValue)
                .GroupBy(sj => sj.SubmissionId)
                .Select(g => new { SubmissionId = g.Key, AverageScore = g.Average(sj => sj.OverallScore!.Value) })
                .OrderByDescending(s => s.AverageScore)
                .ToListAsync(cancellationToken);

            var currentSubmissionRank = allSubmissionScores
                .FindIndex(s => s.SubmissionId == submissionId) + 1;

            return currentSubmissionRank > 0 ? currentSubmissionRank : 0;
        }

        private class ScoringResult
        {
            public decimal FinalScore { get; set; }
            public int Ranking { get; set; }
            public List<CriteriaScoreBreakdown> CriteriaBreakdowns { get; set; } = new();
            public int TotalParticipants { get; set; }
        }
    }
}