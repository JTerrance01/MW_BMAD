using MediatR;
using MixWarz.Application.Common.Utilities;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Submissions.Queries.GetSubmissionsList
{
    public class SubmissionDto
    {
        public int SubmissionId { get; set; }
        public int CompetitionId { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public DateTime SubmissionDate { get; set; }
        public string? AudioFilePath { get; set; }
        public string? MixTitle { get; set; }
        public string? MixDescription { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public SubmissionStatus Status { get; set; }
    }

    public class SubmissionListVm
    {
        public List<SubmissionDto> Submissions { get; set; } = new List<SubmissionDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class GetSubmissionsListQuery : IRequest<SubmissionListVm>
    {
        public int CompetitionId { get; set; }
        public string? OrganizerUserId { get; set; }
        public SubmissionStatus? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public bool IsAdmin { get; set; }
    }

    public class GetSubmissionsListQueryHandler : IRequestHandler<GetSubmissionsListQuery, SubmissionListVm>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;

        public GetSubmissionsListQueryHandler(
            ISubmissionRepository submissionRepository,
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService)
        {
            _submissionRepository = submissionRepository;
            _competitionRepository = competitionRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<SubmissionListVm> Handle(GetSubmissionsListQuery request, CancellationToken cancellationToken)
        {
            // Check if competition exists
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {request.CompetitionId} not found");
            }

            // Check if user is authorized to view submissions (admin or organizer)
            if (!request.IsAdmin && competition.OrganizerUserId != request.OrganizerUserId)
            {
                throw new Exception("You are not authorized to view submissions for this competition");
            }

            // Get submissions
            IEnumerable<Submission> submissions;
            if (request.Status.HasValue)
            {
                submissions = await _submissionRepository.GetByCompetitionIdAndStatusAsync(
                    request.CompetitionId,
                    request.Status.Value,
                    request.Page,
                    request.PageSize);
            }
            else
            {
                submissions = await _submissionRepository.GetByCompetitionIdAsync(
                    request.CompetitionId,
                    request.Page,
                    request.PageSize);
            }

            // Get total count
            int totalCount = await _submissionRepository.GetCountByCompetitionIdAsync(request.CompetitionId);

            // Generate pre-signed URLs for accessing audio files (valid for 1 hour)
            var submissionDtos = new List<SubmissionDto>();
            foreach (var submission in submissions)
            {
                // Generate a pre-signed URL for accessing the audio file (valid for 1 hour)
                var audioUrl = await FileUrlHelper.ResolveFileUrlAsync(
                    _fileStorageService,
                    submission.AudioFilePath,
                    TimeSpan.FromHours(1));

                submissionDtos.Add(new SubmissionDto
                {
                    SubmissionId = submission.SubmissionId,
                    CompetitionId = submission.CompetitionId,
                    UserId = submission.UserId,
                    Username = submission.User?.UserName,
                    SubmissionDate = submission.SubmissionDate,
                    AudioFilePath = audioUrl, // Use the pre-signed URL
                    MixTitle = submission.MixTitle,
                    MixDescription = submission.MixDescription,
                    Score = submission.FinalScore,
                    Feedback = submission.Feedback,
                    Status = submission.Status
                });
            }

            return new SubmissionListVm
            {
                Submissions = submissionDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}