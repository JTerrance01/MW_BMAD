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
            // NEW HYBRID FAIR-PLAY TOURNAMENT: Uses simplified Judgement entities
            var judgements = await _context.Judgements
                .Where(j => j.SubmissionId == submissionId)
                .ToListAsync(cancellationToken);

            if (!judgements.Any())
                return null; // No judgement data found

            return await CalculateHybridTournamentScoresAsync(submissionId, competitionId, judgements, cancellationToken);
        }

        private async Task<ScoringResult> CalculateHybridTournamentScoresAsync(int submissionId, int competitionId,
            List<MixWarz.Domain.Entities.Judgement> judgements, CancellationToken cancellationToken)
        {
            var criteriaBreakdowns = new List<CriteriaScoreBreakdown>();

            // HYBRID FAIR-PLAY TOURNAMENT: Simplified scoring with single score + feedback
            var judgementsWithScores = judgements.Where(j => j.Score > 0).ToList();

            decimal finalScore = 0;

            if (judgementsWithScores.Any())
            {
                var averageScore = (decimal)judgementsWithScores.Average(j => j.Score);
                var comments = judgements
                    .Where(j => !string.IsNullOrWhiteSpace(j.Feedback))
                    .Select(j => j.Feedback!)
                    .ToList();

                // Create a simple summary breakdown for Hybrid Fair-Play Tournament
                criteriaBreakdowns.Add(new CriteriaScoreBreakdown
                {
                    CriteriaId = 0,
                    CriteriaName = "Overall Fair-Play Score",
                    CriteriaDescription = "Score from Hybrid Fair-Play Tournament judging system",
                    Weight = 1.0m,
                    MinScore = 1,
                    MaxScore = 10,
                    AverageScore = Math.Round(averageScore, 2),
                    WeightedScore = Math.Round(averageScore, 2),
                    JudgesComments = comments.Any()
                        ? comments
                        : new List<string> { $"📊 Average score: {averageScore:F2} from {judgementsWithScores.Count} judges" },
                    DisplayOrder = 1
                });

                finalScore = averageScore;
            }

            var ranking = await CalculateHybridTournamentRankingAsync(submissionId, competitionId, cancellationToken);

            return new ScoringResult
            {
                FinalScore = finalScore,
                Ranking = ranking,
                CriteriaBreakdowns = criteriaBreakdowns,
                TotalParticipants = judgements.Count
            };
        }

        private async Task<int> CalculateHybridTournamentRankingAsync(int submissionId, int competitionId, CancellationToken cancellationToken)
        {
            // Calculate ranking based on average scores from Hybrid Fair-Play Tournament Judgements
            var allSubmissionScores = await _context.Judgements
                .Include(j => j.Submission)
                .Where(j => j.Submission.CompetitionId == competitionId && j.Score > 0)
                .GroupBy(j => j.SubmissionId)
                .Select(g => new { SubmissionId = g.Key, AverageScore = (decimal)g.Average(j => j.Score) })
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