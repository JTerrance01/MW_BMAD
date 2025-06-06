using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Admin.Queries.GetCompetitionsList
{
    public class GetCompetitionsListQueryHandler : IRequestHandler<GetCompetitionsListQuery, CompetitionsListVm>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly UserManager<User> _userManager;
        private readonly IMapper _mapper;

        public GetCompetitionsListQueryHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            UserManager<User> userManager,
            IMapper mapper)
        {
            _competitionRepository = competitionRepository ?? throw new ArgumentNullException(nameof(competitionRepository));
            _submissionRepository = submissionRepository ?? throw new ArgumentNullException(nameof(submissionRepository));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<CompetitionsListVm> Handle(GetCompetitionsListQuery request, CancellationToken cancellationToken)
        {
            // Get all competitions
            var result = await _competitionRepository.GetCompetitionsForAdminAsync(
                request.OrganizerId,
                request.Statuses ?? (request.Status.HasValue ? new List<Domain.Enums.CompetitionStatus> { request.Status.Value } : null),
                request.SearchTerm,
                request.StartDateFrom,
                request.StartDateTo,
                request.Page,
                request.PageSize,
                cancellationToken);

            var competitions = result.Competitions;
            var totalCount = result.TotalCount;

            // Map competitions to DTOs
            var competitionDtos = _mapper.Map<List<CompetitionDto>>(competitions);

            // Enrich DTOs with additional data
            foreach (var dto in competitionDtos)
            {
                // Get organizer username
                var organizer = await _userManager.FindByIdAsync(dto.OrganizerId);
                dto.OrganizerUsername = organizer?.UserName ?? "Unknown";

                // Get submission count
                dto.NumberOfSubmissions = await _submissionRepository.GetSubmissionCountForCompetitionAsync(dto.Id, cancellationToken);
            }

            // Create and return the view model
            var vm = new CompetitionsListVm
            {
                Competitions = competitionDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return vm;
        }
    }
}