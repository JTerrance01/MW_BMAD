using MediatR;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Competitions.Queries.GetCompetitionsList
{
    public class CompetitionDto
    {
        public int CompetitionId { get; set; }
        public int Id { get; set; } // Alternative ID property for frontend compatibility
        public string? Title { get; set; }
        public string? Description { get; set; }
        public CompetitionStatus Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime SubmissionDeadline { get; set; }
        public string? OrganizerUsername { get; set; }
        public string? ImageUrl { get; set; } // Mapped from CoverImageUrl for frontend compatibility
        public string? CoverImageUrl { get; set; } // Keep original property name as well
        public Genre Genre { get; set; }
        public string? PrizeDetails { get; set; }
        public int SubmissionsCount { get; set; }
        public string? SongCreator { get; set; }
    }

    public class CompetitionListVm
    {
        public List<CompetitionDto> Competitions { get; set; } = new List<CompetitionDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class GetCompetitionsListQuery : IRequest<CompetitionListVm>
    {
        public CompetitionStatus? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class GetCompetitionsListQueryHandler : IRequestHandler<GetCompetitionsListQuery, CompetitionListVm>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public GetCompetitionsListQueryHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
        }

        public async Task<CompetitionListVm> Handle(GetCompetitionsListQuery request, CancellationToken cancellationToken)
        {
            IEnumerable<Competition> competitions;
            int totalCount;

            if (request.Status.HasValue)
            {
                competitions = await _competitionRepository.GetByStatusAsync(request.Status.Value, request.Page, request.PageSize);
                totalCount = await _competitionRepository.GetCountByStatusAsync(request.Status.Value);
            }
            else
            {
                competitions = await _competitionRepository.GetAllAsync(request.Page, request.PageSize);
                totalCount = await _competitionRepository.GetTotalCountAsync();
            }

            // Map to DTO with all required fields
            var competitionDtos = new List<CompetitionDto>();

            foreach (var c in competitions)
            {
                // Get submission count for this competition
                var submissionCount = await _submissionRepository.GetSubmissionCountForCompetitionAsync(c.CompetitionId, cancellationToken);

                var dto = new CompetitionDto
                {
                    CompetitionId = c.CompetitionId,
                    Id = c.CompetitionId, // Add alternative ID for frontend compatibility
                    Title = c.Title,
                    Description = c.Description,
                    Status = c.Status,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    SubmissionDeadline = c.SubmissionDeadline,
                    OrganizerUsername = c.Organizer?.UserName,
                    ImageUrl = c.CoverImageUrl, // Map CoverImageUrl to ImageUrl for frontend compatibility
                    CoverImageUrl = c.CoverImageUrl, // Keep original property name as well
                    Genre = c.Genre,
                    PrizeDetails = c.PrizeDetails,
                    SubmissionsCount = submissionCount,
                    SongCreator = c.SongCreator
                };

                competitionDtos.Add(dto);
            }

            return new CompetitionListVm
            {
                Competitions = competitionDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}