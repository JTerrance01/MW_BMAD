using MediatR;
using MixWarz.Application.Common.Utilities;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Submissions.Queries.GetUserSubmissions
{
    public class UserSubmissionDto
    {
        public int SubmissionId { get; set; }
        public int CompetitionId { get; set; }
        public string? CompetitionTitle { get; set; }
        public string? CompetitionImageUrl { get; set; }
        public CompetitionStatus CompetitionStatus { get; set; }
        public DateTime SubmissionDate { get; set; }
        public string? AudioFilePath { get; set; }
        public string? MixTitle { get; set; }
        public string? MixDescription { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public SubmissionStatus Status { get; set; }
        public int? Ranking { get; set; }
        public bool CanDelete { get; set; }
    }

    public class UserSubmissionsListVm
    {
        public List<UserSubmissionDto> Submissions { get; set; } = new List<UserSubmissionDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
    }

    public class GetUserSubmissionsQuery : IRequest<UserSubmissionsListVm>
    {
        public string UserId { get; set; } = string.Empty;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public SubmissionStatus? StatusFilter { get; set; }
        public CompetitionStatus? CompetitionStatusFilter { get; set; }
    }

    public class GetUserSubmissionsQueryHandler : IRequestHandler<GetUserSubmissionsQuery, UserSubmissionsListVm>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IFileStorageService _fileStorageService;

        public GetUserSubmissionsQueryHandler(
            ISubmissionRepository submissionRepository,
            ICompetitionRepository competitionRepository,
            IUserRepository userRepository,
            IFileStorageService fileStorageService)
        {
            _submissionRepository = submissionRepository;
            _competitionRepository = competitionRepository;
            _userRepository = userRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<UserSubmissionsListVm> Handle(GetUserSubmissionsQuery request, CancellationToken cancellationToken)
        {
            // Verify user exists
            var user = await _userRepository.GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new Exception($"User with ID {request.UserId} not found");
            }

            // Get submissions for the user
            var submissions = await _submissionRepository.GetByUserIdAsync(
                request.UserId,
                request.Page,
                request.PageSize);

            // Get total count for pagination
            var totalCount = await _submissionRepository.GetCountByUserIdAsync(request.UserId);

            // Create result list
            var submissionDtos = new List<UserSubmissionDto>();

            foreach (var submission in submissions)
            {
                // Get competition details
                var competition = await _competitionRepository.GetByIdAsync(submission.CompetitionId);
                if (competition == null) continue;

                // Apply filters if specified
                if (request.StatusFilter.HasValue && submission.Status != request.StatusFilter.Value)
                    continue;

                if (request.CompetitionStatusFilter.HasValue && competition.Status != request.CompetitionStatusFilter.Value)
                    continue;

                // Generate secure audio URL
                var audioUrl = await FileUrlHelper.ResolveFileUrlAsync(
                    _fileStorageService,
                    submission.AudioFilePath,
                    TimeSpan.FromHours(2)); // 2-hour access

                // Resolve competition image URL
                var competitionImageUrl = await FileUrlHelper.ResolveFileUrlAsync(
                    _fileStorageService,
                    competition.CoverImageUrl,
                    TimeSpan.FromHours(24)); // 24-hour access for competition images

                // Determine if user can delete this submission
                var canDelete = competition.Status == CompetitionStatus.OpenForSubmissions &&
                               DateTime.UtcNow <= competition.SubmissionDeadline;

                submissionDtos.Add(new UserSubmissionDto
                {
                    SubmissionId = submission.SubmissionId,
                    CompetitionId = submission.CompetitionId,
                    CompetitionTitle = competition.Title,
                    CompetitionImageUrl = competitionImageUrl,
                    CompetitionStatus = competition.Status,
                    SubmissionDate = submission.SubmissionDate,
                    AudioFilePath = audioUrl,
                    MixTitle = submission.MixTitle,
                    MixDescription = submission.MixDescription,
                    Score = submission.FinalScore,
                    Feedback = submission.Feedback,
                    Status = submission.Status,
                    Ranking = submission.FinalRank,
                    CanDelete = canDelete
                });
            }

            return new UserSubmissionsListVm
            {
                Submissions = submissionDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                UserId = request.UserId,
                Username = user.UserName
            };
        }
    }
}