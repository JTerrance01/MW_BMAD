using MediatR;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Submissions.Commands.DeleteSubmission
{
    public class DeleteSubmissionCommand : IRequest<DeleteSubmissionResponse>
    {
        public int SubmissionId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

    public class DeleteSubmissionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class DeleteSubmissionCommandHandler : IRequestHandler<DeleteSubmissionCommand, DeleteSubmissionResponse>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;

        public DeleteSubmissionCommandHandler(
            ISubmissionRepository submissionRepository,
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService)
        {
            _submissionRepository = submissionRepository;
            _competitionRepository = competitionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<DeleteSubmissionResponse> Handle(DeleteSubmissionCommand request, CancellationToken cancellationToken)
        {
            // Get the submission
            var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId);
            if (submission == null)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = "Submission not found"
                };
            }

            // Verify the user owns this submission
            if (submission.UserId != request.UserId)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = "You are not authorized to delete this submission"
                };
            }

            // Get the competition to check if submissions are still allowed
            var competition = await _competitionRepository.GetByIdAsync(submission.CompetitionId);
            if (competition == null)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = "Competition not found"
                };
            }

            // Check if competition is still open for submissions
            if (competition.Status != CompetitionStatus.OpenForSubmissions)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = "Cannot delete submission - competition is no longer open for submissions"
                };
            }

            // Check if deadline has passed
            if (DateTime.UtcNow > competition.SubmissionDeadline)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = "Cannot delete submission - submission deadline has passed"
                };
            }

            try
            {
                // Delete the audio file from storage
                await _fileStorageService.DeleteFileAsync(submission.AudioFilePath);

                // Delete the submission from database
                await _submissionRepository.DeleteAsync(submission);

                return new DeleteSubmissionResponse
                {
                    Success = true,
                    Message = "Submission deleted successfully"
                };
            }
            catch (Exception ex)
            {
                return new DeleteSubmissionResponse
                {
                    Success = false,
                    Message = $"Failed to delete submission: {ex.Message}"
                };
            }
        }
    }
}