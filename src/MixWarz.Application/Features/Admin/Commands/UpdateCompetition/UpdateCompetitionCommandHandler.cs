using MediatR;
using MixWarz.Domain.Interfaces;


namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetition
{
    public class UpdateCompetitionCommandHandler : IRequestHandler<UpdateCompetitionCommand, UpdateCompetitionResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;

        public UpdateCompetitionCommandHandler(
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService)
        {
            _competitionRepository = competitionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<UpdateCompetitionResponse> Handle(
            UpdateCompetitionCommand request,
            CancellationToken cancellationToken)
        {
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);

            if (competition == null)
            {
                return new UpdateCompetitionResponse
                {
                    Success = false,
                    Message = $"Competition with ID {request.CompetitionId} not found"
                };
            }

            // Update fields only if they are provided in the request
            if (request.Title != null)
            {
                competition.Title = request.Title;
            }

            if (request.Description != null)
            {
                competition.Description = request.Description;
            }

            if (request.Rules != null)
            {
                // Assuming rules are stored as text, not HTML with requirements embedded
                competition.RulesText = request.Rules;
            }

            if (request.StartDate.HasValue)
            {
                competition.StartDate = request.StartDate.Value;
            }

            if (request.EndDate.HasValue)
            {
                competition.EndDate = request.EndDate.Value;
            }

            if (request.PrizeDetails != null)
            {
                competition.PrizeDetails = request.PrizeDetails;
            }

            if (request.Status.HasValue)
            {
                competition.Status = request.Status.Value;
            }

            if (request.Genre.HasValue)
            {
                competition.Genre = request.Genre.Value;
            }

            if (request.SubmissionDeadline.HasValue)
            {
                competition.SubmissionDeadline = request.SubmissionDeadline.Value;
            }

            if (request.SongCreator != null)
            {
                competition.SongCreator = request.SongCreator;
            }

            if (request.OrganizerUserId != null)
            {
                competition.OrganizerUserId = request.OrganizerUserId;
            }

            // Handle cover image update
            if (request.CoverImage != null)
            {
                // Upload new image
                var imageKey = await _fileStorageService.UploadFileAsync(request.CoverImage, "competition-covers");
                var imageUrl = await _fileStorageService.GetFileUrlAsync(imageKey, TimeSpan.FromDays(365));
                competition.CoverImageUrl = imageUrl;
            }
            else if (request.ImageUrl != null)
            {
                // If ImageUrl is provided and no new file, use the provided URL (could be existing or new external)
                competition.CoverImageUrl = request.ImageUrl;
            }
            // If neither is provided, keep the existing ImageUrl (done implicitly by not updating the property)

            // Handle multitrack ZIP file update
            if (request.MultitrackZipFile != null)
            {
                // Upload new multitrack file
                var multitrackKey = await _fileStorageService.UploadFileAsync(request.MultitrackZipFile, "competition-multitracks");
                var multitrackUrl = await _fileStorageService.GetFileUrlAsync(multitrackKey, TimeSpan.FromDays(365));
                competition.MultitrackZipUrl = multitrackUrl;
            }
            else if (request.MultitrackZipUrl != null)
            {
                // If MultitrackZipUrl is provided and no new file, use the provided URL (could be existing or new external)
                competition.MultitrackZipUrl = request.MultitrackZipUrl;
            }
            // If neither is provided, keep the existing MultitrackZipUrl (done implicitly by not updating the property)

            // Handle source track file update
            if (request.SourceTrackFile != null)
            {
                // Upload new source track file
                var sourceTrackKey = await _fileStorageService.UploadFileAsync(request.SourceTrackFile, "competition-source-tracks");
                var sourceTrackUrl = await _fileStorageService.GetFileUrlAsync(sourceTrackKey, TimeSpan.FromDays(365));
                competition.SourceTrackUrl = sourceTrackUrl;
            }
            else if (request.SourceTrackUrl != null)
            {
                // If SourceTrackUrl is provided and no new file, use the provided URL (could be existing or new external)
                competition.SourceTrackUrl = request.SourceTrackUrl;
            }
            // If neither is provided, keep the existing SourceTrackUrl (done implicitly by not updating the property)

            // Handle requirements update - assuming requirements are stored separately or parsed from RulesText if needed
            // For now, we'll assume requirements are not directly updated via this command unless specified otherwise.
            // If Requirements list is provided, replace the existing list (or handle merging as needed)
            if (request.Requirements != null)
            {
                // This might require specific domain logic or a different approach depending on how requirements are stored
                // For simplicity, assuming direct replacement or clear in the domain model
                // Example: competition.Requirements = request.Requirements; // This depends on the entity structure
                // If requirements are part of RulesText, this section might be different
            }

            // Save the updated competition
            await _competitionRepository.UpdateAsync(competition);

            return new UpdateCompetitionResponse
            {
                Success = true,
                Message = "Competition updated successfully",
                CompetitionId = competition.CompetitionId,
                Title = competition.Title,
                Status = competition.Status.ToString(),
                CoverImageUrl = competition.CoverImageUrl,
                MultitrackZipUrl = competition.MultitrackZipUrl,
                SourceTrackUrl = competition.SourceTrackUrl,
                Genre = competition.Genre,
                SubmissionDeadline = competition.SubmissionDeadline,
                SongCreator = competition.SongCreator
            };
        }
    }
}