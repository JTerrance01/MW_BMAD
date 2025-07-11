using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Admin.Commands.GenerateMissingCriteriaScores
{
    public class GenerateMissingCriteriaScoresCommand : IRequest<GenerateMissingCriteriaScoresResponse>
    {
        public int? CompetitionId { get; set; } // If null, process all competitions
        public bool DryRun { get; set; } = false; // If true, only report what would be done
    }

    public class GenerateMissingCriteriaScoresResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int CompetitionsProcessed { get; set; }
        public int JudgmentsProcessed { get; set; }
        public int CriteriaScoresGenerated { get; set; }
        public List<CompetitionSummary> CompetitionSummaries { get; set; } = new();
    }

    public class CompetitionSummary
    {
        public int CompetitionId { get; set; }
        public string CompetitionTitle { get; set; } = string.Empty;
        public int JudgmentsWithoutCriteria { get; set; }
        public int CriteriaScoresGenerated { get; set; }
    }

    public class GenerateMissingCriteriaScoresCommandHandler : IRequestHandler<GenerateMissingCriteriaScoresCommand, GenerateMissingCriteriaScoresResponse>
    {
        private readonly IAppDbContext _context;
        private readonly ILogger<GenerateMissingCriteriaScoresCommandHandler> _logger;

        public GenerateMissingCriteriaScoresCommandHandler(
            IAppDbContext context,
            ILogger<GenerateMissingCriteriaScoresCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GenerateMissingCriteriaScoresResponse> Handle(GenerateMissingCriteriaScoresCommand request, CancellationToken cancellationToken)
        {
            var response = new GenerateMissingCriteriaScoresResponse();
            var competitionSummaries = new List<CompetitionSummary>();

            try
            {
                _logger.LogInformation($"🔄 Starting generation of missing criteria scores. DryRun: {request.DryRun}");

                // Get competitions to process
                var competitions = await GetCompetitionsToProcessAsync(request.CompetitionId, cancellationToken);

                if (!competitions.Any())
                {
                    response.Success = true;
                    response.Message = "No competitions found to process";
                    return response;
                }

                _logger.LogInformation($"📋 Found {competitions.Count} competitions to process");

                foreach (var competition in competitions)
                {
                    var competitionSummary = await ProcessCompetitionAsync(competition, request.DryRun, cancellationToken);
                    competitionSummaries.Add(competitionSummary);
                }

                response.Success = true;
                response.CompetitionsProcessed = competitionSummaries.Count;
                response.JudgmentsProcessed = competitionSummaries.Sum(cs => cs.JudgmentsWithoutCriteria);
                response.CriteriaScoresGenerated = competitionSummaries.Sum(cs => cs.CriteriaScoresGenerated);
                response.CompetitionSummaries = competitionSummaries;

                var actionText = request.DryRun ? "would be generated" : "generated";
                response.Message = $"✅ Processed {response.CompetitionsProcessed} competitions. " +
                                  $"{response.CriteriaScoresGenerated} criteria scores {actionText} for {response.JudgmentsProcessed} judgments.";

                _logger.LogInformation(response.Message);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = $"❌ Error generating missing criteria scores: {ex.Message}";
                _logger.LogError(ex, "Error generating missing criteria scores");
            }

            return response;
        }

        private async Task<List<Competition>> GetCompetitionsToProcessAsync(int? competitionId, CancellationToken cancellationToken)
        {
            var query = _context.Competitions.AsQueryable();

            if (competitionId.HasValue)
            {
                query = query.Where(c => c.CompetitionId == competitionId.Value);
            }

            return await query.ToListAsync(cancellationToken);
        }

        private async Task<CompetitionSummary> ProcessCompetitionAsync(Competition competition, bool dryRun, CancellationToken cancellationToken)
        {
            var summary = new CompetitionSummary
            {
                CompetitionId = competition.CompetitionId,
                CompetitionTitle = competition.Title
            };

            _logger.LogInformation($"📊 Processing competition {competition.CompetitionId}: {competition.Title}");

            // Get judging criteria for this competition
            var judgingCriteria = await _context.JudgingCriterias
                .Where(jc => jc.CompetitionId == competition.CompetitionId)
                .OrderBy(jc => jc.DisplayOrder)
                .ToListAsync(cancellationToken);

            if (!judgingCriteria.Any())
            {
                _logger.LogInformation($"⚠️ Competition {competition.CompetitionId} has no judging criteria - skipping");
                return summary;
            }

            _logger.LogInformation($"📋 Found {judgingCriteria.Count} judging criteria for competition {competition.CompetitionId}");

            // Find submission judgments without criteria scores
            var judgmentsWithoutCriteria = await _context.SubmissionJudgments
                .Where(sj => sj.CompetitionId == competition.CompetitionId)
                .Where(sj => sj.IsCompleted && sj.OverallScore.HasValue)
                .Where(sj => !_context.CriteriaScores.Any(cs => cs.SubmissionJudgmentId == sj.SubmissionJudgmentId))
                .ToListAsync(cancellationToken);

            summary.JudgmentsWithoutCriteria = judgmentsWithoutCriteria.Count;

            if (!judgmentsWithoutCriteria.Any())
            {
                _logger.LogInformation($"✅ Competition {competition.CompetitionId} - all judgments already have criteria scores");
                return summary;
            }

            _logger.LogInformation($"🔍 Found {judgmentsWithoutCriteria.Count} judgments without criteria scores in competition {competition.CompetitionId}");

            var criteriaScoresToGenerate = new List<CriteriaScore>();

            foreach (var judgment in judgmentsWithoutCriteria)
            {
                foreach (var criteria in judgingCriteria)
                {
                    // Scale the overall score to the criteria's range
                    var scaledScore = ScaleScoreToRange(judgment.OverallScore.Value, 1, 10, criteria.MinScore, criteria.MaxScore);

                    var criteriaScore = new CriteriaScore
                    {
                        SubmissionJudgmentId = judgment.SubmissionJudgmentId,
                        JudgingCriteriaId = criteria.Id,
                        Score = scaledScore,
                        Comments = $"Auto-generated from overall score of {judgment.OverallScore.Value:F2}",
                        ScoreTime = DateTimeOffset.UtcNow
                    };

                    criteriaScoresToGenerate.Add(criteriaScore);
                }
            }

            summary.CriteriaScoresGenerated = criteriaScoresToGenerate.Count;

            if (!dryRun)
            {
                // Actually create the criteria scores
                _context.CriteriaScores.AddRange(criteriaScoresToGenerate);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"✅ Generated {criteriaScoresToGenerate.Count} criteria scores for competition {competition.CompetitionId}");
            }
            else
            {
                _logger.LogInformation($"🔍 DRY RUN: Would generate {criteriaScoresToGenerate.Count} criteria scores for competition {competition.CompetitionId}");
            }

            return summary;
        }

        private static decimal ScaleScoreToRange(decimal score, decimal fromMin, decimal fromMax, decimal toMin, decimal toMax)
        {
            // Ensure the score is within the source range
            score = Math.Max(fromMin, Math.Min(fromMax, score));

            // Scale the score to the target range
            var scaledScore = toMin + (score - fromMin) * (toMax - toMin) / (fromMax - fromMin);

            // Round to 2 decimal places for consistency
            return Math.Round(scaledScore, 2);
        }
    }
}