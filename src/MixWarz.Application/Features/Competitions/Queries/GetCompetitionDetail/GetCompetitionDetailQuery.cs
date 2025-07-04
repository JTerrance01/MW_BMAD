using MediatR;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Competitions.Queries.GetCompetitionDetail
{
    public class CompetitionDetailDto
    {
        public int CompetitionId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? RulesText { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? PrizeDetails { get; set; }
        public CompetitionStatus Status { get; set; }
        public string? OrganizerUserId { get; set; }
        public string? OrganizerUsername { get; set; }
        public DateTime CreationDate { get; set; }
        public int SubmissionCount { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? MultitrackZipUrl { get; set; }
        public bool HasMultitrackFile => !string.IsNullOrEmpty(MultitrackZipUrl);
        public string? MixedTrackUrl { get; set; }
        public bool HasMixedTrackFile => !string.IsNullOrEmpty(MixedTrackUrl);
        public string? SourceTrackUrl { get; set; }
        public bool HasSourceTrackFile => !string.IsNullOrEmpty(SourceTrackUrl);
        public Genre Genre { get; set; }
        public DateTime SubmissionDeadline { get; set; }
        public string? SongCreator { get; set; }
    }

    public class GetCompetitionDetailQuery : IRequest<CompetitionDetailDto>
    {
        public int CompetitionId { get; set; }
    }

    public class GetCompetitionDetailQueryHandler : IRequestHandler<GetCompetitionDetailQuery, CompetitionDetailDto>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IFileStorageService _fileStorageService;

        public GetCompetitionDetailQueryHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            IFileStorageService fileStorageService)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<CompetitionDetailDto> Handle(GetCompetitionDetailQuery request, CancellationToken cancellationToken)
        {
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);

            if (competition == null)
            {
                throw new Exception($"Competition with ID {request.CompetitionId} not found");
            }

            // Get accurate submission count from the database
            var submissionCount = await _submissionRepository.GetCountByCompetitionIdAsync(request.CompetitionId);

            // Process URLs to handle both file keys and full URLs
            var coverImageUrl = await ProcessUrlAsync(competition.CoverImageUrl);
            var multitrackZipUrl = await ProcessUrlAsync(competition.MultitrackZipUrl);
            var mixedTrackUrl = await ProcessUrlAsync(competition.MixedTrackUrl);
            var sourceTrackUrl = await ProcessUrlAsync(competition.SourceTrackUrl);

            return new CompetitionDetailDto
            {
                CompetitionId = competition.CompetitionId,
                Title = competition.Title,
                Description = competition.Description,
                RulesText = competition.RulesText,
                StartDate = competition.StartDate,
                EndDate = competition.EndDate,
                PrizeDetails = competition.PrizeDetails,
                Status = competition.Status,
                OrganizerUserId = competition.OrganizerUserId,
                OrganizerUsername = competition.Organizer?.UserName,
                CreationDate = competition.CreationDate,
                SubmissionCount = submissionCount,
                CoverImageUrl = coverImageUrl,
                MultitrackZipUrl = multitrackZipUrl,
                MixedTrackUrl = mixedTrackUrl,
                SourceTrackUrl = sourceTrackUrl,
                Genre = competition.Genre,
                SubmissionDeadline = competition.SubmissionDeadline,
                SongCreator = competition.SongCreator
            };
        }

        private async Task<string?> ProcessUrlAsync(string? urlOrPath)
        {
            if (string.IsNullOrEmpty(urlOrPath))
                return urlOrPath;

            // Check for double-encoded URLs (URLs that contain encoded URLs)
            if (urlOrPath.Contains("https%3A//") || urlOrPath.Contains("http%3A//"))
            {
                // This is a double-encoded URL - extract the inner URL
                try
                {
                    var uri = new Uri(urlOrPath);
                    var pathAndQuery = uri.PathAndQuery;

                    // Find the encoded URL part and decode it
                    var encodedUrlMatch = System.Text.RegularExpressions.Regex.Match(pathAndQuery, @"(https?%3A//[^/\s]+(?:/[^\s]*)*)");
                    if (encodedUrlMatch.Success)
                    {
                        var decodedUrl = System.Web.HttpUtility.UrlDecode(encodedUrlMatch.Value);
                        Console.WriteLine($"[URL_FIX] Fixed double-encoded URL: {urlOrPath} -> {decodedUrl}");
                        return decodedUrl;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[URL_FIX] Error processing double-encoded URL {urlOrPath}: {ex.Message}");
                }
            }

            // Check if it's already a full URL
            if (Uri.TryCreate(urlOrPath, UriKind.Absolute, out _))
            {
                // Already a full URL, use directly
                return urlOrPath;
            }
            else
            {
                // File path, generate URL
                return await _fileStorageService.GetFileUrlAsync(urlOrPath, TimeSpan.FromDays(365));
            }
        }
    }
}