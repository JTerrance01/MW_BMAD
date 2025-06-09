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

            // ENHANCED: Check for both judging data and voting data to support all users
            // First try to get judgment data (for users who used judging interface)
            var judgments = await _context.SubmissionJudgments
                .Where(sj => sj.SubmissionId == request.SubmissionId &&
                           sj.VotingRound == 1 &&
                           sj.IsCompleted == true)
                .Include(sj => sj.CriteriaScores)
                    .ThenInclude(cs => cs.JudgingCriteria)
                .ToListAsync(cancellationToken);

            // If no judgment data, check for voting data (for users who used traditional voting)
            var votes = await _context.SubmissionVotes
                .Where(sv => sv.SubmissionId == request.SubmissionId &&
                           sv.VotingRound == 1)
                .ToListAsync(cancellationToken);

            if (!judgments.Any() && !votes.Any())
                throw new ApplicationException("No voting or judging data available for this submission");

            // Build response based on available data type
            var criteriaBreakdowns = new List<CriteriaScoreBreakdown>();
            decimal finalScore = 0;
            int totalJudges = 0;

            if (judgments.Any())
            {
                // DETAILED SCORING: User participated in judging with criteria breakdown
                var allCriteria = await _context.JudgingCriterias
                    .Where(jc => jc.CompetitionId == submission.CompetitionId)
                    .OrderBy(jc => jc.DisplayOrder)
                    .ToListAsync(cancellationToken);

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
                totalJudges = judgments.Count;
            }
            else if (votes.Any())
            {
                // VOTING SUMMARY: User participated in traditional voting (no detailed criteria)
                var totalPoints = votes.Sum(v => v.Points);
                var firstPlaceVotes = votes.Count(v => v.Rank == 1);
                var secondPlaceVotes = votes.Count(v => v.Rank == 2);
                var thirdPlaceVotes = votes.Count(v => v.Rank == 3);

                // Create a summary "criteria" for voting breakdown
                criteriaBreakdowns.Add(new CriteriaScoreBreakdown
                {
                    CriteriaId = 0,
                    CriteriaName = "Overall Voting Summary",
                    CriteriaDescription = "Summary of votes received from all participants",
                    Weight = 1.0m,
                    MinScore = 0,
                    MaxScore = totalPoints,
                    AverageScore = totalPoints,
                    WeightedScore = totalPoints,
                    JudgesComments = new List<string>
                    {
                        $"Received {firstPlaceVotes} first-place votes (3 points each)",
                        $"Received {secondPlaceVotes} second-place votes (2 points each)",
                        $"Received {thirdPlaceVotes} third-place votes (1 point each)",
                        $"Total: {totalPoints} points from {votes.Count} voters"
                    },
                    DisplayOrder = 1
                });

                finalScore = totalPoints;
                totalJudges = votes.Count;
            }

            // Get ranking from submission groups or calculate from final score
            var ranking = await GetSubmissionRanking(submission.SubmissionId, submission.CompetitionId, cancellationToken);

            return new GetSubmissionScoreBreakdownResponse
            {
                SubmissionId = submission.SubmissionId,
                MixTitle = submission.MixTitle,
                CompetitionTitle = submission.Competition.Title,
                FinalScore = Math.Round(finalScore, 2),
                Ranking = ranking,
                CriteriaBreakdowns = criteriaBreakdowns.OrderBy(cb => cb.DisplayOrder).ToList(),
                TotalJudges = totalJudges,
                IsCompleted = true
            };
        }

        private async Task<int> GetSubmissionRanking(int submissionId, int competitionId, CancellationToken cancellationToken)
        {
            // Try to get ranking from submission groups first
            var submissionGroup = await _context.SubmissionGroups
                .FirstOrDefaultAsync(sg => sg.SubmissionId == submissionId && sg.CompetitionId == competitionId,
                    cancellationToken);

            if (submissionGroup?.RankInGroup.HasValue == true)
            {
                return submissionGroup.RankInGroup.Value;
            }

            // If no rank in submission groups, calculate based on overall scores
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
    }
}