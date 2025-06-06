using MediatR;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Competitions.Queries.GetCompetitionResults
{
    public class CompetitionResultDto
    {
        public int Rank { get; set; }
        public int SubmissionId { get; set; }
        public string? Username { get; set; }
        public string? MixTitle { get; set; }
        public decimal Score { get; set; }
    }

    public class CompetitionResultsVm
    {
        public int CompetitionId { get; set; }
        public string? Title { get; set; }
        public CompetitionStatus Status { get; set; }
        public List<CompetitionResultDto> Results { get; set; } = new List<CompetitionResultDto>();
    }

    public class GetCompetitionResultsQuery : IRequest<CompetitionResultsVm>
    {
        public int CompetitionId { get; set; }
        public int TopCount { get; set; } = 20; // Get top 20 by default
    }

    public class GetCompetitionResultsQueryHandler : IRequestHandler<GetCompetitionResultsQuery, CompetitionResultsVm>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public GetCompetitionResultsQueryHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
        }

        public async Task<CompetitionResultsVm> Handle(GetCompetitionResultsQuery request, CancellationToken cancellationToken)
        {
            // Get competition
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {request.CompetitionId} not found");
            }

            // Check if results are available (competition is closed)
            if (competition.Status != CompetitionStatus.Closed)
            {
                return new CompetitionResultsVm
                {
                    CompetitionId = competition.CompetitionId,
                    Title = competition.Title,
                    Status = competition.Status,
                    Results = new List<CompetitionResultDto>() // Return empty results
                };
            }

            // Get all judged submissions for this competition
            var judgedSubmissions = await _submissionRepository.GetByCompetitionIdAndStatusAsync(
                request.CompetitionId,
                SubmissionStatus.Judged,
                1,
                1000); // Get all judged submissions

            // Order by score descending and take top N
            var orderedSubmissions = judgedSubmissions
                .Where(s => s.FinalScore.HasValue)
                .OrderByDescending(s => s.FinalScore)
                .Take(request.TopCount)
                .ToList();

            // Map to DTOs with rank
            var results = new List<CompetitionResultDto>();
            int rank = 1;
            decimal? previousScore = null;
            int sameRankCount = 0;

            foreach (var submission in orderedSubmissions)
            {
                // If this score is different from the previous one, update the rank
                if (previousScore.HasValue && submission.FinalScore != previousScore)
                {
                    rank += sameRankCount;
                    sameRankCount = 1;
                }
                else
                {
                    sameRankCount++;
                }

                previousScore = submission.FinalScore;

                results.Add(new CompetitionResultDto
                {
                    Rank = rank,
                    SubmissionId = submission.SubmissionId,
                    Username = submission.User?.UserName,
                    MixTitle = submission.MixTitle,
                    Score = submission.FinalScore.Value
                });
            }

            return new CompetitionResultsVm
            {
                CompetitionId = competition.CompetitionId,
                Title = competition.Title,
                Status = competition.Status,
                Results = results
            };
        }
    }
}