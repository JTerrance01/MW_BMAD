using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Competitions.Commands.CreateCompetition
{
    public class CreateCompetitionCommand : IRequest<CreateCompetitionResponse>
    {
        // ID is null for new competitions, populated for updates
        public int? CompetitionId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Rules { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PrizeDetails { get; set; }
        public CompetitionStatus Status { get; set; }
        public string OrganizerUserId { get; set; }
        public IFormFile CoverImage { get; set; }
        public IFormFile MultitrackZipFile { get; set; }
        public string ImageUrl { get; set; } // For existing image URLs
        public string MultitrackZipUrl { get; set; } // For existing multitrack zip URLs
        public List<string> Requirements { get; set; } = new List<string>();
        // Added missing fields from Competition entity
        public Genre Genre { get; set; } = Genre.Unknown;
        public DateTime SubmissionDeadline { get; set; }
        public string SongCreator { get; set; }
    }

    public class CreateCompetitionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int CompetitionId { get; set; }
    }

    public class CreateCompetitionCommandValidator : AbstractValidator<CreateCompetitionCommand>
    {
        public CreateCompetitionCommandValidator()
        {
            // Determine if this is a create or update operation
            bool isUpdate(CreateCompetitionCommand c) => c.CompetitionId.HasValue && c.CompetitionId > 0;

            // Fields required for create operations or if provided for updates
            RuleFor(c => c.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(100).WithMessage("Title must not exceed 100 characters")
                .When(c => !isUpdate(c) || !string.IsNullOrEmpty(c.Title));

            RuleFor(c => c.Description)
                .NotEmpty().WithMessage("Description is required")
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
                .When(c => !isUpdate(c) || !string.IsNullOrEmpty(c.Description));

            // Rules are optional for initial creation
            RuleFor(c => c.Rules)
                .MaximumLength(10000).WithMessage("Rules must not exceed 10000 characters")
                .When(c => !string.IsNullOrEmpty(c.Rules));

            // Allow competitions to be created with dates in the past for development/testing
            RuleFor(c => c.StartDate)
                .NotEmpty().WithMessage("Start date is required")
                .When(c => !isUpdate(c) || c.StartDate != default);

            RuleFor(c => c.EndDate)
                .NotEmpty().WithMessage("End date is required")
                .GreaterThan(DateTime.MinValue).WithMessage("End date must be valid")
                .When(c => !isUpdate(c) || c.EndDate != default);

            RuleFor(c => c.SubmissionDeadline)
                .NotEmpty().WithMessage("Submission deadline is required")
                .GreaterThan(DateTime.MinValue).WithMessage("Submission deadline must be valid")
                .When(c => !isUpdate(c) || c.SubmissionDeadline != default);

            RuleFor(c => c.PrizeDetails)
                .NotEmpty().WithMessage("Prize details are required")
                .When(c => !isUpdate(c) || !string.IsNullOrEmpty(c.PrizeDetails));

            RuleFor(c => c.Genre)
                .NotEqual(Genre.Unknown).WithMessage("Genre must be specified")
                .When(c => !isUpdate(c) || c.Genre != Genre.Unknown);

            RuleFor(c => c.SongCreator)
                .NotEmpty().WithMessage("Song creator information is required")
                .When(c => !isUpdate(c) || !string.IsNullOrEmpty(c.SongCreator));

            // Make organizer ID validation conditional to allow system users
            When(c => !isUpdate(c), () =>
            {
                // Only validate OrganizerUserId in production, not in development
                RuleFor(c => c.OrganizerUserId)
                    .NotEmpty().When(_ => !System.Diagnostics.Debugger.IsAttached)
                    .WithMessage("Organizer user ID is required");
            });

            // Important: Handle the relationships between file uploads and URLs
            // Either CoverImage or ImageUrl is required, but not both
            RuleFor(c => new { c.CoverImage, c.ImageUrl })
                .Must(x => x.CoverImage != null || !string.IsNullOrEmpty(x.ImageUrl))
                .WithMessage("Either CoverImage file or ImageUrl is required")
                .When(c => !isUpdate(c)); // Only for new competitions

            // Either MultitrackZipFile or MultitrackZipUrl is required, but not both
            RuleFor(c => new { c.MultitrackZipFile, c.MultitrackZipUrl })
                .Must(x => x.MultitrackZipFile != null || !string.IsNullOrEmpty(x.MultitrackZipUrl))
                .WithMessage("Either MultitrackZipFile or MultitrackZipUrl is required")
                .When(c => !isUpdate(c)); // Only for new competitions

            // MultitrackZipFile validation
            When(c => c.MultitrackZipFile != null, () =>
            {
                RuleFor(c => c.MultitrackZipFile.ContentType)
                    .Must(ct => ct == "application/zip" || ct == "application/x-zip-compressed" || ct == "application/octet-stream")
                    .WithMessage("Multitrack file must be a ZIP file");

                RuleFor(c => c.MultitrackZipFile.FileName)
                    .Must(fn => fn.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                    .WithMessage("Multitrack file must have a .zip extension");

                RuleFor(c => c.MultitrackZipFile.Length)
                    .LessThanOrEqualTo(1024 * 1024 * 1024) // 1GB max
                    .WithMessage("Multitrack ZIP file must not exceed 1GB");
            });
        }
    }

    public class CreateCompetitionCommandHandler : IRequestHandler<CreateCompetitionCommand, CreateCompetitionResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;

        public CreateCompetitionCommandHandler(
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService)
        {
            _competitionRepository = competitionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<CreateCompetitionResponse> Handle(CreateCompetitionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine("CreateCompetitionCommandHandler - Starting processing");
                // Check if this is an update or create operation
                bool isUpdate = request.CompetitionId.HasValue && request.CompetitionId > 0;
                Console.WriteLine($"Operation type: {(isUpdate ? "Update" : "Create")}");

                // Handle cover image upload if one was provided
                string coverImagePath = null;
                if (request.CoverImage != null)
                {
                    Console.WriteLine($"Processing cover image: {request.CoverImage.FileName}, size: {request.CoverImage.Length / 1024} KB");
                    try
                    {
                        coverImagePath = await _fileStorageService.UploadFileAsync(
                            request.CoverImage,
                            "competition-covers");
                        Console.WriteLine($"Cover image uploaded successfully to: {coverImagePath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error uploading cover image: {ex.Message}");
                        return new CreateCompetitionResponse
                        {
                            Success = false,
                            Message = $"Failed to upload cover image: {ex.Message}",
                            CompetitionId = 0
                        };
                    }
                }
                else if (!string.IsNullOrEmpty(request.ImageUrl))
                {
                    // Use the existing image URL if provided
                    coverImagePath = request.ImageUrl;
                    Console.WriteLine($"Using existing image URL: {coverImagePath}");
                }

                // Handle multitrack zip file upload if one was provided
                string multitrackZipPath = null;
                if (request.MultitrackZipFile != null)
                {
                    Console.WriteLine($"Processing multitrack zip: {request.MultitrackZipFile.FileName}, size: {request.MultitrackZipFile.Length / 1024} KB");
                    try
                    {
                        multitrackZipPath = await _fileStorageService.UploadFileAsync(
                            request.MultitrackZipFile,
                            "competition-multitracks");
                        Console.WriteLine($"Multitrack zip uploaded successfully to: {multitrackZipPath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error uploading multitrack zip: {ex.Message}");
                        return new CreateCompetitionResponse
                        {
                            Success = false,
                            Message = $"Failed to upload multitrack zip: {ex.Message}",
                            CompetitionId = 0
                        };
                    }
                }
                else if (!string.IsNullOrEmpty(request.MultitrackZipUrl))
                {
                    // Use the existing zip URL if provided
                    multitrackZipPath = request.MultitrackZipUrl;
                    Console.WriteLine($"Using existing multitrack URL: {multitrackZipPath}");
                }

                // Format requirements as part of the rules
                string requirementsText = string.Empty;
                if (request.Requirements != null && request.Requirements.Count > 0)
                {
                    Console.WriteLine($"Processing {request.Requirements.Count} requirements");
                    requirementsText = "\n\n<h3>Requirements</h3>\n<ul>\n";
                    foreach (var req in request.Requirements)
                    {
                        requirementsText += $"<li>{req}</li>\n";
                    }
                    requirementsText += "</ul>";
                }

                // Determine competition status based on start date
                var now = DateTime.UtcNow;
                var status = request.Status != CompetitionStatus.Upcoming
                    ? (request.StartDate > now ? CompetitionStatus.Upcoming : CompetitionStatus.OpenForSubmissions)
                    : CompetitionStatus.Upcoming;
                Console.WriteLine($"Determined competition status: {status}");

                int competitionId;

                if (isUpdate)
                {
                    // Get the existing competition
                    Console.WriteLine($"Retrieving existing competition with ID: {request.CompetitionId.Value}");
                    var existingCompetition = await _competitionRepository.GetByIdAsync(request.CompetitionId.Value);

                    if (existingCompetition == null)
                    {
                        Console.WriteLine($"Competition with ID {request.CompetitionId.Value} not found");
                        return new CreateCompetitionResponse
                        {
                            Success = false,
                            Message = $"Competition with ID {request.CompetitionId.Value} not found",
                            CompetitionId = 0
                        };
                    }

                    // Update the existing competition
                    Console.WriteLine("Updating existing competition fields");
                    // Only update fields if they have been provided/changed
                    if (!string.IsNullOrEmpty(request.Title))
                        existingCompetition.Title = request.Title;
                    if (!string.IsNullOrEmpty(request.Description))
                        existingCompetition.Description = request.Description;
                    if (!string.IsNullOrEmpty(request.Rules))
                        existingCompetition.RulesText = request.Rules + requirementsText;
                    if (request.StartDate != default)
                        existingCompetition.StartDate = request.StartDate;
                    if (request.EndDate != default)
                        existingCompetition.EndDate = request.EndDate;
                    if (!string.IsNullOrEmpty(request.PrizeDetails))
                        existingCompetition.PrizeDetails = request.PrizeDetails;
                    if (request.Status != default)
                        existingCompetition.Status = status;
                    // Update Genre if specified and not default
                    if (request.Genre != Genre.Unknown)
                        existingCompetition.Genre = request.Genre;
                    // Update SubmissionDeadline if specified and not default
                    if (request.SubmissionDeadline != default)
                        existingCompetition.SubmissionDeadline = request.SubmissionDeadline;
                    // Update SongCreator if provided
                    if (!string.IsNullOrEmpty(request.SongCreator))
                        existingCompetition.SongCreator = request.SongCreator;

                    // Only update the cover image if a new one was provided
                    if (!string.IsNullOrEmpty(coverImagePath))
                    {
                        existingCompetition.CoverImageUrl = coverImagePath;
                    }

                    // Only update the multitrack zip if a new one was provided
                    if (!string.IsNullOrEmpty(multitrackZipPath))
                    {
                        existingCompetition.MultitrackZipUrl = multitrackZipPath;
                    }

                    Console.WriteLine("Calling repository to update competition");
                    await _competitionRepository.UpdateAsync(existingCompetition);
                    competitionId = existingCompetition.CompetitionId;
                    Console.WriteLine($"Competition updated successfully with ID: {competitionId}");

                    return new CreateCompetitionResponse
                    {
                        Success = true,
                        Message = "Competition updated successfully",
                        CompetitionId = competitionId
                    };
                }
                else
                {
                    // Create a new competition
                    Console.WriteLine("Creating new competition entity");
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
                        CreationDate = now,
                        CoverImageUrl = coverImagePath,
                        MultitrackZipUrl = multitrackZipPath,
                        Genre = request.Genre,
                        SubmissionDeadline = request.SubmissionDeadline,
                        SongCreator = request.SongCreator
                    };

                    Console.WriteLine("Calling repository to create competition");
                    competitionId = await _competitionRepository.CreateAsync(competition);
                    Console.WriteLine($"Competition created successfully with ID: {competitionId}");

                    return new CreateCompetitionResponse
                    {
                        Success = true,
                        Message = "Competition created successfully",
                        CompetitionId = competitionId
                    };
                }
            }
            catch (Exception ex)
            {
                // Log error
                Console.WriteLine($"Error processing competition: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
                }

                return new CreateCompetitionResponse
                {
                    Success = false,
                    Message = $"Failed to process competition: {ex.Message}",
                    CompetitionId = 0
                };
            }
        }
    }
}