using MediatR;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MixWarz.Application.Common.Options;

namespace MixWarz.Application.Features.Admin.Commands.CreateCompetition
{
    public class CreateCompetitionCommandHandler : IRequestHandler<CreateCompetitionCommand, CreateCompetitionResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<CreateCompetitionCommandHandler> _logger;
        private readonly IOptions<CompetitionTimingOptions> _timingOptions;

        public CreateCompetitionCommandHandler(
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService,
            ILogger<CreateCompetitionCommandHandler> logger,
            IOptions<CompetitionTimingOptions> timingOptions)
        {
            _competitionRepository = competitionRepository ?? throw new ArgumentNullException(nameof(competitionRepository));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _timingOptions = timingOptions ?? throw new ArgumentNullException(nameof(timingOptions));
        }

        public async Task<CreateCompetitionResponse> Handle(CreateCompetitionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("CreateCompetitionCommandHandler - Starting processing");

                // Check if this is an update or create operation
                bool isUpdate = request.CompetitionId.HasValue && request.CompetitionId > 0;
                _logger.LogInformation($"Operation type: {(isUpdate ? "Update" : "Create")}");

                // File uploads are now handled in the controller before this handler runs
                // URLs are already populated in the request
                _logger.LogInformation("Using provided URLs - Cover: {CoverUrl}, Multitrack: {MultitrackUrl}, Source: {SourceUrl}",
                    request.ImageUrl, request.MultitrackZipUrl, request.SourceTrackUrl);

                // Format requirements as part of the rules
                string requirementsText = string.Empty;
                if (request.Requirements != null && request.Requirements.Count > 0)
                {
                    _logger.LogInformation($"Processing {request.Requirements.Count} requirements");
                    requirementsText = "\n\n<h3>Requirements</h3>\n<ul>\n";
                    foreach (var req in request.Requirements)
                    {
                        requirementsText += $"<li>{req}</li>\n";
                    }
                    requirementsText += "</ul>";
                }

                // Determine competition status based on start date if not explicitly specified
                var now = DateTime.UtcNow;
                var status = request.Status;

                // If status is not explicitly set to something other than Upcoming, determine based on dates
                if (status == CompetitionStatus.Upcoming)
                {
                    status = request.StartDate > now ? CompetitionStatus.Upcoming : CompetitionStatus.OpenForSubmissions;
                }

                _logger.LogInformation($"Determined competition status: {status}");

                int competitionId;

                if (isUpdate)
                {
                    // Get the existing competition
                    _logger.LogInformation("Retrieving existing competition with ID: {CompetitionId}", request.CompetitionId.Value);
                    var existingCompetition = await _competitionRepository.GetByIdAsync(request.CompetitionId.Value);

                    if (existingCompetition == null)
                    {
                        _logger.LogWarning("Competition with ID {CompetitionId} not found", request.CompetitionId.Value);
                        return new CreateCompetitionResponse
                        {
                            Success = false,
                            Message = $"Competition with ID {request.CompetitionId.Value} not found",
                            Errors = new List<string> { $"Competition with ID {request.CompetitionId.Value} not found" }
                        };
                    }

                    // Update the existing competition
                    _logger.LogInformation("Updating existing competition fields");

                    // Always update provided fields
                    if (!string.IsNullOrWhiteSpace(request.Title))
                        existingCompetition.Title = request.Title;

                    if (!string.IsNullOrWhiteSpace(request.Description))
                        existingCompetition.Description = request.Description;

                    if (!string.IsNullOrWhiteSpace(request.Rules))
                        existingCompetition.RulesText = request.Rules + requirementsText;

                    if (request.StartDate != default)
                        existingCompetition.StartDate = request.StartDate;

                    if (request.EndDate != default)
                        existingCompetition.EndDate = request.EndDate;

                    if (!string.IsNullOrWhiteSpace(request.PrizeDetails))
                        existingCompetition.PrizeDetails = request.PrizeDetails;

                    // Only update status if it's provided and valid
                    if (request.Status != default && Enum.IsDefined(typeof(CompetitionStatus), request.Status))
                        existingCompetition.Status = request.Status;

                    if (request.Genre != Genre.Unknown && Enum.IsDefined(typeof(Genre), request.Genre))
                        existingCompetition.Genre = request.Genre;

                    if (request.SubmissionDeadline != default)
                    {
                        existingCompetition.SubmissionDeadline = request.SubmissionDeadline;

                        // Recalculate automated phase dates when submission deadline changes
                        var competitionTimingOptions = _timingOptions.Value;
                        existingCompetition.Round1VotingEndDate = existingCompetition.SubmissionDeadline.AddDays(competitionTimingOptions.DaysForRound1Voting);
                        existingCompetition.Round2VotingEndDate = existingCompetition.Round1VotingEndDate.AddDays(competitionTimingOptions.DaysForRound2Voting);
                        _logger.LogInformation("Updated automated phase dates - Round1VotingEndDate: {Round1End}, Round2VotingEndDate: {Round2End}",
                            existingCompetition.Round1VotingEndDate, existingCompetition.Round2VotingEndDate);
                    }

                    if (!string.IsNullOrWhiteSpace(request.SongCreator))
                        existingCompetition.SongCreator = request.SongCreator;

                    // Only update the cover image if a new one was provided
                    if (!string.IsNullOrEmpty(request.ImageUrl))
                    {
                        existingCompetition.CoverImageUrl = EnsureAbsoluteUrl(request.ImageUrl);
                        _logger.LogInformation("Updated cover image URL: {CoverImageUrl}", existingCompetition.CoverImageUrl);
                    }

                    // Only update the multitrack zip if a new one was provided
                    if (!string.IsNullOrEmpty(request.MultitrackZipUrl))
                    {
                        existingCompetition.MultitrackZipUrl = EnsureAbsoluteUrl(request.MultitrackZipUrl);
                        _logger.LogInformation("Updated multitrack ZIP URL: {MultitrackZipUrl}", existingCompetition.MultitrackZipUrl);
                    }

                    // Only update the source track if a new one was provided
                    if (!string.IsNullOrEmpty(request.SourceTrackUrl))
                    {
                        existingCompetition.SourceTrackUrl = EnsureAbsoluteUrl(request.SourceTrackUrl);
                        _logger.LogInformation("Updated source track URL: {SourceTrackUrl}", existingCompetition.SourceTrackUrl);
                    }

                    _logger.LogInformation("Calling repository to update competition");
                    await _competitionRepository.UpdateAsync(existingCompetition);
                    competitionId = existingCompetition.CompetitionId;
                    _logger.LogInformation("Competition updated successfully with ID: {CompetitionId}", competitionId);

                    return new CreateCompetitionResponse
                    {
                        Success = true,
                        Message = "Competition updated successfully",
                        CompetitionId = competitionId,
                        Title = existingCompetition.Title,
                        Status = existingCompetition.Status.ToString(),
                        CoverImageUrl = existingCompetition.CoverImageUrl
                    };
                }
                else
                {
                    // Create a new competition
                    _logger.LogInformation("Creating new competition");

                    // ENSURE ABSOLUTE URLS: Process URLs to ensure they are absolute before saving to database
                    var processedImageUrl = EnsureAbsoluteUrl(request.ImageUrl);
                    var processedMultitrackUrl = EnsureAbsoluteUrl(request.MultitrackZipUrl);
                    var processedSourceTrackUrl = EnsureAbsoluteUrl(request.SourceTrackUrl);

                    _logger.LogInformation("Processed URLs - Image: {ImageUrl}, Multitrack: {MultitrackUrl}, SourceTrack: {SourceTrackUrl}",
                        processedImageUrl, processedMultitrackUrl, processedSourceTrackUrl);

                    var competition = new Competition
                    {
                        Title = request.Title,
                        Description = request.Description,
                        RulesText = request.Rules + requirementsText,
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        PrizeDetails = request.PrizeDetails,
                        Status = status,
                        OrganizerUserId = request.OrganizerUserId,
                        CreationDate = DateTime.UtcNow,
                        CoverImageUrl = processedImageUrl,
                        MultitrackZipUrl = processedMultitrackUrl,
                        SourceTrackUrl = processedSourceTrackUrl,
                        Genre = request.Genre,
                        SubmissionDeadline = request.SubmissionDeadline,
                        SongCreator = request.SongCreator
                    };

                    // Calculate automated phase dates based on submission deadline and configured options
                    var competitionTimingOptions = _timingOptions.Value;
                    competition.Round1VotingEndDate = competition.SubmissionDeadline.AddDays(competitionTimingOptions.DaysForRound1Voting);
                    competition.Round2VotingEndDate = competition.Round1VotingEndDate.AddDays(competitionTimingOptions.DaysForRound2Voting);
                    _logger.LogInformation("Calculated automated phase dates - Round1VotingEndDate: {Round1End}, Round2VotingEndDate: {Round2End}",
                        competition.Round1VotingEndDate, competition.Round2VotingEndDate);

                    _logger.LogInformation("Calling repository to create competition");
                    competitionId = await _competitionRepository.CreateAsync(competition);
                    _logger.LogInformation($"Competition created successfully with ID: {competitionId}");

                    return new CreateCompetitionResponse
                    {
                        Success = true,
                        Message = "Competition created successfully",
                        CompetitionId = competitionId,
                        Title = competition.Title,
                        Status = competition.Status.ToString(),
                        CoverImageUrl = competition.CoverImageUrl
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateCompetitionCommandHandler");
                return new CreateCompetitionResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        /// <summary>
        /// Ensures the URL is absolute format for database storage.
        /// Converts relative URLs to absolute URLs using localhost:7001 as base.
        /// </summary>
        /// <param name="url">The URL to process</param>
        /// <returns>Absolute URL in format: https://localhost:7001/uploads/directory/filename.ext</returns>
        private string EnsureAbsoluteUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                return url;

            // If already absolute, return as-is
            if (url.StartsWith("http://") || url.StartsWith("https://"))
            {
                _logger.LogInformation("URL is already absolute: {Url}", url);
                return url;
            }

            // For relative URLs, convert to absolute
            const string baseUrl = "https://localhost:7001";

            // Remove leading slash if present
            var cleanPath = url.StartsWith("/") ? url.Substring(1) : url;

            // Construct absolute URL
            var absoluteUrl = $"{baseUrl}/{cleanPath}";

            // Clean up any duplicate /uploads/ patterns
            absoluteUrl = absoluteUrl.Replace("/uploads/uploads/", "/uploads/");

            _logger.LogInformation("Converted relative URL to absolute: {OriginalUrl} → {AbsoluteUrl}", url, absoluteUrl);

            return absoluteUrl;
        }
    }
}