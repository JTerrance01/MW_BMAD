using MediatR;
using MixWarz.Application.Common.Utilities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Submissions.Queries.GetUserSubmission
{
    public class UserSubmissionDto
    {
        public int SubmissionId { get; set; }
        public int CompetitionId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime SubmissionDate { get; set; }
        public string AudioFileUrl { get; set; } = string.Empty;
        public string MixTitle { get; set; } = string.Empty;
        public string MixDescription { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public SubmissionStatus Status { get; set; }
    }

    public class GetUserSubmissionQuery : IRequest<UserSubmissionDto?>
    {
        public int CompetitionId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

    public class GetUserSubmissionQueryHandler : IRequestHandler<GetUserSubmissionQuery, UserSubmissionDto?>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IFileStorageService _fileStorageService;

        public GetUserSubmissionQueryHandler(
            ISubmissionRepository submissionRepository,
            IFileStorageService fileStorageService)
        {
            _submissionRepository = submissionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<UserSubmissionDto?> Handle(GetUserSubmissionQuery request, CancellationToken cancellationToken)
        {
            // Add logging to help debug the 404 issue
            Console.WriteLine($"[GetUserSubmissionQuery] Looking for submission - CompetitionId: {request.CompetitionId}, UserId: {request.UserId}");

            var submissions = await _submissionRepository.GetByCompetitionIdAndUserIdAsync(
                request.CompetitionId,
                request.UserId);

            Console.WriteLine($"[GetUserSubmissionQuery] Found {submissions.Count()} submissions for user {request.UserId} in competition {request.CompetitionId}");

            var submission = submissions.FirstOrDefault();
            if (submission == null)
            {
                Console.WriteLine($"[GetUserSubmissionQuery] No submission found for user {request.UserId} in competition {request.CompetitionId}");
                return null;
            }

            Console.WriteLine($"[GetUserSubmissionQuery] Found submission with ID: {submission.SubmissionId}, Title: {submission.MixTitle}");
            Console.WriteLine($"[GetUserSubmissionQuery] Submission AudioFilePath: {submission.AudioFilePath}");

            // Generate a secure URL for the audio file (valid for 1 hour)
            var audioFileUrl = await FileUrlHelper.ResolveFileUrlAsync(
                _fileStorageService,
                submission.AudioFilePath,
                TimeSpan.FromHours(1));

            return new UserSubmissionDto
            {
                SubmissionId = submission.SubmissionId,
                CompetitionId = submission.CompetitionId,
                UserId = submission.UserId,
                Username = submission.User?.UserName ?? "Unknown",
                SubmissionDate = submission.SubmissionDate,
                AudioFileUrl = audioFileUrl,
                MixTitle = submission.MixTitle,
                MixDescription = submission.MixDescription ?? string.Empty,
                Score = submission.FinalScore,
                Feedback = submission.Feedback,
                Status = submission.Status
            };
        }
    }
}