using MediatR;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using MixWarz.Application.Common.Utilities;

namespace MixWarz.Application.Features.Competitions.Queries.GetCompetitionResults
{
    public class CompetitionResultDto
    {
        public int Rank { get; set; }
        public int Id { get; set; } // Changed from SubmissionId to match frontend expectation
        public string? UserName { get; set; } // Fixed casing to match frontend expectation
        public string? Title { get; set; } // Changed from MixTitle to match frontend expectation
        public decimal Score { get; set; }
        public string? AudioUrl { get; set; } // Added for audio playback
    }

    public class CompetitionWinnerDto
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
        public string? Title { get; set; }
        public decimal Score { get; set; }
        public string? AudioUrl { get; set; }
        public string? ProfilePicture { get; set; }
    }

    public class CompetitionResultsVm
    {
        public int CompetitionId { get; set; }
        public string? Title { get; set; }
        public CompetitionStatus Status { get; set; }
        public List<CompetitionWinnerDto> Winners { get; set; } = new List<CompetitionWinnerDto>();
        public List<CompetitionResultDto> Results { get; set; } = new List<CompetitionResultDto>();
        public DateTime? CompletedDate { get; set; }
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
        private readonly IFileStorageService _fileStorageService;

        public GetCompetitionResultsQueryHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            IFileStorageService fileStorageService)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<CompetitionResultsVm> Handle(GetCompetitionResultsQuery request, CancellationToken cancellationToken)
        {
            // Get competition
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {request.CompetitionId} not found");
            }

            // Check if results are available (competition is completed)
            if (competition.Status != CompetitionStatus.Completed &&
                competition.Status != CompetitionStatus.RequiresManualWinnerSelection)
            {
                return new CompetitionResultsVm
                {
                    CompetitionId = competition.CompetitionId,
                    Title = competition.Title,
                    Status = competition.Status,
                    Winners = new List<CompetitionWinnerDto>(),
                    Results = new List<CompetitionResultDto>(),
                    CompletedDate = null
                };
            }

            // Get all submissions that have Round 2 results (FinalScore from Round 2 voting)
            var submissions = await _submissionRepository.GetByCompetitionIdAsync(request.CompetitionId);

            // Filter for submissions that advanced to Round 2 and have final scores
            var finalSubmissions = submissions
                .Where(s => s.AdvancedToRound2 && s.Round2Score.HasValue)
                .OrderByDescending(s => s.Round2Score) // Order by Round 2 score (the final score)
                .Take(request.TopCount)
                .ToList();

            // Create results with audio URLs
            var results = new List<CompetitionResultDto>();
            var winners = new List<CompetitionWinnerDto>();
            int rank = 1;
            decimal? previousScore = null;
            int sameRankCount = 0;

            foreach (var submission in finalSubmissions)
            {
                // Calculate rank with proper tie handling
                if (previousScore.HasValue && submission.Round2Score != previousScore)
                {
                    rank += sameRankCount;
                    sameRankCount = 1;
                }
                else
                {
                    sameRankCount++;
                }

                previousScore = submission.Round2Score;

                // Get audio URL for the submission
                string? audioUrl = null;
                if (!string.IsNullOrEmpty(submission.AudioFilePath))
                {
                    try
                    {
                        // Use FileUrlHelper.ResolveFileUrlAsync for consistent URL handling
                        // This properly handles React proxy compatibility for localhost development
                        audioUrl = await FileUrlHelper.ResolveFileUrlAsync(
                            _fileStorageService,
                            submission.AudioFilePath,
                            TimeSpan.FromHours(2)); // 2-hour expiration for results viewing
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue without audio URL
                        Console.WriteLine($"Error generating audio URL for submission {submission.SubmissionId}: {ex.Message}");
                    }
                }

                var resultDto = new CompetitionResultDto
                {
                    Rank = rank,
                    Id = submission.SubmissionId,
                    UserName = submission.User?.UserName,
                    Title = submission.MixTitle,
                    Score = submission.Round2Score.Value,
                    AudioUrl = audioUrl
                };

                results.Add(resultDto);

                // Add to winners list if it's top 3
                if (rank <= 3)
                {
                    winners.Add(new CompetitionWinnerDto
                    {
                        Id = submission.SubmissionId,
                        UserName = submission.User?.UserName,
                        Title = submission.MixTitle,
                        Score = submission.Round2Score.Value,
                        AudioUrl = audioUrl,
                        ProfilePicture = submission.User?.ProfilePictureUrl
                    });
                }
            }

            return new CompetitionResultsVm
            {
                CompetitionId = competition.CompetitionId,
                Title = competition.Title,
                Status = competition.Status,
                Winners = winners,
                Results = results,
                CompletedDate = competition.CompletedDate ?? competition.CreationDate // Use actual completion date when available
            };
        }
    }
}